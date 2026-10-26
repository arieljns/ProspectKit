"""Turn captured Shopee JSON into items and shops by walking the whole tree.

No endpoint paths are hard-coded: any dict with `itemid` + `shopid` is an item, and
any dict with `shopid` plus shop-ish keys is a shop. Field paths that are likely to
drift live in config.toml ([parse]).
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Iterator

from .extract import clean_description, strip_contact_details

# Keys that only appear on buyer reviews. Reviews also carry itemid/shopid but are not items.
_REVIEW_KEYS = {"cmtid", "author_username", "author_userid", "author_shopid"}
_SHOP_STRONG_KEYS = {"follower_count", "item_count", "account", "rating_star"}
_SHOP_WEAK_KEYS = {"is_official_shop", "ctime", "description", "shop_location", "place", "name", "username"}
_SHOP_KEYS = _SHOP_STRONG_KEYS | _SHOP_WEAK_KEYS
_PRICE_FIELDS = ("price", "item_card_display_price.price", "price_min")

# Shopee's anti-bot answer looks like {"error": 90309999, "action_type": 2, "tracking_id": ...}.
# TODO verify on first run: error code and keys are from memory of public reports.
_BLOCK_ERRORS = {90309999}


@dataclass(frozen=True)
class ParseConfig:
    price_divisor: int = 100000
    monthly_sold_fields: tuple[str, ...] = ("sold", "item_card_display_sold_count.monthly_sold_count")
    all_time_sold_fields: tuple[str, ...] = ("historical_sold", "item_card_display_sold_count.historical_sold_count")

    @classmethod
    def from_config(cls, cfg: dict[str, Any]) -> "ParseConfig":
        p = cfg.get("parse", {})
        return cls(
            price_divisor=int(p.get("price_divisor", cls.price_divisor)),
            monthly_sold_fields=tuple(p.get("monthly_sold_fields", cls.monthly_sold_fields)),
            all_time_sold_fields=tuple(p.get("all_time_sold_fields", cls.all_time_sold_fields)),
        )


@dataclass
class Item:
    itemid: int
    shopid: int
    name: str | None = None
    price: int | None = None
    sold: int | None = None
    historical_sold: int | None = None
    shop_location: str | None = None
    is_official_shop: bool | None = None
    shop_name: str | None = None


@dataclass
class Shop:
    shopid: int
    name: str | None = None
    username: str | None = None
    location: str | None = None
    joined_at: str | None = None  # YYYY-MM-DD
    is_official: bool | None = None
    description: str | None = None  # already cleaned (contact details stripped)
    followers: int | None = None
    rating: float | None = None
    item_count: int | None = None


@dataclass
class ShopVisit:
    """Everything captured for one shop in one run."""

    shop: Shop
    items: list[Item] = field(default_factory=list)
    has_profile: bool = False  # a shop object (description, followers, ...) was captured

    @property
    def monthly_sold_seen(self) -> int | None:
        values = [i.sold for i in self.items if i.sold is not None]
        return sum(values) if values else None

    @property
    def all_time_sold_seen(self) -> int | None:
        values = [i.historical_sold for i in self.items if i.historical_sold is not None]
        return sum(values) if values else None


# --- tree walking / classification -------------------------------------------------


def walk(obj: Any) -> Iterator[dict[str, Any]]:
    """Yield every dict in a JSON tree, parents before children."""
    stack = [obj]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            yield node
            stack.extend(reversed(list(node.values())))
        elif isinstance(node, list):
            stack.extend(reversed(node))


def _as_int(value: Any) -> int | None:
    if isinstance(value, bool) or value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _is_review(d: dict[str, Any]) -> bool:
    return not _REVIEW_KEYS.isdisjoint(d)


def is_item(d: dict[str, Any]) -> bool:
    return "itemid" in d and "shopid" in d and not _is_review(d) and _as_int(d["itemid"]) is not None


def is_shop(d: dict[str, Any]) -> bool:
    if "shopid" not in d or "itemid" in d or _is_review(d) or _as_int(d["shopid"]) is None:
        return False
    keys = d.keys()
    return not _SHOP_STRONG_KEYS.isdisjoint(keys) or len(_SHOP_WEAK_KEYS & keys) >= 3


def looks_blocked(body: Any) -> bool:
    """True if a JSON response is Shopee's anti-bot / verification answer."""
    if not isinstance(body, dict):
        return False
    error = _as_int(body.get("error"))
    if error in _BLOCK_ERRORS:
        return True
    return bool(error) and "action_type" in body and "tracking_id" in body


