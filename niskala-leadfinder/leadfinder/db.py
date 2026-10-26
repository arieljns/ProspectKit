"""SQLite access. schema.sql is applied on every connect (all statements are idempotent).

SQL is kept portable to Postgres; only the placeholder style (`?`) would change.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable

from .config import ROOT
from .extract import extract_socials
from .parse import ShopVisit
from .score import ScoreInput, ScoreResult, score_shop

SCHEMA_PATH = ROOT / "schema.sql"
SHOP_URL = "https://shopee.co.id/shop/{shopid}"
STATUSES = ("new", "researching", "contacted", "replied", "call_booked", "won", "lost", "not_fit")
CHANNELS = ("ig_dm", "tiktok_dm", "shopee_chat", "other")
CLOSED_STATUSES = ("won", "lost", "not_fit")


def now_ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def connect(path: Path | str) -> sqlite3.Connection:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    return conn


# --- runs --------------------------------------------------------------------------


def start_run(conn: sqlite3.Connection, run_id: str, source: str, keywords: list[str]) -> None:
    conn.execute(
        "INSERT INTO runs (id, started_at, source, keywords) VALUES (?, ?, ?, ?)",
        (run_id, now_ts(), source, json.dumps(keywords, ensure_ascii=False)),
    )
    conn.commit()


def finish_run(conn: sqlite3.Connection, run_id: str, shops_visited: int, notes: str | None) -> None:
    conn.execute(
        "UPDATE runs SET finished_at = ?, shops_visited = ?, notes = ? WHERE id = ?",
        (now_ts(), shops_visited, notes, run_id),
    )
    conn.commit()


def recently_seen(conn: sqlite3.Connection, days: int) -> set[int]:
    """Shops whose profile was captured within `days` days (failed visits are retried)."""
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
    rows = conn.execute(
        """
        SELECT DISTINCT ss.shopid FROM shop_snapshots ss JOIN runs r ON r.id = ss.run_id
        WHERE r.started_at >= ? AND ss.followers IS NOT NULL
        """,
        (cutoff,),
    )
    return {row["shopid"] for row in rows}


# --- saving scraped data -----------------------------------------------------------


def save_visit(conn: sqlite3.Connection, run_id: str, visit: ShopVisit) -> None:
    """Upsert one shop, its snapshot for this run and its items, then commit.

    Missing values never overwrite known ones. Socials are re-derived only when a
    description was captured, so a shop that drops its website link gets updated.
    """
    shop = visit.shop
    socials = extract_socials(shop.description)
    conn.execute(
        """
        INSERT INTO shops (shopid, shop_name, username, shop_url, location, joined_at, is_official,
                           description_clean, instagram, tiktok, link_in_bio, website,
                           first_seen_run, last_seen_run)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (shopid) DO UPDATE SET
            shop_name = COALESCE(excluded.shop_name, shops.shop_name),
            username = COALESCE(excluded.username, shops.username),
            shop_url = excluded.shop_url,
            location = COALESCE(excluded.location, shops.location),
            joined_at = COALESCE(excluded.joined_at, shops.joined_at),
            is_official = COALESCE(excluded.is_official, shops.is_official),
            description_clean = COALESCE(excluded.description_clean, shops.description_clean),
            instagram = CASE WHEN excluded.description_clean IS NULL THEN shops.instagram ELSE excluded.instagram END,
            tiktok = CASE WHEN excluded.description_clean IS NULL THEN shops.tiktok ELSE excluded.tiktok END,
            link_in_bio = CASE WHEN excluded.description_clean IS NULL THEN shops.link_in_bio ELSE excluded.link_in_bio END,
            website = CASE WHEN excluded.description_clean IS NULL THEN shops.website ELSE excluded.website END,
            last_seen_run = excluded.last_seen_run
        """,
        (
            shop.shopid,
            shop.name,
            shop.username,
            SHOP_URL.format(shopid=shop.shopid),
            shop.location,
            shop.joined_at,
            shop.is_official,
            shop.description,
            socials.instagram,
            socials.tiktok,
            socials.link_in_bio,
            socials.website,
            run_id,
            run_id,
        ),
    )
    conn.execute(
        """
        INSERT INTO shop_snapshots (shopid, run_id, followers, rating, item_count, monthly_sold_seen,
                                    all_time_sold_seen, items_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (shopid, run_id) DO UPDATE SET
            followers = excluded.followers, rating = excluded.rating, item_count = excluded.item_count,
            monthly_sold_seen = excluded.monthly_sold_seen, all_time_sold_seen = excluded.all_time_sold_seen,
            items_seen = excluded.items_seen
        """,
        (
            shop.shopid,
            run_id,
            shop.followers,
            shop.rating,
            shop.item_count,
            visit.monthly_sold_seen,
            visit.all_time_sold_seen,
            len(visit.items),
        ),
    )
    conn.executemany(
        """
        INSERT INTO items (itemid, shopid, name, price, sold, historical_sold, last_seen_run)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (itemid) DO UPDATE SET
            shopid = excluded.shopid,
            name = COALESCE(excluded.name, items.name),
            price = COALESCE(excluded.price, items.price),
            sold = COALESCE(excluded.sold, items.sold),
            historical_sold = COALESCE(excluded.historical_sold, items.historical_sold),
            last_seen_run = excluded.last_seen_run
        """,
        [(i.itemid, i.shopid, i.name, i.price, i.sold, i.historical_sold, run_id) for i in visit.items],
    )
    conn.commit()


# --- scoring -----------------------------------------------------------------------


def score_input(conn: sqlite3.Connection, shopid: int) -> ScoreInput | None:
    shop = conn.execute("SELECT * FROM shops WHERE shopid = ?", (shopid,)).fetchone()
    if shop is None:
        return None
    snap = conn.execute(
        "SELECT * FROM shop_snapshots WHERE shopid = ? AND run_id = ?", (shopid, shop["last_seen_run"])
    ).fetchone()
    names = [r["name"] for r in conn.execute("SELECT name FROM items WHERE shopid = ? AND name IS NOT NULL", (shopid,))]
    profiled = conn.execute(
        "SELECT 1 FROM shop_snapshots WHERE shopid = ? AND followers IS NOT NULL", (shopid,)
    ).fetchone()
    return ScoreInput(
        is_official=bool(shop["is_official"]) if shop["is_official"] is not None else None,
        joined_at=shop["joined_at"],
        rating=snap["rating"] if snap else None,
        monthly_sold_seen=snap["monthly_sold_seen"] if snap else None,
        items_seen=snap["items_seen"] if snap else 0,
        instagram=shop["instagram"],
        tiktok=shop["tiktok"],
        website=shop["website"],
        has_profile=shop["description_clean"] is not None or profiled is not None,
        item_names=names,
        shop_text=" ".join(filter(None, [shop["shop_name"], shop["description_clean"]])),
    )


def upsert_score(conn: sqlite3.Connection, shopid: int, result: ScoreResult) -> None:
    """Write score fields only. status, dates and notes are never touched here."""
    conn.execute(
        """
        INSERT INTO leads (shopid, icp_score, icp_label, score_reasons) VALUES (?, ?, ?, ?)
        ON CONFLICT (shopid) DO UPDATE SET
            icp_score = excluded.icp_score, icp_label = excluded.icp_label, score_reasons = excluded.score_reasons
        """,
        (shopid, result.score, result.label, result.reasons),
    )
    conn.commit()


def rescore(conn: sqlite3.Connection, cfg: dict[str, Any], shopids: Iterable[int] | None = None) -> int:
    if shopids is None:
        shopids = [r["shopid"] for r in conn.execute("SELECT shopid FROM shops")]
    count = 0
    for shopid in shopids:
        inp = score_input(conn, shopid)
        if inp is None:
            continue
        upsert_score(conn, shopid, score_shop(inp, cfg.get("score", {}), cfg.get("categories", {})))
        count += 1
    return count


# --- pipeline queries --------------------------------------------------------------

_LEAD_SELECT = """
    SELECT s.shopid, s.shop_name, s.shop_url, s.location, s.instagram, s.tiktok, s.link_in_bio, s.website,
           l.icp_score, l.icp_label, l.score_reasons, l.status, l.contact_channel, l.contacted_at,
           l.next_followup_at, l.notes,
           ss.monthly_sold_seen, ss.followers, ss.rating
    FROM shops s
    JOIN leads l ON l.shopid = s.shopid
    LEFT JOIN shop_snapshots ss ON ss.shopid = s.shopid AND ss.run_id = s.last_seen_run
"""


def lead_rows(
    conn: sqlite3.Connection, label: str | None = None, status: str | None = None, limit: int | None = None
) -> list[sqlite3.Row]:
    where, params = [], []
    if label:
        where.append("l.icp_label = ?")
        params.append(label)
    if status:
        where.append("l.status = ?")
        params.append(status)
    sql = _LEAD_SELECT + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY l.icp_score DESC, ss.monthly_sold_seen DESC, s.shopid"
    if limit:
        sql += " LIMIT ?"
        params.append(limit)
    return list(conn.execute(sql, params))


def followup_rows(conn: sqlite3.Connection, today: date | None = None) -> list[sqlite3.Row]:
    today_s = (today or date.today()).isoformat()
    placeholders = ", ".join("?" for _ in CLOSED_STATUSES)
    sql = (
        _LEAD_SELECT
        + f" WHERE l.next_followup_at IS NOT NULL AND l.next_followup_at <= ? AND l.status NOT IN ({placeholders})"
        + " ORDER BY l.next_followup_at, l.icp_score DESC"
    )
    return list(conn.execute(sql, (today_s, *CLOSED_STATUSES)))


def mark(
    conn: sqlite3.Connection,
    shopid: int,
    status: str | None = None,
    channel: str | None = None,
    note: str | None = None,
    followup: str | None = None,
    clear_followup: bool = False,
) -> sqlite3.Row:
    if conn.execute("SELECT 1 FROM shops WHERE shopid = ?", (shopid,)).fetchone() is None:
        raise KeyError(f"shop {shopid} is not in the database")
    conn.execute("INSERT INTO leads (shopid) VALUES (?) ON CONFLICT (shopid) DO NOTHING", (shopid,))
    if status:
        conn.execute("UPDATE leads SET status = ? WHERE shopid = ?", (status, shopid))
        if status == "contacted":
            conn.execute(
                "UPDATE leads SET contacted_at = ? WHERE shopid = ? AND contacted_at IS NULL", (now_ts(), shopid)
            )
    if channel:
        conn.execute("UPDATE leads SET contact_channel = ? WHERE shopid = ?", (channel, shopid))
    if note:
        line = f"[{date.today().isoformat()}] {note}"
        conn.execute(
            "UPDATE leads SET notes = CASE WHEN notes IS NULL OR notes = '' THEN ? ELSE notes || ? END WHERE shopid = ?",
            (line, "\n" + line, shopid),
        )
    if followup:
        conn.execute("UPDATE leads SET next_followup_at = ? WHERE shopid = ?", (followup, shopid))
    elif clear_followup:
        conn.execute("UPDATE leads SET next_followup_at = NULL WHERE shopid = ?", (shopid,))
    conn.commit()
    return conn.execute(_LEAD_SELECT + " WHERE s.shopid = ?", (shopid,)).fetchone()


def stats_rows(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    """One row per shop with the latest snapshot. Callers must only print aggregates."""
    return list(
        conn.execute(
            """
            SELECT s.location, s.is_official, s.instagram, s.tiktok, s.link_in_bio, s.website,
                   s.description_clean, ss.monthly_sold_seen, ss.followers, ss.rating, l.icp_label, l.status
            FROM shops s
            LEFT JOIN shop_snapshots ss ON ss.shopid = s.shopid AND ss.run_id = s.last_seen_run
            LEFT JOIN leads l ON l.shopid = s.shopid
            """
        )
    )
