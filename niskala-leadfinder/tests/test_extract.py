import pytest

from leadfinder.extract import clean_description, extract_socials, strip_contact_details

# --- Instagram ---------------------------------------------------------------------


@pytest.mark.parametrize(
    "text, expected",
    [
        ("IG: @glowria.id", "glowria.id"),
        ("IG:@Glowria_ID", "glowria_id"),
        ("ig @glowria", "glowria"),
        ("Follow ig kami @kolagenku_ ya kak 💕", "kolagenku_"),
        ("follow IG kita ya @skin.by.nisa untuk promo", "skin.by.nisa"),
        ("insta: beautyhouse.official", "beautyhouse.official"),
        ("📸 Instagram 👉 glowria.id", "glowria.id"),
        ("✨INSTAGRAM✨ : @GLOWRIA.ID.", "glowria.id"),
        ("Instagram - glowria_skin", "glowria_skin"),
        ("Cek instagram.com/glowria.id untuk testimoni", "glowria.id"),
        ("https://www.instagram.com/glowria.id/?hl=id", "glowria.id"),
        ("Kunjungi IG & TikTok: @glowria.id", "glowria.id"),
        ("IG/TT @glowria_beauty", "glowria_beauty"),
    ],
)
def test_instagram_found(text, expected):
    assert extract_socials(text).instagram == expected


@pytest.mark.parametrize(
    "text",
    [
        "Barang ORIGINAL 100% BPOM",
        "Big sale 12.12!! Dijamin original",
        "Follow us @glowria",  # no platform named: ambiguous, left for manual check
        "IG ready stock semua varian",  # 'ig' with no @ and no separator
        "https://www.instagram.com/p/C1abcDEF/",  # a post, not a profile
        "Email: cs@glowria.co.id",
    ],
)
def test_instagram_not_found(text):
    assert extract_socials(text).instagram is None


def test_ig_and_tiktok_on_one_line_are_kept_apart():
    s = extract_socials("IG: glowria, TikTok @glowtt")
    assert s.instagram == "glowria"
    assert s.tiktok == "glowtt"


def test_multiple_handles_are_joined_and_deduplicated():
    s = extract_socials("IG: @glowria.id\nIG reseller: @glowria.reseller\nig @GLOWRIA.ID")
    assert s.instagram == "glowria.id, glowria.reseller"


# --- TikTok ------------------------------------------------------------------------


@pytest.mark.parametrize(
    "text, expected",
    [
        ("TikTok: @glowria.id", "glowria.id"),
        ("tiktok @Glowria_Official", "glowria_official"),
        ("Tik Tok kami @glowria_tt 🎵", "glowria_tt"),
        ("tiktok.com/@glowria.id", "glowria.id"),
        ("https://www.tiktok.com/@glowria.id?lang=id-ID", "glowria.id"),
        ("Live tiap malam di https://vt.tiktok.com/ZSabC123/", "vt.tiktok.com/ZSabC123"),
        ("TikTok Shop kami: @glowria", "glowria"),
    ],
)
def test_tiktok_found(text, expected):
    assert extract_socials(text).tiktok == expected


def test_tiktok_shop_mention_without_handle_is_ignored():
    assert extract_socials("Belanja juga di TikTok Shop ya kak").tiktok is None


# --- link in bio / website ---------------------------------------------------------


@pytest.mark.parametrize(
    "text, expected",
    [
        ("Info lengkap: lynk.id/kolagenku", "lynk.id/kolagenku"),
        ("linktr.ee/Glowria.ID", "linktr.ee/glowria.id"),
        ("Katalog 👉 https://s.id/glowria", "s.id/glowria"),
        ("heylink.me/glowria/", "heylink.me/glowria"),
        ("beacons.ai/glowria", "beacons.ai/glowria"),
        ("Semua link: bio.link/glowria", "bio.link/glowria"),
    ],
)
def test_link_in_bio(text, expected):
    s = extract_socials(text)
    assert s.link_in_bio == expected
    assert s.website is None


@pytest.mark.parametrize(
    "text, expected",
    [
        ("🌐 www.glowria.co.id", "glowria.co.id"),
        ("Website: https://GlowriaSkin.com/shop", "glowriaskin.com"),
        ("Belanja langsung di glowria.store ya!", "glowria.store"),
        ("IG: glowria.id | web: https://glowria.id", "glowria.id"),  # explicit URL wins over handle rule
    ],
)
def test_own_website(text, expected):
    assert extract_socials(text).website == expected


