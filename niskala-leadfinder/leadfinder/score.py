"""ICP score (0-100) with a readable reason string. All thresholds come from config.toml [score]."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any

DEFAULTS: dict[str, float] = {
    "monthly_sold_min": 300,
    "monthly_sold_max": 2000,
    "monthly_sold_near_min": 150,
    "points_sold_in_range": 50,
    "points_sold_near": 20,
    "points_sold_above": 15,
    "points_category": 25,
    "category_full_share": 0.3,
    "points_social": 25,
    "penalty_website": 25,
    "penalty_young_shop": 20,
    "young_shop_months": 6,
    "penalty_low_rating": 5,
    "rating_min": 4.5,
    "label_good_min": 70,
    "label_check_min": 45,
}


@dataclass
class ScoreInput:
    is_official: bool | None = None
    joined_at: str | None = None  # YYYY-MM-DD
    rating: float | None = None
    monthly_sold_seen: int | None = None
    items_seen: int = 0
    instagram: str | None = None
    tiktok: str | None = None
    website: str | None = None
    has_profile: bool = True  # the shop page (description etc.) was captured at least once
    item_names: list[str] = field(default_factory=list)
    shop_text: str = ""  # shop name + description, used when no item names are known


@dataclass(frozen=True)
class ScoreResult:
    score: int
    label: str
    reasons: str


def _months_between(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + (end.month - start.month) - (end.day < start.day)


def _category_share(names: list[str], terms: list[str]) -> float:
    if not names:
        return 0.0
    hits = sum(any(t in n.lower() for t in terms) for n in names)
    return hits / len(names)


def score_shop(
    inp: ScoreInput,
    score_cfg: dict[str, Any],
    categories: dict[str, list[str]],
    today: date | None = None,
) -> ScoreResult:
    c = {**DEFAULTS, **score_cfg}
    today = today or date.today()
    points = 0.0
    reasons: list[str] = []

    # Sales: only items we actually saw are counted, so this is a lower bound.
    sold = inp.monthly_sold_seen
    lo, hi = int(c["monthly_sold_min"]), int(c["monthly_sold_max"])
    seen = f"{inp.items_seen} item{'' if inp.items_seen == 1 else 's'} seen, lower bound"
    if sold is None:
        reasons.append("monthly sold unknown (+0)")
    elif lo <= sold <= hi:
        points += c["points_sold_in_range"]
        reasons.append(f"monthly sold ≥{sold} in {lo}-{hi} (+{c['points_sold_in_range']:g}; {seen})")
    elif sold > hi:
        points += c["points_sold_above"]
        reasons.append(f"monthly sold ≥{sold} above {hi}, maybe too big (+{c['points_sold_above']:g}; {seen})")
    elif sold >= c["monthly_sold_near_min"]:
        points += c["points_sold_near"]
        reasons.append(f"monthly sold ≥{sold} near {lo} (+{c['points_sold_near']:g}; {seen})")
    else:
        reasons.append(f"monthly sold ≥{sold} below {lo} (+0; {seen})")

    # Category fit from item names (or the shop's own text if no items were seen).
    names = inp.item_names or ([inp.shop_text] if inp.shop_text else [])
    best_cat, best_share = None, 0.0
    for cat, terms in categories.items():
        share = _category_share(names, [t.lower() for t in terms])
        if share > best_share:
            best_cat, best_share = cat, share
    if best_cat:
        full = c["category_full_share"]
        pts = c["points_category"] * min(1.0, best_share / full) if full > 0 else c["points_category"]
        points += pts
        reasons.append(f"category {best_cat}: {best_share:.0%} of {len(names)} names (+{pts:.0f})")
    else:
        reasons.append("no category match (+0)")

    # Reachability: socials the shop listed itself.
    socials = [f"IG {inp.instagram}" if inp.instagram else "", f"TikTok {inp.tiktok}" if inp.tiktok else ""]
    socials = [s for s in socials if s]
    if socials:
        points += c["points_social"]
        reasons.append("lists " + " / ".join(socials) + f" (+{c['points_social']:g})")
    elif inp.has_profile:
        reasons.append("no IG/TikTok in description (+0)")

    if inp.website:
        points -= c["penalty_website"]
        reasons.append(f"lists own website {inp.website} (-{c['penalty_website']:g})")

    if inp.joined_at:
        try:
            joined = date.fromisoformat(inp.joined_at)
        except ValueError:
            joined = None
        if joined and _months_between(joined, today) < c["young_shop_months"]:
            points -= c["penalty_young_shop"]
            reasons.append(
                f"joined {inp.joined_at}, under {c['young_shop_months']:g} months (-{c['penalty_young_shop']:g})"
            )
    else:
        reasons.append("join date unknown")

    if inp.rating is not None and inp.rating < c["rating_min"]:
        points -= c["penalty_low_rating"]
        reasons.append(f"rating {inp.rating:g} below {c['rating_min']:g} (-{c['penalty_low_rating']:g})")

    score = int(round(max(0.0, min(100.0, points))))
    if score >= c["label_good_min"]:
        label = "good"
    elif score >= c["label_check_min"]:
        label = "check"
    else:
        label = "low"

    if inp.website and label == "good":
        label = "check"
        reasons.append("label capped at check (own website: pitch would be 'your site isn't converting')")
    if not inp.has_profile:
        reasons.append("shop profile not captured: socials/website unknown")
        if label == "good":
            label = "check"
    if inp.is_official:
        label = "skip"
        reasons.insert(0, "SKIP Shopee Mall / official shop, likely too big")

    return ScoreResult(score=score, label=label, reasons="; ".join(reasons))
