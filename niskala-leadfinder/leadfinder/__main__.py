"""CLI: python -m leadfinder <command>. Run with --help for the list of commands."""

from __future__ import annotations

import argparse
import csv
import re
import statistics
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Sequence

from . import db
from .config import CONFIG_PATH, DB_PATH, EXPORTS_DIR, load_config

LABELS = ("good", "check", "low", "skip")


# --- small helpers -----------------------------------------------------------------


def parse_followup(value: str, today: date | None = None) -> str | None:
    """'3d', '2w', 'today', 'tomorrow' or 'YYYY-MM-DD' -> ISO date. 'none' -> None."""
    today = today or date.today()
    v = value.strip().lower()
    if v in {"none", "clear", "-"}:
        return None
    if v == "today":
        return today.isoformat()
    if v == "tomorrow":
        return (today + timedelta(days=1)).isoformat()
    m = re.fullmatch(r"(\d+)\s*([dw])", v)
    if m:
        days = int(m.group(1)) * (7 if m.group(2) == "w" else 1)
        return (today + timedelta(days=days)).isoformat()
    try:
        return date.fromisoformat(v).isoformat()
    except ValueError:
        raise argparse.ArgumentTypeError(f"use 3d, 2w, today, tomorrow, YYYY-MM-DD or none (got {value!r})") from None


def _cut(value: Any, width: int) -> str:
    text = "" if value is None else str(value).replace("\n", " ")
    return text if len(text) <= width else text[: width - 1] + "…"


def print_table(rows: list[dict[str, Any]], columns: list[tuple[str, str, int]]) -> None:
    """columns: (key, header, max width)."""
    cells = [[_cut(r.get(key), width) for key, _h, width in columns] for r in rows]
    widths = [max([len(h)] + [len(c[i]) for c in cells]) for i, (_k, h, _w) in enumerate(columns)]
    print("  ".join(h.ljust(w) for (_k, h, _w), w in zip(columns, widths)))
    print("  ".join("-" * w for w in widths))
    for c in cells:
        print("  ".join(v.ljust(w) for v, w in zip(c, widths)).rstrip())


def _num(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float):
        return f"{value:g}"
    return f"{value:,}"


def _connect(args: argparse.Namespace):
    return db.connect(args.db)


# --- commands ----------------------------------------------------------------------


