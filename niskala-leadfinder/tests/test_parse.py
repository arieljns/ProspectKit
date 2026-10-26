import json

from conftest import load_fixture

from leadfinder.parse import (
    Capture,
    ParseConfig,
    build_visit,
    is_item,
    is_shop,
    looks_blocked,
    parse_item,
    rank_candidates,
    scrub,
    walk,
)

PCFG = ParseConfig()


def full_capture() -> Capture:
    cap = Capture()
    for name in [
        "search_items.json",
        "shop_111222333.json",
        "shop_items_111222333.json",
        "shop_222333444.json",
        "shop_444555666.json",
        "shop_ratings.json",
    ]:
        cap.add(scrub(load_fixture(name)))
    return cap


def test_walk_visits_nested_dicts():
    found = list(walk({"a": [{"b": {"c": 1}}, 2], "d": {"e": []}}))
    assert len(found) == 4


def test_search_items_classified_and_merged():
    cap = Capture()
    n_items, n_shops = cap.add(load_fixture("search_items.json"))
    assert n_shops == 0
    assert n_items == 12  # wrapper + item_basic for each of 6 items
    assert len(cap.items) == 6
    item = parse_item(cap.items[22650011234], PCFG)
    assert item.name == "Glowria Serum Niacinamide 10% + Zinc 20ml BPOM"
    assert item.price == 89000  # 8900000000 / 100000
    assert (item.sold, item.historical_sold) == (320, 5400)
    assert item.shop_location == "Kota Bandung"
    assert item.is_official_shop is False


def test_newer_item_card_shape():
    cap = Capture()
    cap.add(load_fixture("search_items.json"))
    item = parse_item(cap.items[40400000001], PCFG)
    assert (item.price, item.sold, item.historical_sold) == (35000, 40, 300)


def test_monthly_field_is_configurable():
    cap = Capture()
    cap.add(load_fixture("search_items.json"))
    flipped = ParseConfig(monthly_sold_fields=("historical_sold",), all_time_sold_fields=("sold",))
    item = parse_item(cap.items[22650011234], flipped)
    assert (item.sold, item.historical_sold) == (5400, 320)


def test_shop_profile_parsed():
    cap = Capture()
    assert cap.add(scrub(load_fixture("shop_111222333.json"))) == (0, 1)
    visit = build_visit(cap, 111222333, PCFG)
    shop = visit.shop
    assert visit.has_profile
    assert shop.name == "Glowria Skincare"
    assert shop.username == "glowria.official"
    assert shop.location == "Kota Bandung"
    assert shop.joined_at == "2021-03-15"
    assert shop.followers == 5321 and shop.rating == 4.86 and shop.item_count == 42
    assert shop.is_official is False
    assert "0812" not in shop.description and "cs@glowria" not in shop.description
    assert "Mawar" not in shop.description


def test_reviews_are_not_items_and_buyer_data_is_scrubbed():
    raw = load_fixture("shop_ratings.json")
    review = raw["data"]["items"][0]
    assert not is_item(review) and not is_shop(review)
    cleaned = json.dumps(scrub(raw))
    for secret in ("budi_santoso88", "author_portrait", "4455667", "081298765432"):
        assert secret not in cleaned


def test_own_account_response_has_no_shop_and_is_scrubbed():
    raw = load_fixture("account_info.json")
    cap = Capture()
    assert cap.add(scrub(raw)) == (0, 0)
    cleaned = json.dumps(scrub(raw))
    for secret in ("me@example.com", "6281111111111", "nickname", '"userid"'):
        assert secret not in cleaned


def test_scrub_keeps_ids_and_shop_username():
    raw = load_fixture("shop_111222333.json")
    data = scrub(raw)["data"]
    assert data["shopid"] == 111222333
    assert data["account"] == {"username": "glowria.official", "following_count": 12, "total_avg_star": None}
    assert "userid" not in data
    assert scrub({"modelid": "0812345678901"}) == {"modelid": "0812345678901"}


def test_blocked_response_detected():
    assert looks_blocked(load_fixture("blocked.json"))
    assert not looks_blocked(load_fixture("shop_111222333.json"))
    assert not looks_blocked([1, 2])


def test_visit_combines_search_and_shop_items():
    visit = build_visit(full_capture(), 111222333, PCFG)
    assert len(visit.items) == 5  # 2 from search (1 repeated on shop page) + 3 more from the shop page
    assert visit.monthly_sold_seen == 320 + 140 + 60 + 45 + 3
    assert visit.all_time_sold_seen == 5400 + 2100 + 800 + 610 + 40


def test_visit_without_profile_uses_item_fallbacks():
    cap = Capture()
    cap.add(load_fixture("search_items.json"))
    visit = build_visit(cap, 333444555, PCFG)
    assert not visit.has_profile
    assert visit.shop.location == "Kota Jakarta Barat"
    assert visit.shop.is_official is True
    assert build_visit(cap, 1, PCFG) is None


def test_rank_candidates_by_summed_sold():
    cap = Capture()
    cap.add(load_fixture("search_items.json"))
    ranked = rank_candidates(cap, PCFG)
    assert [sid for sid, _s, _o in ranked] == [333444555, 111222333, 222333444, 444555666]
    assert ranked[0] == (333444555, 5200, True)
    assert ranked[1] == (111222333, 460, False)


def test_richer_shop_object_wins_over_stub():
    cap = Capture()
    cap.add({"data": {"shopid": 5, "name": "Full Name", "follower_count": 10, "item_count": 3, "rating_star": 4.9}})
    cap.add({"x": {"shopid": 5, "name": "stub", "shop_location": "KOTA BOGOR", "is_official_shop": False}})
    shop = build_visit(cap, 5, PCFG).shop
    assert shop.name == "Full Name"
    assert shop.location == "Kota Bogor"  # filled from the stub because the profile lacked it
