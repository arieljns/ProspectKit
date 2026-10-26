from datetime import date

from leadfinder.score import ScoreInput, score_shop

TODAY = date(2026, 10, 26)


def make(**kw) -> ScoreInput:
    base = dict(
        is_official=False,
        joined_at="2021-03-15",
        rating=4.9,
        monthly_sold_seen=600,
        items_seen=20,
        instagram="glowria.id",
        tiktok=None,
        website=None,
        has_profile=True,
        item_names=["Serum Niacinamide 20ml", "Toner Centella", "Sunscreen SPF 50", "Pouch"],
    )
    base.update(kw)
    return ScoreInput(**base)


def run(inp, cfg):
    return score_shop(inp, cfg["score"], cfg["categories"], today=TODAY)


def test_ideal_shop_is_good(cfg):
    r = run(make(), cfg)
    assert r.label == "good"
    assert r.score == 100
    assert "lower bound" in r.reasons
    assert "category skincare" in r.reasons
    assert "IG glowria.id" in r.reasons


def test_supplement_category(cfg):
    r = run(make(item_names=["Suplemen Kolagen Drink", "Vitamin C 1000mg 30 Kapsul"]), cfg)
    assert "category supplement" in r.reasons


def test_own_website_caps_label_at_check(cfg):
    r = run(make(website="glowria.co.id"), cfg)
    assert r.score == 75
    assert r.label == "check"
    assert "own website glowria.co.id" in r.reasons


def test_official_shop_is_skip(cfg):
    r = run(make(is_official=True), cfg)
    assert r.label == "skip"
    assert r.reasons.startswith("SKIP")


def test_young_shop_penalised(cfg):
    r = run(make(joined_at="2026-08-15"), cfg)
    assert r.score == 80
    assert "under 6 months" in r.reasons


def test_low_rating_slight_penalty(cfg):
    r = run(make(rating=4.4), cfg)
    assert r.score == 95
    assert "rating 4.4 below 4.5" in r.reasons


def test_sales_bands(cfg):
    assert run(make(monthly_sold_seen=200), cfg).score == 70  # near the range: 20 + 25 + 25
    assert run(make(monthly_sold_seen=50), cfg).score == 50
    assert run(make(monthly_sold_seen=9000), cfg).score == 65
    assert "unknown" in run(make(monthly_sold_seen=None), cfg).reasons


def test_no_socials_no_category(cfg):
    r = run(make(instagram=None, item_names=["Sepatu Sneakers Pria"]), cfg)
    assert r.score == 50
    assert r.label == "check"
    assert "no IG/TikTok" in r.reasons and "no category match" in r.reasons


def test_missing_profile_caps_at_check(cfg):
    r = run(make(has_profile=False, instagram=None, joined_at=None, rating=None), cfg)
    assert r.label in {"check", "low"}
    assert "profile not captured" in r.reasons


def test_score_clamped_to_zero(cfg):
    r = run(
        make(monthly_sold_seen=10, item_names=[], instagram=None, website="x.com", joined_at="2026-10-01", rating=3.0),
        cfg,
    )
    assert r.score == 0
    assert r.label == "low"


def test_reasons_never_start_with_formula_characters(cfg):
    for inp in [make(), make(website="a.com"), make(is_official=True), make(monthly_sold_seen=None)]:
        assert run(inp, cfg).reasons[:1] not in "=+-@"