def cmd_scrape(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    if args.source == "apify":
        print(
            "The Apify source was evaluated and skipped: no Store actor qualified "
            "(see 'Apify evaluation' in README.md). Use --source playwright."
        )
        return 2
    from .scrape_playwright import ScrapeOptions, run

    opts = ScrapeOptions.from_config(
        cfg, keywords=args.keywords, pages=args.pages, max_shops=args.max_shops, refresh=args.refresh
    )
    if not opts.keywords:
        print("No keywords: pass --keywords or set [scrape].keywords in config.toml")
        return 2
    if opts.max_shops > 40:
        print(f"Note: --max-shops {opts.max_shops} is above the low-volume default of 40.")
    conn = _connect(args)
    run_id, saved = run(conn, cfg, opts)
    print(f"\nRun {run_id} done: {len(saved)} shops saved." + (" Next: python -m leadfinder list" if saved else ""))
    return 0


def cmd_score(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    conn = _connect(args)
    n = db.rescore(conn, cfg)
    counts = Counter(r["icp_label"] for r in conn.execute("SELECT icp_label FROM leads"))
    print(f"Scored {n} shops: " + ", ".join(f"{label} {counts.get(label, 0)}" for label in LABELS))
    return 0


def _lead_dicts(rows) -> list[dict[str, Any]]:
    out = []
    for r in rows:
        d = dict(r)
        d["sold"] = _num(d["monthly_sold_seen"])
        d["followers_s"] = _num(d["followers"])
        d["rating_s"] = _num(d["rating"])
        out.append(d)
    return out


LIST_COLUMNS = [
    ("shopid", "shopid", 12),
    ("icp_label", "label", 5),
    ("icp_score", "score", 5),
    ("status", "status", 11),
    ("shop_name", "shop", 28),
    ("location", "city", 18),
    ("sold", "sold/mo≥", 8),
    ("followers_s", "followers", 9),
    ("rating_s", "rating", 6),
    ("instagram", "IG", 20),
    ("tiktok", "TikTok", 18),
    ("website", "website", 22),
]


def cmd_list(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    conn = _connect(args)
    rows = _lead_dicts(db.lead_rows(conn, label=args.label, status=args.status, limit=args.limit))
    if not rows:
        print("No leads match. Run `scrape` first, or loosen --label/--status.")
        return 0
    print_table(rows, LIST_COLUMNS)
    if args.reasons:
        print()
        for r in rows:
            print(f"{r['shopid']}  {r['shop_url']}\n    {r['score_reasons']}")
    return 0


EXPORT_COLUMNS = [
    ("shop_name", "Shop name"),
    ("shop_url", "URL"),
    ("location", "Location"),
    ("monthly_sold_seen", "Monthly sold (lower bound)"),
    ("followers", "Followers"),
    ("rating", "Rating"),
    ("instagram", "Instagram"),
    ("tiktok", "TikTok"),
    ("link_in_bio", "Link in bio"),
    ("website", "Website"),
    ("icp_score", "Score"),
    ("score_reasons", "Reasons"),
    ("status", "Status"),
    ("notes", "Notes"),
]


def _csv_safe(value: Any) -> Any:
    # A cell starting with = + - @ is run as a formula by Excel/Sheets.
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@"):
        return "'" + value
    return value


def export_csv(conn, path: Path, label: str | None, status: str | None) -> int:
    rows = db.lead_rows(conn, label=label, status=status)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8-sig", newline="") as f:  # BOM so Excel reads UTF-8
        writer = csv.writer(f)
        writer.writerow([header for _key, header in EXPORT_COLUMNS])
        for r in rows:
            writer.writerow([_csv_safe(r[key]) for key, _header in EXPORT_COLUMNS])
    return len(rows)


def cmd_export(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    conn = _connect(args)
    path = args.out or EXPORTS_DIR / f"leads_{date.today().isoformat()}.csv"
    n = export_csv(conn, path, args.label, args.status)
    print(f"Wrote {n} leads to {path}")
    return 0


def cmd_mark(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    if not any([args.status, args.channel, args.note, args.followup is not None]):
        print("Nothing to change: pass --status, --channel, --note and/or --followup")
        return 2
    conn = _connect(args)
    followup = parse_followup(args.followup) if args.followup is not None else None
    try:
        row = db.mark(
            conn,
            args.shopid,
            status=args.status,
            channel=args.channel,
            note=args.note,
            followup=followup,
            clear_followup=args.followup is not None and followup is None,
        )
    except KeyError as exc:
        print(exc.args[0])
        return 1
    print(
        f"{row['shop_name'] or row['shopid']}: status={row['status']} channel={row['contact_channel'] or '-'} "
        f"contacted_at={row['contacted_at'] or '-'} next_followup={row['next_followup_at'] or '-'}"
    )
    return 0


def cmd_followups(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    conn = _connect(args)
    today = date.today()
    rows = []
    for r in db.followup_rows(conn, today):
        d = dict(r)
        overdue = (today - date.fromisoformat(d["next_followup_at"])).days
        d["due"] = "today" if overdue == 0 else f"{overdue}d late"
        d["last_note"] = (d["notes"] or "").splitlines()[-1] if d["notes"] else ""
        rows.append(d)
    if not rows:
        print("No follow-ups due today. 🎉")
        return 0
    print_table(
        rows,
        [
            ("shopid", "shopid", 12),
            ("next_followup_at", "follow-up", 10),
            ("due", "due", 8),
            ("status", "status", 11),
            ("contact_channel", "channel", 11),
            ("shop_name", "shop", 26),
            ("instagram", "IG", 20),
            ("shop_url", "url", 40),
            ("last_note", "last note", 40),
        ],
    )
    return 0


def _pct(part: int, whole: int) -> str:
    return f"{part / whole:.0%}" if whole else "n/a"


def _median(values: list[float]) -> str:
    return _num(round(statistics.median(values), 2)) if values else "n/a"


def stats_text(conn, cfg: dict[str, Any]) -> str:
    """Aggregates for a content post. Never names a shop; small cities are grouped."""
    rows = db.stats_rows(conn)
    n = len(rows)
    if n == 0:
        return "No shops scraped yet."
    min_group = int(cfg.get("stats", {}).get("min_group_size", 3))
    score_cfg = cfg.get("score", {})
    lo, hi = int(score_cfg.get("monthly_sold_min", 300)), int(score_cfg.get("monthly_sold_max", 2000))
    profiled = [r for r in rows if r["description_clean"] is not None]
    p = len(profiled)

    def has(key: str) -> int:
        return sum(1 for r in profiled if r[key])

    social = sum(1 for r in profiled if r["instagram"] or r["tiktok"])
    sold = [r["monthly_sold_seen"] for r in rows if r["monthly_sold_seen"] is not None]
    followers = [r["followers"] for r in rows if r["followers"] is not None]
    ratings = [r["rating"] for r in rows if r["rating"] is not None]
    official = sum(1 for r in rows if r["is_official"])

    lines = [
        f"Shops scraped: {n} (Shopee Mall: {official})",
        f"Shops with a description captured: {p}",
        f"  list their own website:  {_pct(has('website'), p)}",
        f"  list Instagram:          {_pct(has('instagram'), p)}",
        f"  list TikTok:             {_pct(has('tiktok'), p)}",
        f"  list IG or TikTok:       {_pct(social, p)}",
        f"  use a link-in-bio page:  {_pct(has('link_in_bio'), p)}",
        f"Monthly sold (seen, lower bound): median {_median(sold)} across {len(sold)} shops; "
        f"{_pct(sum(lo <= s <= hi for s in sold), len(sold))} in {lo}-{hi}",
        f"Followers: median {_median(followers)}",
        f"Rating: median {_median(ratings)}",
    ]
    cities = Counter(r["location"] or "Unknown" for r in rows)
    grouped: Counter[str] = Counter()
    for city, count in cities.items():
        grouped[city if count >= min_group else "Other"] += count
    lines.append(f"By city (cities with fewer than {min_group} shops grouped as Other):")
    for city, count in sorted(grouped.items(), key=lambda kv: (kv[0] == "Other", -kv[1], kv[0])):
        lines.append(f"  {city:<28} {count:>4}  {_pct(count, n)}")
    labels = Counter(r["icp_label"] for r in rows if r["icp_label"])
    lines.append("ICP labels: " + ", ".join(f"{label} {labels.get(label, 0)}" for label in LABELS))
    statuses = Counter(r["status"] for r in rows if r["status"])
    lines.append("Pipeline: " + ", ".join(f"{s} {statuses[s]}" for s in db.STATUSES if statuses.get(s)))
    return "\n".join(lines)


def cmd_stats(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    print(stats_text(_connect(args), cfg))
    return 0


def cmd_reparse(args: argparse.Namespace, cfg: dict[str, Any]) -> int:
    from .scrape_playwright import field_report, reparse

    conn = _connect(args)
    try:
        saved = reparse(conn, cfg, args.run_id)
    except FileNotFoundError as exc:
        print(exc)
        return 1
    print(f"Re-parsed run {args.run_id}: {len(saved)} shops updated and re-scored.\n")
    print(field_report(saved))
    return 0


# --- argument parsing --------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m leadfinder", description="Niskala Shopee lead finder")
    parser.add_argument("--db", type=Path, default=DB_PATH, help=f"SQLite file (default {DB_PATH})")
    parser.add_argument("--config", type=Path, default=CONFIG_PATH, help="config.toml path")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("scrape", help="find shops via Shopee search and read their shop pages")
    p.add_argument("--keywords", nargs="+", help="search keywords (default: [scrape].keywords)")
    p.add_argument("--pages", type=int, help="search result pages per keyword")
    p.add_argument("--max-shops", type=int, help="max shop pages to visit (default 40)")
    p.add_argument("--source", choices=("playwright", "apify"), default="playwright")
    p.add_argument("--refresh", action="store_true", help="also revisit shops scraped in the last 14 days")
    p.set_defaults(func=cmd_scrape)

    p = sub.add_parser("score", help="recompute ICP scores for all shops")
    p.set_defaults(func=cmd_score)

    p = sub.add_parser("list", help="print leads as a table")
    p.add_argument("--label", choices=LABELS)
    p.add_argument("--status", choices=db.STATUSES)
    p.add_argument("--limit", type=int, default=20)
    p.add_argument("--reasons", action="store_true", help="also print each lead's score reasons")
    p.set_defaults(func=cmd_list)

    p = sub.add_parser("export", help="write exports/leads_<date>.csv (UTF-8 with BOM)")
    p.add_argument("--label", choices=LABELS)
    p.add_argument("--status", choices=db.STATUSES)
    p.add_argument("--out", type=Path, help="output path (default exports/leads_<date>.csv)")
    p.set_defaults(func=cmd_export)

    p = sub.add_parser("mark", help="update a lead in your pipeline")
    p.add_argument("shopid", type=int)
    p.add_argument("--status", choices=db.STATUSES)
    p.add_argument("--channel", choices=db.CHANNELS)
    p.add_argument("--note", help="appended to notes with today's date")
    p.add_argument("--followup", help="3d, 2w, today, tomorrow, YYYY-MM-DD, or none to clear")
    p.set_defaults(func=cmd_mark)

    p = sub.add_parser("followups", help="leads whose follow-up is today or overdue")
    p.set_defaults(func=cmd_followups)

    p = sub.add_parser("stats", help="aggregate numbers across all scraped shops (no shop names)")
    p.set_defaults(func=cmd_stats)

    p = sub.add_parser("reparse", help="rebuild a run from data/raw/<run_id>/ without scraping again")
    p.add_argument("run_id")
    p.set_defaults(func=cmd_reparse)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        cfg = load_config(args.config)
    except FileNotFoundError:
        parser.error(f"config file not found: {args.config}")
    try:
        return args.func(args, cfg)
    except argparse.ArgumentTypeError as exc:
        parser.error(str(exc))
    except KeyboardInterrupt:
        print("\nStopped.")
        return 130


if __name__ == "__main__":
    sys.exit(main())
