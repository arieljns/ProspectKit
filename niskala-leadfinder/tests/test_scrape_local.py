"""End-to-end check of the Playwright plumbing against a local fake site (never Shopee).

Opt-in because it opens a real, headed Chromium:
    LEADFINDER_BROWSER_TEST=1 python -m pytest tests/test_scrape_local.py
On a machine without a display, wrap it in `xvfb-run -a`. Set LEADFINDER_CHROMIUM to use
a specific Chromium binary instead of Playwright's own.
"""

import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

import pytest
from conftest import FIXTURES

from leadfinder import db
from leadfinder.scrape_playwright import ScrapeOptions, run

pytestmark = pytest.mark.skipif(
    not os.environ.get("LEADFINDER_BROWSER_TEST"), reason="set LEADFINDER_BROWSER_TEST=1 to open a real browser"
)

PAGE = """<!doctype html><html><body style="height:4000px"><h1>{title}</h1><script>
for (const u of {urls}) fetch(u).then(r => r.text()).then(t => document.body.insertAdjacentText('beforeend', t.length + ' '));
</script></body></html>"""


def fixture_text(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


class FakeShopee(BaseHTTPRequestHandler):
    walls_left = {"222333444": 1}  # first visit to this shop hits a verification wall

    def log_message(self, *args):
        pass

    def _send(self, body: str, ctype: str, status: int = 200, headers: dict | None = None):
        data = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parts = urlsplit(self.path)
        q = parse_qs(parts.query)
        path = parts.path
        account = "/api/v4/account/basic/get_account_info"
        if path == account:
            return self._send(fixture_text("account_info.json"), "application/json")
        if path == "/api/v4/search/search_items":
            return self._send(fixture_text("search_items.json"), "application/json; charset=utf-8")
        if path == "/api/v4/shop/get_shop_base":
            shopid = q["shopid"][0]
            f = FIXTURES / f"shop_{shopid}.json"
            return self._send(f.read_text(encoding="utf-8") if f.exists() else "{}", "application/json")
        if path == "/api/v4/shop/rcmd_items":
            shopid = q["shopid"][0]
            body = fixture_text("shop_items_111222333.json") if shopid == "111222333" else '{"data":{"items":[]}}'
            return self._send(body, "application/json")
        if path == "/search":
            urls = json.dumps([account, f"/api/v4/search/search_items?keyword={q['keyword'][0]}&page={q['page'][0]}"])
            return self._send(PAGE.format(title="search", urls=urls), "text/html")
        if path.startswith("/shop/"):
            shopid = path.rsplit("/", 1)[1]
            if self.walls_left.get(shopid):
                self.walls_left[shopid] -= 1
                return self._send("", "text/html", 302, {"Location": "/verify/traffic"})
            urls = json.dumps(
                [account, f"/api/v4/shop/get_shop_base?shopid={shopid}", f"/api/v4/shop/rcmd_items?shopid={shopid}"]
            )
            return self._send(PAGE.format(title=f"shop {shopid}", urls=urls), "text/html")
        if path == "/verify/traffic":
            return self._send("<h1>Verifikasi</h1>", "text/html")
        return self._send("<h1>home</h1>", "text/html")


@pytest.fixture
def fake_shopee():
    server = ThreadingHTTPServer(("127.0.0.1", 0), FakeShopee)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()


def test_scrape_against_fake_site(fake_shopee, tmp_path, cfg):
    conn = db.connect(tmp_path / "leads.db")
    opts = ScrapeOptions.from_config(
        cfg,
        keywords=["serum niacinamide"],
        pages=1,
        max_shops=3,
        delay_min_s=0,
        delay_max_s=0,
        scroll_steps_search=1,
        scroll_steps_shop=1,
        profile_dir=str(tmp_path / "profile"),
        browser_executable=os.environ.get("LEADFINDER_CHROMIUM", ""),
    )
    prompts: list[str] = []

    def ask(prompt: str) -> str:
        prompts.append(prompt)
        return ""

    run_id, saved = run(conn, cfg, opts, base_url=fake_shopee, raw_root=tmp_path / "raw", ask=ask, sleep=lambda s: None)

    # Mall shop 333444555 is skipped; the other three are visited in summed-sold order.
    assert [v.shop.shopid for v in saved] == [111222333, 222333444, 444555666]
    assert all(v.has_profile for v in saved)
    assert len(prompts) == 2  # the login prompt + one wall pause on shop 222333444
    assert "verification" in prompts[1]

    lead = conn.execute("SELECT * FROM leads WHERE shopid = 111222333").fetchone()
    assert lead["icp_label"] == "check" and "own website" in lead["score_reasons"]
    run_row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    assert run_row["shops_visited"] == 3 and run_row["finished_at"] and run_row["notes"] is None

    raw = tmp_path / "raw" / run_id
    raw_text = "".join(p.read_text(encoding="utf-8") for p in raw.iterdir() if p.is_file())
    assert "me@example.com" not in raw_text and "my_own_account" not in raw_text  # own account never saved
    assert "0857" not in raw_text

    # Second run without --refresh: everything was just scraped, so nothing is visited.
    _run2, saved2 = run(conn, cfg, opts, base_url=fake_shopee, raw_root=tmp_path / "raw", ask=ask, sleep=lambda s: None)
    assert saved2 == []
