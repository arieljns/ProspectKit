import json
from datetime import date, timedelta

from conftest import load_fixture

from leadfinder import db
from leadfinder.__main__ import export_csv, main, parse_followup, stats_text
from leadfinder.parse import Capture, ParseConfig, build_visit, scrub
from leadfinder.scrape_playwright import Collector, reparse

PCFG = ParseConfig()
SHOPS = (111222333, 222333444, 444555666)


def capture_all() -> Capture:
    cap = Capture()
    for name in [
        "search_items.json",
        "shop_111222333.json",
        "shop_items_111222333.json",
        "shop_222333444.json",
        "shop_444555666.json",
    ]:
        cap.add(scrub(load_fixture(name)))
    return cap


def seed(conn, cfg, run_id="20261026-100000", cap=None):
    cap = cap or capture_all()
    db.start_run(conn, run_id, "playwright", ["serum niacinamide"])
    for shopid in SHOPS:
        db.save_visit(conn, run_id, build_visit(cap, shopid, PCFG))
    db.rescore(conn, cfg)
    db.finish_run(conn, run_id, len(SHOPS), None)


def test_schema_tables(conn):
    names = {r["name"] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    assert {"runs", "shops", "shop_snapshots", "items", "leads"} <= names


def test_save_and_score(conn, cfg):
    seed(conn, cfg)
    shop = conn.execute("SELECT * FROM shops WHERE shopid = 111222333").fetchone()
    assert shop["shop_url"] == "https://shopee.co.id/shop/111222333"
    assert (shop["instagram"], shop["tiktok"], shop["website"]) == ("glowria.id", "glowria.id", "glowria.co.id")
    assert "0812" not in shop["description_clean"]
    snap = conn.execute("SELECT * FROM shop_snapshots WHERE shopid = 111222333").fetchone()
    assert (snap["followers"], snap["monthly_sold_seen"], snap["items_seen"]) == (5321, 568, 5)
    leads = {r["shopid"]: r for r in conn.execute("SELECT * FROM leads")}
    assert leads[111222333]["icp_label"] == "check"  # in range + skincare + IG, but lists a website
    assert leads[222333444]["status"] == "new"
    k = conn.execute("SELECT * FROM shops WHERE shopid = 222333444").fetchone()
    assert (k["instagram"], k["link_in_bio"], k["website"]) == ("kolagenku_", "lynk.id/kolagenku", None)
    assert "wa.me" not in k["description_clean"] and "0857" not in k["description_clean"]


def test_rescrape_never_overwrites_pipeline_fields(conn, cfg):
    seed(conn, cfg)
    db.mark(conn, 111222333, status="contacted", channel="ig_dm", note="DM sent", followup="2026-10-29")
    before = conn.execute("SELECT * FROM leads WHERE shopid = 111222333").fetchone()

    cap = Capture()  # second run: website gone from the description, more followers
    profile = load_fixture("shop_111222333.json")
    profile["data"]["description"] = "IG: @glowria.id"
    profile["data"]["follower_count"] = 6000
    cap.add(scrub(profile))
    cap.add(load_fixture("search_items.json"))
    db.start_run(conn, "20261102-100000", "playwright", ["serum"])
    db.save_visit(conn, "20261102-100000", build_visit(cap, 111222333, PCFG))
    db.rescore(conn, cfg)

    after = conn.execute("SELECT * FROM leads WHERE shopid = 111222333").fetchone()
    for key in ("status", "contact_channel", "contacted_at", "next_followup_at", "notes"):
        assert after[key] == before[key]
    assert after["icp_label"] == "good"  # score fields do update
    shop = conn.execute("SELECT * FROM shops WHERE shopid = 111222333").fetchone()
    assert shop["website"] is None and shop["first_seen_run"] == "20261026-100000"
    assert conn.execute("SELECT COUNT(*) FROM shop_snapshots WHERE shopid = 111222333").fetchone()[0] == 2


def test_visit_without_profile_keeps_known_socials(conn, cfg):
    seed(conn, cfg)
    cap = Capture()
    cap.add(load_fixture("search_items.json"))  # search data only, no shop profile
    db.start_run(conn, "20261102-100000", "playwright", ["serum"])
    db.save_visit(conn, "20261102-100000", build_visit(cap, 111222333, PCFG))
    shop = conn.execute("SELECT * FROM shops WHERE shopid = 111222333").fetchone()
    assert shop["instagram"] == "glowria.id" and shop["username"] == "glowria.official"


def test_recently_seen(conn, cfg):
    seed(conn, cfg, run_id="20200101-000000")
    conn.execute("UPDATE runs SET started_at = '2020-01-01 00:00:00'")
    assert db.recently_seen(conn, 14) == set()
    seed(conn, cfg, run_id="20261026-110000")
    conn.execute("UPDATE runs SET started_at = ? WHERE id = '20261026-110000'", (db.now_ts(),))
    assert db.recently_seen(conn, 14) == set(SHOPS)


def test_mark_and_followups(conn, cfg):
    seed(conn, cfg)
    today = date.today()
    row = db.mark(conn, 222333444, status="contacted", channel="ig_dm", note="first DM", followup=today.isoformat())
    assert row["contacted_at"] is not None
    db.mark(conn, 222333444, note="no reply yet")
    db.mark(conn, 111222333, status="lost", followup=(today - timedelta(days=3)).isoformat())
    db.mark(conn, 444555666, status="researching", followup=(today + timedelta(days=3)).isoformat())
    due = db.followup_rows(conn, today)
    assert [r["shopid"] for r in due] == [222333444]  # lost leads and future dates are excluded
    notes = due[0]["notes"].splitlines()
    assert notes[0].endswith("first DM") and notes[1].endswith("no reply yet")
    db.mark(conn, 222333444, clear_followup=True)
    assert db.followup_rows(conn, today) == []


def test_parse_followup():
    today = date(2026, 10, 26)
    assert parse_followup("3d", today) == "2026-10-29"
    assert parse_followup("2w", today) == "2026-11-09"
    assert parse_followup("tomorrow", today) == "2026-10-27"
    assert parse_followup("2026-12-01", today) == "2026-12-01"
    assert parse_followup("none", today) is None


def test_export_csv_has_bom_and_is_formula_safe(conn, cfg, tmp_path):
    seed(conn, cfg)
    conn.execute("UPDATE shops SET shop_name = '=HYPERLINK(1)' WHERE shopid = 444555666")
    path = tmp_path / "out.csv"
    assert export_csv(conn, path, label=None, status=None) == 3
    raw = path.read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    assert text.splitlines()[0].startswith("Shop name,URL,Location,Monthly sold")
    assert "'=HYPERLINK(1)" in text
    # Kolagenku: in range + supplement + IG (100), young shop (-20), rating 4.4 (-5) = 75 -> good
    assert export_csv(conn, tmp_path / "good.csv", label="good", status="new") == 1
    assert "Kolagenku" in (tmp_path / "good.csv").read_text(encoding="utf-8-sig")
    assert export_csv(conn, tmp_path / "none.csv", label="good", status="contacted") == 0


def test_stats_are_aggregate_only(conn, cfg):
    seed(conn, cfg)
    text = stats_text(conn, cfg)
    assert "Shops scraped: 3" in text
    assert "list their own website:  33%" in text
    for name in ("Glowria", "Kolagenku", "Apotek", "glowria.id", "111222333"):
        assert name not in text
    # one shop per city -> grouped under Other (min_group_size = 3)
    assert "Kota Bandung" not in text and "Other" in text


def test_cli_list_mark_followups(tmp_path, cfg, capsys):
    dbfile = tmp_path / "cli.db"
    conn = db.connect(dbfile)
    seed(conn, cfg)
    conn.close()
    assert main(["--db", str(dbfile), "list", "--reasons"]) == 0
    out = capsys.readouterr().out
    assert "Kolagenku" in out and "lower bound" in out
    assert (
        main(
            [
                "--db",
                str(dbfile),
                "mark",
                "222333444",
                "--status",
                "contacted",
                "--channel",
                "ig_dm",
                "--note",
                "sent intro",
                "--followup",
                "0d",
            ]
        )
        == 0
    )
    assert main(["--db", str(dbfile), "followups"]) == 0
    assert "222333444" in capsys.readouterr().out
    assert main(["--db", str(dbfile), "mark", "1", "--status", "won"]) == 1
    assert main(["--db", str(dbfile), "score"]) == 0
    assert main(["--db", str(dbfile), "stats"]) == 0
    assert main(["--db", str(dbfile), "scrape", "--source", "apify"]) == 2


def test_collector_writes_scrubbed_raw_and_reparse_rebuilds(tmp_path, cfg):
    raw_root = tmp_path / "raw"
    run_id = "20261026-120000"
    col = Collector(raw_root / run_id)
    (raw_root / run_id / "run.json").write_text(json.dumps({"source": "playwright", "keywords": ["kolagen"]}))
    col.start_page({"phase": "search", "keyword": "kolagen", "page": 0})
    col.handle_body(
        "https://shopee.co.id/api/v4/search/search_items?keyword=kolagen", load_fixture("search_items.json")
    )
    col.handle_body("https://shopee.co.id/api/v4/account/basic/get_account_info", load_fixture("account_info.json"))
    col.log_page("https://shopee.co.id/search?keyword=kolagen", ok=True)
    col.start_page({"phase": "shop", "shopid": 222333444})
    col.handle_body(
        "https://shopee.co.id/api/v4/shop/get_shop_base?shopid=222333444", load_fixture("shop_222333444.json")
    )
    col.handle_body("https://shopee.co.id/api/v4/x", load_fixture("blocked.json"))
    assert col.blocked
    col.log_page("https://shopee.co.id/shop/222333444", ok=True)

    files = sorted(p.name for p in (raw_root / run_id).iterdir())
    assert files == ["0001_search.json", "0002_shop.json", "run.json", "visits.jsonl"]
    raw_text = "".join((raw_root / run_id / f).read_text(encoding="utf-8") for f in files)
    for secret in ("0857", "6285712345678", "11223344", "me@example.com"):
        assert secret not in raw_text

    conn = db.connect(tmp_path / "fresh.db")  # empty database: run row is restored from run.json
    saved = reparse(conn, cfg, run_id, raw_root=raw_root)
    assert [v.shop.shopid for v in saved] == [222333444]
    assert conn.execute("SELECT shops_visited FROM runs WHERE id = ?", (run_id,)).fetchone()[0] == 1
    lead = conn.execute("SELECT * FROM leads WHERE shopid = 222333444").fetchone()
    assert lead["icp_label"] in {"good", "check", "low"}
    assert "joined 2026-08-15" in lead["score_reasons"] or "join" in lead["score_reasons"]
