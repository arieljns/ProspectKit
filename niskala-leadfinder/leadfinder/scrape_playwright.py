"""Playwright scraper: a real, headed Chromium on your own logged-in profile.

It only reads the JSON responses that Shopee's own pages load (response interception).
It never calls Shopee's API itself, never runs requests in parallel, and pauses for
you whenever Shopee shows a verification, CAPTCHA or login wall.
"""

from __future__ import annotations

import json
import random
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote, urlsplit

from . import db
from .config import RAW_DIR, ROOT
from .extract import extract_socials
from .parse import Capture, ParseConfig, ShopVisit, build_visit, looks_blocked, rank_candidates, scrub

BASE_URL = "https://shopee.co.id"
# Responses from these paths are about *your* account, never about a shop; ignore them.
SKIP_URL_PARTS = (
    "/account/",
    "/cart",
    "/buyer/",
    "/order",
    "/notification",
    "/chat",
    "/checkout",
    "/coin",
    "/wallet",
    "/address",
    "/login",
    "/auth",
)
WALL_URL_PARTS = ("/verify/", "/buyer/login", "captcha", "anti_bot", "anti-bot", "/login?")


@dataclass
class ScrapeOptions:
    keywords: list[str]
    pages: int
    max_shops: int
    refresh: bool = False
    delay_min_s: float = 5
    delay_max_s: float = 11
    skip_recent_days: int = 14
    skip_official_candidates: bool = True
    scroll_steps_search: int = 8
    scroll_steps_shop: int = 10
    profile_dir: str = ".shopee-profile"
    browser_executable: str = ""

    @classmethod
    def from_config(cls, cfg: dict[str, Any], **overrides: Any) -> "ScrapeOptions":
        s = cfg.get("scrape", {})
        values = {
            "keywords": list(s.get("keywords", [])),
            "pages": int(s.get("search_pages", 2)),
            "max_shops": int(s.get("max_shops", 40)),
            "delay_min_s": float(s.get("delay_min_s", 5)),
            "delay_max_s": float(s.get("delay_max_s", 11)),
            "skip_recent_days": int(s.get("skip_recent_days", 14)),
            "skip_official_candidates": bool(s.get("skip_official_candidates", True)),
            "scroll_steps_search": int(s.get("scroll_steps_search", 8)),
            "scroll_steps_shop": int(s.get("scroll_steps_shop", 10)),
            "profile_dir": str(s.get("profile_dir", ".shopee-profile")),
            "browser_executable": str(s.get("browser_executable", "")),
        }
        values.update({k: v for k, v in overrides.items() if v is not None})
        return cls(**values)


def new_run_id() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


class Collector:
    """Receives every network response, keeps the Shopee JSON that contains items or shops."""

    def __init__(self, raw_dir: Path) -> None:
        self.raw_dir = raw_dir
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.capture = Capture()
        self.context: dict[str, Any] = {"phase": "start"}
        self.blocked = False
        self.page_items = 0
        self.page_shops = 0
        self._saved = 0

    def start_page(self, context: dict[str, Any]) -> None:
        self.context = context
        self.blocked = False
        self.page_items = self.page_shops = 0

    def on_response(self, response: Any) -> None:
        try:
            url = response.url
            if "/api/" not in url or any(part in url for part in SKIP_URL_PARTS):
                return
            if "json" not in (response.headers.get("content-type") or ""):
                return
            body = response.json()
        except Exception:  # navigation away, redirect without body, non-JSON body...
            return
        self.handle_body(url, body)

    def handle_body(self, url: str, body: Any) -> None:
        if looks_blocked(body):
            self.blocked = True
            return
        body = scrub(body)  # personal fields never reach memory, disk or the database
        n_items, n_shops = self.capture.add(body)
        if not (n_items or n_shops):
            return
        self.page_items += n_items
        self.page_shops += n_shops
        self._saved += 1
        parts = urlsplit(url)
        record = {
            "url": parts.path + (f"?{parts.query}" if parts.query else ""),
            "captured_at": db.now_ts(),
            "context": self.context,
            "body": body,
        }
        name = f"{self._saved:04d}_{self.context.get('phase', 'page')}.json"
        (self.raw_dir / name).write_text(json.dumps(record, ensure_ascii=False), encoding="utf-8")

    def log_page(self, url: str, ok: bool) -> None:
        entry = {
            **self.context,
            "url": urlsplit(url).path,
            "ok": ok,
            "items": self.page_items,
            "shops": self.page_shops,
        }
        with open(self.raw_dir / "visits.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")