def _overlay(base: dict[str, Any], top: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    out.update({k: v for k, v in top.items() if v is not None})
    return out


class Capture:
    """Accumulates items and shops across many responses, merging repeats by id."""

    def __init__(self) -> None:
        self.items: dict[int, dict[str, Any]] = {}
        self.shops: dict[int, dict[str, Any]] = {}
        self._shop_richness: dict[int, int] = {}

    def add(self, body: Any) -> tuple[int, int]:
        """Classify every object in a response. Returns (items found, shops found)."""
        n_items = n_shops = 0
        for d in walk(body):
            if is_item(d):
                itemid = int(d["itemid"])
                self.items[itemid] = _overlay(self.items.get(itemid, {}), d)
                n_items += 1
            elif is_shop(d):
                shopid = int(d["shopid"])
                richness = len(_SHOP_KEYS & d.keys())
                old = self.shops.get(shopid, {})
                # The object with more shop fields wins conflicts (a profile beats a stub).
                if richness >= self._shop_richness.get(shopid, 0):
                    self.shops[shopid] = _overlay(old, d)
                    self._shop_richness[shopid] = richness
                else:
                    self.shops[shopid] = _overlay(d, old)
                n_shops += 1
        return n_items, n_shops

    def items_for(self, shopid: int) -> list[dict[str, Any]]:
        return [d for d in self.items.values() if _as_int(d.get("shopid")) == shopid]


# --- field extraction --------------------------------------------------------------


def get_path(d: dict[str, Any], path: str) -> Any:
    node: Any = d
    for part in path.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def _first(d: dict[str, Any], paths: tuple[str, ...]) -> Any:
    for path in paths:
        value = get_path(d, path)
        if value is not None:
            return value
    return None


def normalize_location(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    words = value.strip().title().split()
    return " ".join(w.upper() if w.upper() in {"DKI", "DI"} else w for w in words)


def _ctime_to_date(value: Any) -> str | None:
    ts = _as_int(value)
    if not ts or ts <= 0:
        return None
    if ts > 10**12:  # milliseconds
        ts //= 1000
    try:
        return datetime.fromtimestamp(ts).date().isoformat()
    except (OverflowError, OSError, ValueError):
        return None


def parse_item(d: dict[str, Any], cfg: ParseConfig) -> Item:
    raw_price = _as_int(_first(d, _PRICE_FIELDS))
    name = d.get("name")
    shop_name = d.get("shop_name")
    official = d.get("is_official_shop")
    return Item(
        itemid=int(d["itemid"]),
        shopid=int(d["shopid"]),
        name=strip_contact_details(name.strip()) if isinstance(name, str) else None,
        price=round(raw_price / cfg.price_divisor) if raw_price is not None else None,
        sold=_as_int(_first(d, cfg.monthly_sold_fields)),
        historical_sold=_as_int(_first(d, cfg.all_time_sold_fields)),
        shop_location=normalize_location(d.get("shop_location")),
        is_official_shop=official if isinstance(official, bool) else None,
        shop_name=shop_name.strip() if isinstance(shop_name, str) and shop_name.strip() else None,
    )


def parse_shop(d: dict[str, Any]) -> Shop:
    account = d.get("account") if isinstance(d.get("account"), dict) else {}
    username = account.get("username") or d.get("username")
    name = d.get("name") or d.get("shop_name")
    rating = d.get("rating_star")
    try:
        rating = round(float(rating), 2) if rating is not None and float(rating) > 0 else None
    except (TypeError, ValueError):
        rating = None
    official = d.get("is_official_shop")
    description = d.get("description")
    return Shop(
        shopid=int(d["shopid"]),
        name=name.strip() if isinstance(name, str) and name.strip() else None,
        username=username if isinstance(username, str) and username else None,
        location=normalize_location(d.get("shop_location") or d.get("place")),
        joined_at=_ctime_to_date(d.get("ctime")),
        is_official=official if isinstance(official, bool) else None,
        description=clean_description(description) if isinstance(description, str) else None,
        followers=_as_int(d.get("follower_count")),
        rating=rating,
        item_count=_as_int(d.get("item_count")),
    )


def build_visit(capture: Capture, shopid: int, cfg: ParseConfig) -> ShopVisit | None:
    """Combine the shop profile and every item seen for one shop."""
    raw_shop = capture.shops.get(shopid)
    items = [parse_item(d, cfg) for d in capture.items_for(shopid)]
    if raw_shop is None and not items:
        return None
    shop = parse_shop(raw_shop) if raw_shop is not None else Shop(shopid=shopid)
    # Items carry a few shop fields too; use them when the profile lacks them.
    if shop.location is None:
        locations = Counter(i.shop_location for i in items if i.shop_location)
        shop.location = locations.most_common(1)[0][0] if locations else None
    if shop.is_official is None:
        flags = [i.is_official_shop for i in items if i.is_official_shop is not None]
        shop.is_official = any(flags) if flags else None
    if shop.name is None:
        shop.name = next((i.shop_name for i in items if i.shop_name), None)
    return ShopVisit(shop=shop, items=items, has_profile=raw_shop is not None)


def rank_candidates(capture: Capture, cfg: ParseConfig) -> list[tuple[int, int, bool]]:
    """Shops seen in search results as (shopid, summed monthly sold, is_official), best first."""
    sold: Counter[int] = Counter()
    official: dict[int, bool] = {}
    for d in capture.items.values():
        item = parse_item(d, cfg)
        sold[item.shopid] += item.sold or 0
        official[item.shopid] = official.get(item.shopid, False) or bool(item.is_official_shop)
    for shopid, d in capture.shops.items():
        sold.setdefault(shopid, 0)
        if d.get("is_official_shop") is True:
            official[shopid] = True
    return [(sid, total, official.get(sid, False)) for sid, total in sold.most_common()]


# --- privacy scrub for raw captures -----------------------------------------------

_PERSONAL_KEY_PARTS = (
    "phone",
    "email",
    "address",
    "birthday",
    "gender",
    "real_name",
    "full_name",
    "nickname",
    "portrait",
    "avatar",
    "author_",
    "buyer_",
    "userid",
    "user_id",
    "fbid",
    "contact",
)
_UNTOUCHED_KEYS = {"image", "images", "cover", "video_info_list"}


def _is_personal_key(key: str) -> bool:
    k = key.lower()
    return any(part in k for part in _PERSONAL_KEY_PARTS)


def scrub(obj: Any, key: str | None = None) -> Any:
    """Copy of a JSON tree without personal fields and with contact details stripped from text.

    Raw captures are saved through this so data/raw never holds owner or buyer details.
    """
    if isinstance(obj, dict):
        return {k: scrub(v, k) for k, v in obj.items() if not _is_personal_key(str(k))}
    if isinstance(obj, list):
        return [scrub(v, key) for v in obj]
    if isinstance(obj, str) and key is not None:
        k = key.lower()
        if k in _UNTOUCHED_KEYS or k.endswith("id") or k.endswith("ids"):
            return obj
        return clean_description(obj) if k == "description" else strip_contact_details(obj)
    return obj