@pytest.mark.parametrize(
    "text",
    [
        "Cek keaslian di cekbpom.pom.go.id",
        "Order juga di tokopedia.com/glowria atau shopee.co.id/glowria",
        "Ready stock.Kirim hari ini",
        "Pengiriman cepat.Kirim sebelum jam 3, original.Garansi uang kembali",
        "Chat admin wa.me/6281234567890",
        "Email kami glowria@gmail.com",
        "Promo di bit.ly/glowria-promo",
        "IG: glowria.id",  # a handle that looks like a domain is not a website
        "Follow @glowria.id",
        "facebook.com/glowria youtube.com/@glowria",
        "Sertifikat halal: halal.go.id",
    ],
)
def test_not_own_website(text):
    assert extract_socials(text).website is None


def test_realistic_description():
    text = (
        "✨ GLOWRIA SKINCARE ✨\n100% ORIGINAL & BPOM NA18201234567\n\n"
        "📸 IG: @glowria.id\n🎵 TikTok: @glowria.id\n🌐 www.glowria.co.id\n"
        "Testimoni: linktr.ee/glowria\nOrder grosir WA 0812-3456-7890"
    )
    s = extract_socials(clean_description(text))
    assert s.instagram == "glowria.id"
    assert s.tiktok == "glowria.id"
    assert s.website == "glowria.co.id"
    assert s.link_in_bio == "linktr.ee/glowria"


def test_empty_description():
    assert extract_socials(None) == extract_socials("")
    assert extract_socials(None).instagram is None


# --- phone / email / address stripping ---------------------------------------------


@pytest.mark.parametrize(
    "text",
    [
        "WA 0812-3456-7890",
        "Admin: 0857 1234 5678 (fast respon)",
        "Hub +62 812 3456 7890",
        "+62-812-3456-7890",
        "WA:6281234567890",
        "Telp (022) 7654321",
        "CS 021-55512345",
        "(+62) 812.3456.7890",
        "0812345678901",
    ],
)
def test_phone_numbers_stripped(text):
    cleaned = strip_contact_details(text)
    assert "[phone removed]" in cleaned
    assert not any(seq in cleaned for seq in ("3456", "5678", "7654321", "5551"))


@pytest.mark.parametrize(
    "text",
    [
        "BPOM NA18201234567",
        "Harga Rp 62.500.000 untuk paket reseller",
        "Rp62.500 aja",
        "Promo 10.10 jam 08.00-17.00",
        "Libur 06-10-2025 s/d 08-10-2025",
        "Terjual 10.000+ pcs",
        "Netto 30ml, isi 60 kapsul",
        "POM TR 203645221",
    ],
)
def test_non_phone_numbers_kept(text):
    assert strip_contact_details(text) == text


@pytest.mark.parametrize(
    "text, gone",
    [
        ("https://wa.me/6285712345678", "6285712345678"),
        ("wa.me/6281234567890?text=halo", "6281234567890"),
        ("https://api.whatsapp.com/send?phone=6281234567890", "6281234567890"),
        ("Email: cs@glowria.co.id", "cs@glowria.co.id"),
        ("lokasi: https://maps.app.goo.gl/AbCdEf123", "maps.app.goo.gl"),
    ],
)
def test_links_and_emails_stripped(text, gone):
    assert gone not in strip_contact_details(text)


def test_instagram_handle_is_not_an_email():
    assert strip_contact_details("IG:@glowria.id") == "IG:@glowria.id"


def test_address_lines_stripped():
    text = (
        "Toko offline:\nAlamat: Jl. Mawar No. 5, Bandung\nToko kami di Jl. Merdeka No 10 Bandung\n"
        "📍 Surabaya Timur\nSudah jalan 5 tahun melayani"
    )
    cleaned = clean_description(text)
    assert "Mawar" not in cleaned and "Merdeka" not in cleaned and "Surabaya Timur" not in cleaned
    assert "Sudah jalan 5 tahun melayani" in cleaned
    assert cleaned.count("[address removed]") == 3


def test_clean_description_keeps_none():
    assert clean_description(None) is None