Ask = Callable[[str], str]


def _first_line(exc: BaseException) -> str:
    return (str(exc).strip().splitlines() or [type(exc).__name__])[0]


def _browser_gone(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return any(s in msg for s in ("connection closed", "has been closed", "target closed", "browser closed"))


def _wall_showing(page: Any, collector: Collector) -> bool:
    url = (page.url or "").lower()
    return collector.blocked or any(part in url for part in WALL_URL_PARTS)


def _slow_scroll(page: Any, steps: int) -> None:
    for _ in range(steps):
        page.mouse.wheel(0, random.randint(450, 900))
        page.wait_for_timeout(random.randint(700, 1600))


def load_page(
    page: Any,
    url: str,
    collector: Collector,
    context: dict[str, Any],
    scroll_steps: int,
    opts: ScrapeOptions,
    ask: Ask,
    sleep: Callable[[float], None],
    out: Callable[[str], None],
) -> bool:
    """One polite page load: random pause, load, check for walls, slow scroll."""
    from playwright.sync_api import Error as PlaywrightError
    from playwright.sync_api import TimeoutError as PlaywrightTimeout

    for _attempt in range(3):
        sleep(random.uniform(opts.delay_min_s, opts.delay_max_s))
        collector.start_page(context)
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        except PlaywrightTimeout:
            out(f"  page load timed out: {url}")
        except PlaywrightError as exc:
            if _browser_gone(exc):
                raise
            out(f"  page load failed: {_first_line(exc)}")
        page.wait_for_timeout(random.randint(1500, 3000))
        if not _wall_showing(page, collector):
            _slow_scroll(page, scroll_steps)
        if _wall_showing(page, collector):
            ask(
                "\n  Shopee is showing a verification / CAPTCHA / login page.\n"
                "  Solve it in the browser window, then press Enter here to retry this page... "
            )
            continue
        if collector.page_items or collector.page_shops:
            collector.log_page(url, ok=True)
            return True
        answer = ask(
            "\n  Nothing was captured on this page. If the browser shows a verification or login wall,\n"
            "  solve it there, then press Enter to retry (or type s + Enter to skip this page): "
        )
        if answer.strip().lower().startswith("s"):
            break
    collector.log_page(url, ok=False)
    return False


def _launch(pw: Any, opts: ScrapeOptions) -> Any:
    kwargs: dict[str, Any] = {"headless": False, "locale": "id-ID", "no_viewport": True}
    if opts.browser_executable:
        kwargs["executable_path"] = opts.browser_executable
    profile = Path(opts.profile_dir)
    if not profile.is_absolute():
        profile = ROOT / profile
    return pw.chromium.launch_persistent_context(str(profile), **kwargs)


def _shop_line(visit: ShopVisit, label: str | None, score: int | None) -> str:
    s = visit.shop
    socials = extract_socials(s.description)
    sold = visit.monthly_sold_seen
    bits = [
        f"{len(visit.items)} items",
        f"sold/mo ≥{sold}" if sold is not None else "sold/mo ?",
        f"followers {s.followers}" if s.followers is not None else "followers ?",
        f"IG {socials.instagram}" if socials.instagram else "",
        f"TikTok {socials.tiktok}" if socials.tiktok else "",
        f"website {socials.website}" if socials.website else "",
        "" if visit.has_profile else "NO PROFILE CAPTURED",
    ]
    tail = f" -> {label} {score}" if label else ""
    return f"{s.name or '?'}: " + ", ".join(b for b in bits if b) + tail


def _save(
    conn: sqlite3.Connection, cfg: dict[str, Any], run_id: str, visit: ShopVisit
) -> tuple[str | None, int | None]:
    db.save_visit(conn, run_id, visit)
    db.rescore(conn, cfg, [visit.shop.shopid])
    row = conn.execute("SELECT icp_label, icp_score FROM leads WHERE shopid = ?", (visit.shop.shopid,)).fetchone()
    return (row["icp_label"], row["icp_score"]) if row else (None, None)


def run(
    conn: sqlite3.Connection,
    cfg: dict[str, Any],
    opts: ScrapeOptions,
    *,
    base_url: str = BASE_URL,
    raw_root: Path = RAW_DIR,
    ask: Ask = input,
    sleep: Callable[[float], None] = time.sleep,
    out: Callable[[str], None] = print,
) -> tuple[str, list[ShopVisit]]:
    """Scrape search results and shop pages. Returns (run_id, shops saved).

    Every shop is written to the database right after its page is read, so Ctrl+C
    keeps everything collected so far.
    """
    from playwright.sync_api import Error as PlaywrightError
    from playwright.sync_api import sync_playwright

    pcfg = ParseConfig.from_config(cfg)
    run_id = new_run_id()
    raw_dir = raw_root / run_id
    collector = Collector(raw_dir)
    (raw_dir / "run.json").write_text(
        json.dumps({"run_id": run_id, "source": "playwright", "keywords": opts.keywords}, ensure_ascii=False),
        encoding="utf-8",
    )
    db.start_run(conn, run_id, "playwright", opts.keywords)
    out(f"Run {run_id}: raw JSON -> {raw_dir}")

    saved: list[ShopVisit] = []
    notes: list[str] = []
    phase = "start"
    pending: int | None = None
    pw = ctx = None
    try:
        pw = sync_playwright().start()
        ctx = _launch(pw, opts)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.on("response", collector.on_response)
        try:
            page.goto(base_url, wait_until="domcontentloaded", timeout=60_000)
        except PlaywrightError as exc:
            if _browser_gone(exc):
                raise
            notes.append(f"could not open {base_url}: {_first_line(exc)}")
            out(f"Could not open {base_url}: {_first_line(exc)}\nCheck your internet connection and run again.")
            return run_id, saved
        ask(
            "\nThe Shopee window is open. Log in there if you are not logged in yet\n"
            "(only needed once; the profile is kept in .shopee-profile/), then press Enter here to start... "
        )

        phase = "search"
        for kw in opts.keywords:
            for n in range(opts.pages):
                out(f"Search '{kw}' page {n + 1}/{opts.pages}")
                load_page(
                    page,
                    f"{base_url}/search?keyword={quote(kw)}&page={n}",
                    collector,
                    {"phase": "search", "keyword": kw, "page": n},
                    opts.scroll_steps_search,
                    opts,
                    ask,
                    sleep,
                    out,
                )

        candidates = rank_candidates(collector.capture, pcfg)
        recent = set() if opts.refresh else db.recently_seen(conn, opts.skip_recent_days)
        official = {sid for sid, _sold, off in candidates if off} if opts.skip_official_candidates else set()
        pool = [sid for sid, _sold, _off in candidates if sid not in official and sid not in recent]
        selected = pool[: opts.max_shops]
        out(
            f"\n{len(candidates)} shops in search results: {len(official)} Shopee Mall skipped, "
            f"{len((recent - official) & {sid for sid, _s, _o in candidates})} seen in the last "
            f"{opts.skip_recent_days} days skipped. Visiting {len(selected)}.\n"
        )

        phase = "shops"
        for i, shopid in enumerate(selected, start=1):
            pending = shopid
            out(f"[{i}/{len(selected)}] shop {shopid}")
            load_page(
                page,
                f"{base_url}/shop/{shopid}",
                collector,
                {"phase": "shop", "shopid": shopid},
                opts.scroll_steps_shop,
                opts,
                ask,
                sleep,
                out,
            )
            visit = build_visit(collector.capture, shopid, pcfg)
            pending = None
            if visit:
                label, score = _save(conn, cfg, run_id, visit)
                saved.append(visit)
                out(f"  {_shop_line(visit, label, score)}")
    except (KeyboardInterrupt, Exception) as exc:
        # On Ctrl+C the Playwright driver gets SIGINT too and often dies first, so an
        # interrupt can surface as "connection closed" instead of KeyboardInterrupt.
        by_user = isinstance(exc, KeyboardInterrupt) or _browser_gone(exc)
        reason = "interrupted (Ctrl+C or browser window closed)" if by_user else f"error: {_first_line(exc)}"
        notes.append(f"{reason} during {phase}")
        out(f"\nStopped, {reason}. Saving what was collected...")
        if pending is not None:
            visit = build_visit(collector.capture, pending, pcfg)
            if visit:
                _save(conn, cfg, run_id, visit)
                saved.append(visit)
        if not by_user:
            raise
    finally:
        db.finish_run(conn, run_id, len(saved), "; ".join(notes) or None)
        for closer in (getattr(ctx, "close", None), getattr(pw, "stop", None)):
            try:
                if closer:
                    closer()
            except BaseException:  # driver already gone, or a second Ctrl+C while closing
                pass

    out("\n" + field_report(saved, collector.capture, pcfg))
    return run_id, saved


def field_report(visits: list[ShopVisit], capture: Capture | None = None, pcfg: ParseConfig | None = None) -> str:
    """Which fields were captured, so a renamed Shopee field shows up immediately."""
    if not visits:
        return "Captured 0 shops."
    n = len(visits)
    shop_fields = [
        "name",
        "username",
        "location",
        "joined_at",
        "is_official",
        "description",
        "followers",
        "rating",
        "item_count",
    ]
    lines = [f"Captured {n} shops. Field coverage (shops with a value / {n}):"]
    for f in shop_fields:
        have = sum(getattr(v.shop, f) is not None for v in visits)
        lines.append(f"  shop.{f:<12} {have:>3}/{n}" + ("   <- MISSING everywhere" if have == 0 else ""))
    items = [i for v in visits for i in v.items]
    lines.append(f"Items seen: {len(items)}. Field coverage (items with a value / {len(items)}):")
    for f in ["name", "price", "sold", "historical_sold", "shop_location"]:
        have = sum(getattr(i, f) is not None for i in items)
        lines.append(
            f"  item.{f:<15} {have:>4}/{len(items)}" + ("   <- MISSING everywhere" if items and have == 0 else "")
        )
    sample = [i for i in items if i.price is not None][:3]
    if sample:
        lines.append("Price / sold check: open these, compare price and 'terjual' with the page (see README):")
        for i in sample:
            lines.append(f"  Rp{i.price:,} sold={i.sold} historical_sold={i.historical_sold}  {(i.name or '')[:50]}")
            lines.append(f"    https://shopee.co.id/product/{i.shopid}/{i.itemid}")
    return "\n".join(lines)


def reparse(conn: sqlite3.Connection, cfg: dict[str, Any], run_id: str, raw_root: Path = RAW_DIR) -> list[ShopVisit]:
    """Rebuild a run's shops/items/snapshots from data/raw/<run_id>/ without touching Shopee."""
    raw_dir = raw_root / run_id
    if not raw_dir.is_dir():
        raise FileNotFoundError(f"no raw data at {raw_dir}")
    pcfg = ParseConfig.from_config(cfg)
    capture = Capture()
    for path in sorted(raw_dir.glob("[0-9]*.json")):
        capture.add(json.loads(path.read_text(encoding="utf-8"))["body"])

    visited: list[int] = []
    visits_file = raw_dir / "visits.jsonl"
    if visits_file.exists():
        for line in visits_file.read_text(encoding="utf-8").splitlines():
            entry = json.loads(line)
            if entry.get("phase") == "shop" and entry.get("shopid") not in visited:
                visited.append(int(entry["shopid"]))

    if conn.execute("SELECT 1 FROM runs WHERE id = ?", (run_id,)).fetchone() is None:
        meta_file = raw_dir / "run.json"
        meta = json.loads(meta_file.read_text(encoding="utf-8")) if meta_file.exists() else {}
        conn.execute(
            "INSERT INTO runs (id, started_at, source, keywords, notes) VALUES (?, ?, ?, ?, ?)",
            (
                run_id,
                datetime.strptime(run_id, "%Y%m%d-%H%M%S").strftime("%Y-%m-%d %H:%M:%S"),
                meta.get("source", "playwright"),
                json.dumps(meta.get("keywords", []), ensure_ascii=False),
                "restored by reparse",
            ),
        )
    saved = []
    for shopid in visited:
        visit = build_visit(capture, shopid, pcfg)
        if visit:
            db.save_visit(conn, run_id, visit)
            saved.append(visit)
    db.rescore(conn, cfg, [v.shop.shopid for v in saved])
    conn.execute("UPDATE runs SET shops_visited = ? WHERE id = ?", (len(saved), run_id))
    conn.commit()
    return saved
