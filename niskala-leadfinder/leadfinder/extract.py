"""Contact-detail stripping and social/website extraction from a shop's own description.

Everything here works on text the shop itself published on Shopee. Nothing is looked
up elsewhere: Instagram/TikTok handles are only what the shop wrote down.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# --- stripping personal contact details -------------------------------------------

PHONE_PLACEHOLDER = "[phone removed]"
EMAIL_PLACEHOLDER = "[email removed]"
WA_PLACEHOLDER = "[WA link removed]"
MAP_PLACEHOLDER = "[map link removed]"
ADDRESS_PLACEHOLDER = "[address removed]"

_WA_LINK_RE = re.compile(
    r"(?:https?://)?(?:www\.)?(?:wa\.me|wa\.link|api\.whatsapp\.com|web\.whatsapp\.com)/\S*",
    re.IGNORECASE,
)
_MAP_LINK_RE = re.compile(
    r"(?:https?://)?(?:maps\.app\.goo\.gl|goo\.gl/maps|maps\.google\.[a-z.]+|(?:www\.)?google\.[a-z.]+/maps)\S*",
    re.IGNORECASE,
)
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}")
# Indonesian phone numbers: 08xx / 02x landlines / +62 / 62, with spaces, dots, dashes or
# parentheses. Not glued to a word (so BPOM codes like NA18201234567 survive) and not a
# rupiah amount. The digit count is checked in _strip_phone.
_PHONE_RE = re.compile(
    r"(?<![\w+])(?<!rp )(?<!rp\. )(?<!rp\.)(?<!idr )"
    r"\(?(?:\+\s?62|62|0(?=\d{2}))\)?[ .\-]?"
    r"\(?\d{1,4}\)?(?:[ .\-]?\d{2,6}){1,4}(?!\d)",
    re.IGNORECASE,
)
# Street addresses (best effort): lines starting with "Alamat"/"Address"/a pin emoji, and
# anything from "Jl."/"Jln."/"Jalan <Name>" to the end of the line.
_ADDRESS_LINE_RE = re.compile(r"^[ \t]*(?:📍[ \t]*)?(?:alamat|address)\b.*$", re.IGNORECASE | re.MULTILINE)
_STREET_RE = re.compile(r"(?:\b(?:jl|jln)\.?[ \t]+|\bjalan[ \t]+(?=(?-i:[A-Z])))[^\n]*", re.IGNORECASE)
_PIN_LINE_RE = re.compile(r"^[ \t]*📍.*$", re.MULTILINE)


def _strip_phone(match: re.Match[str]) -> str:
    digits = sum(ch.isdigit() for ch in match.group(0))
    return PHONE_PLACEHOLDER if 9 <= digits <= 15 else match.group(0)


def strip_contact_details(text: str) -> str:
    """Remove phone numbers, emails and WhatsApp/map links from free text."""
    text = _WA_LINK_RE.sub(WA_PLACEHOLDER, text)
    text = _MAP_LINK_RE.sub(MAP_PLACEHOLDER, text)
    text = _EMAIL_RE.sub(EMAIL_PLACEHOLDER, text)
    return _PHONE_RE.sub(_strip_phone, text)


def clean_description(text: str | None) -> str | None:
    """Shop description as stored: contact details and street addresses stripped."""
    if text is None:
        return None
    text = strip_contact_details(text)
    text = _ADDRESS_LINE_RE.sub(ADDRESS_PLACEHOLDER, text)
    text = _PIN_LINE_RE.sub(ADDRESS_PLACEHOLDER, text)
    text = _STREET_RE.sub(ADDRESS_PLACEHOLDER, text)
    text = "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").split("\n"))
    return re.sub(r"\n{3,}", "\n\n", text).strip()


# --- social / website extraction ---------------------------------------------------

_HANDLE = r"[A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?"
_IG_WORD = r"(?:instagram|insta|ig)"
_TT_WORD = r"(?:tiktok|tik[ \-]?tok)"
_OTHER_PLATFORM = (
    r"(?:tiktok|tik[ \-]?tok|facebook|fb|youtube|yt|twitter|shopee|tokopedia|tokped|whatsapp|wa|line|telegram)"
)
# A separator that makes "IG: name" (no @) unambiguous.
_SEP = r"[ \t]*[:=\-–—>»→➡➜👉][️ \t:]*"


def _mention_patterns(word: str) -> tuple[re.Pattern[str], re.Pattern[str]]:
    lead = r"(?<![A-Za-z0-9@./])" + word + r"(?![A-Za-z0-9.])"
    # "Follow ig kami ya @handle": up to 25 chars of filler, but not across another platform name.
    with_at = re.compile(
        lead + r"(?:(?!(?<![A-Za-z])" + _OTHER_PLATFORM + r"(?![A-Za-z]))[^\n@]){0,25}?@(" + _HANDLE + ")",
        re.IGNORECASE,
    )
    # "insta: handle", "IG - handle", "IG 👉 handle"
    with_sep = re.compile(lead + _SEP + r"(" + _HANDLE + ")", re.IGNORECASE)
    return with_at, with_sep


_IG_AT, _IG_SEP = _mention_patterns(_IG_WORD)
_TT_AT, _TT_SEP = _mention_patterns(_TT_WORD)
# "IG & TikTok: @handle", "tiktok/ig @handle"
_BOTH_AT = re.compile(
    r"(?<![A-Za-z0-9@./])("
    + _IG_WORD
    + "|"
    + _TT_WORD
    + r")[ \t]*(?:&|/|\+|,|dan|and|n)[ \t]*("
    + _IG_WORD
    + "|"
    + _TT_WORD
    + r")(?![A-Za-z0-9])[^\n@]{0,12}?@("
    + _HANDLE
    + ")",
    re.IGNORECASE,
)
_IG_URL = re.compile(
    r"(?:https?://)?(?:www\.)?(?:instagram\.com|instagr\.am)/(?!p/|reels?/|stories/|explore/|accounts/|tv/)("
    + _HANDLE
    + ")",
    re.IGNORECASE,
)
_TT_URL = re.compile(r"(?:https?://)?(?:www\.|m\.)?tiktok\.com/@(" + _HANDLE + ")", re.IGNORECASE)
_TT_SHORT = re.compile(r"(?:https?://)?((?:vt|vm)\.tiktok\.com/[A-Za-z0-9]+)", re.IGNORECASE)

LINK_IN_BIO_DOMAINS = ("linktr.ee", "lynk.id", "bio.link", "s.id", "heylink.me", "beacons.ai")
_LINK_IN_BIO = re.compile(
    r"(?<![A-Za-z0-9.\-])(?:https?://)?(?:www\.)?("
    + "|".join(re.escape(d) for d in LINK_IN_BIO_DOMAINS)
    + r")/([A-Za-z0-9_\-.]*[A-Za-z0-9_\-])",
    re.IGNORECASE,
)

# TLD whitelist: Indonesian descriptions often skip the space after a period
# ("Ready stock.Kirim hari ini"), so arbitrary "word.word" must not count as a domain.
_TLDS = (
    "co.id",
    "my.id",
    "web.id",
    "biz.id",
    "or.id",
    "ac.id",
    "sch.id",
    "go.id",
    "id",
    "com",
    "net",
    "org",
    "store",
    "shop",
    "online",
    "site",
    "website",
    "xyz",
    "info",
    "co",
    "io",
    "me",
    "app",
    "page",
    "link",
    "biz",
    "asia",
    "beauty",
    "skin",
    "care",
    "health",
    "life",
    "world",
    "club",
    "ly",
    "ee",
    "am",
    "ai",
    "be",
    "gl",
    "to",
    "at",
)
_DOMAIN_RE = re.compile(
    r"(?<![@\w.\-/])(?:https?://)?(?:www\.)?"
    r"((?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+(?:" + "|".join(re.escape(t) for t in _TLDS) + r"))"
    r"(?![a-z0-9\-])",
    re.IGNORECASE,
)
# Hosts that are not "the shop's own website". Matched on the host and its parent domains.
NOT_OWN_WEBSITE = frozenset(
    {
        # marketplaces / retailers
        "shopee.co.id",
        "shopee.com",
        "shopee.sg",
        "shopee.com.my",
        "shope.ee",
        "shp.ee",
        "tokopedia.com",
        "tokopedia.link",
        "tokped.link",
        "lazada.co.id",
        "lazada.com",
        "lzd.co",
        "blibli.com",
        "bukalapak.com",
        "jd.id",
        "zalora.co.id",
        "sociolla.com",
        "bhinneka.com",
        # social networks
        "instagram.com",
        "instagr.am",
        "facebook.com",
        "fb.com",
        "fb.me",
        "fb.watch",
        "m.me",
        "youtube.com",
        "youtu.be",
        "twitter.com",
        "x.com",
        "t.me",
        "telegram.me",
        "threads.net",
        "pinterest.com",
        "linkedin.com",
        "line.me",
        "lin.ee",
        "tiktok.com",
        "snapchat.com",
        # WhatsApp
        "wa.me",
        "wa.link",
        "whatsapp.com",
        # email providers
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoo.co.id",
        "ymail.com",
        "hotmail.com",
        "outlook.com",
        "live.com",
        "icloud.com",
        "proton.me",
        "protonmail.com",
        "aol.com",
        # link-in-bio and shorteners (link-in-bio has its own column)
        *LINK_IN_BIO_DOMAINS,
        "bit.ly",
        "tinyurl.com",
        "cutt.ly",
        "goo.gl",
        "rebrand.ly",
        "shorturl.at",
        # maps, government / certification sites sellers often cite (BPOM, halal)
        "google.com",
        "go.id",
        "halalmui.org",
    }
)


@dataclass(frozen=True)
class Socials:
    instagram: str | None = None
    tiktok: str | None = None
    link_in_bio: str | None = None
    website: str | None = None


def _add(found: list[str], value: str, lower: bool = True) -> None:
    value = value.rstrip(".")
    if lower:
        value = value.lower()
    if value and value not in found:
        found.append(value)


def _join(values: list[str], limit: int = 3) -> str | None:
    return ", ".join(values[:limit]) or None


def _is_own_website(host: str) -> bool:
    host = host.lower()
    parts = host.split(".")
    return not any(".".join(parts[i:]) in NOT_OWN_WEBSITE for i in range(len(parts)))


def extract_socials(text: str | None) -> Socials:
    """Instagram, TikTok, link-in-bio and own-website mentions from a shop description.

    Values are lower-cased; several distinct handles are joined with ", ".
    """
    if not text:
        return Socials()
    ig: list[str] = []
    tt: list[str] = []
    bio: list[str] = []
    web: list[str] = []

    for m in _IG_URL.finditer(text):
        _add(ig, m.group(1))
    for m in _TT_URL.finditer(text):
        _add(tt, m.group(1))
    for m in _TT_SHORT.finditer(text):
        _add(tt, m.group(1), lower=False)  # short-link codes are case-sensitive
    for m in _BOTH_AT.finditer(text):
        platforms = {m.group(1).lower(), m.group(2).lower()}
        if platforms & {"ig", "insta", "instagram"}:
            _add(ig, m.group(3))
        if any("tok" in p for p in platforms):
            _add(tt, m.group(3))
    for pattern in (_IG_AT, _IG_SEP):
        for m in pattern.finditer(text):
            _add(ig, m.group(1))
    for pattern in (_TT_AT, _TT_SEP):
        for m in pattern.finditer(text):
            _add(tt, m.group(1))
    for m in _LINK_IN_BIO.finditer(text):
        _add(bio, f"{m.group(1)}/{m.group(2)}")
    handles = set(ig) | set(tt)
    for m in _DOMAIN_RE.finditer(text):
        host = m.group(1).lower()
        explicit = m.group(0).lower().startswith(("http", "www."))
        # "IG: glowria.id" is a handle, not a website, unless written as a URL.
        if _is_own_website(host) and (explicit or host not in handles):
            _add(web, host)

    return Socials(instagram=_join(ig), tiktok=_join(tt), link_in_bio=_join(bio), website=_join(web))
