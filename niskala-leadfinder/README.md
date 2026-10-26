# Niskala Shopee Lead Finder

A local tool that finds Indonesian skincare and supplement sellers on Shopee, stores their
**public shop data** in SQLite, scores them against the Niskala ICP, and gives you a lead list
to work by hand.

ICP: Shopee sellers doing roughly 300–2,000 orders/month, with repeat customers and no
website of their own.

It is a personal tool for one person on one Linux machine. It is not a SaaS.

---

## Rules this tool follows

| Rule                                  | How it is enforced                                                                                                                                                                                                                                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public business data only             | Only shop/item fields are kept. Phone numbers, emails, WhatsApp links, map links and street-address lines are stripped from descriptions before storing. Owner/buyer fields (`userid`, `portrait`, `author_*`, `email`, `phone`, `address`, …) are dropped from raw captures too. Your own account responses are never saved. |
| No Instagram/TikTok/WhatsApp scraping | Handles come only from what the shop wrote in its own Shopee description. Looking at their IG/TikTok is your manual step.                                                                                                                                                                                                     |
| Low volume, human pace                | Max 40 shop pages per run by default. Random 5–11 s pause before every page load. One page at a time. No proxies, no CAPTCHA solving, no fingerprint spoofing.                                                                                                                                                                |
| Walls → you                           | On a verification/CAPTCHA/login page the run pauses and asks you to solve it in the browser, then retries that page.                                                                                                                                                                                                          |
| No direct API calls                   | The tool never calls `/api/v4/...` itself. It reads the JSON that the real Shopee pages load in your browser.                                                                                                                                                                                                                 |
| No Shopee Open Platform               | Not used: it only gives sellers access to their own shop.                                                                                                                                                                                                                                                                     |

---

## Setup on Linux

Needs Python 3.11 or newer.

```bash
cd niskala-leadfinder
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
# If Chromium won't start because of missing system libraries (Debian/Ubuntu):
sudo .venv/bin/python -m playwright install-deps chromium
```

Optional: run the tests. No network needed; they use hand-written fixture JSON.

```bash
pip install -r requirements-dev.txt
python -m pytest
```

There is also an opt-in check that drives the real headed browser against a local fake site,
never Shopee: `LEADFINDER_BROWSER_TEST=1 python -m pytest tests/test_scrape_local.py`.

Every command below is run from the `niskala-leadfinder/` folder with the venv active.

---

## First login and the first (tiny) run

Do this before any real run. It checks that the field names match what the parser expects.

```bash
python -m leadfinder scrape --keywords "serum niacinamide" --pages 1 --max-shops 3
```

1. A Chromium window opens on shopee.co.id. **Log in by hand.** The session is stored in
   `.shopee-profile/`, so this is only needed once. Treat that folder like a password: it holds
   your Shopee cookies.
2. Press Enter in the terminal. The tool loads one search page, ranks the shops it saw, and
   visits the top 3.
3. At the end it prints a **field coverage report**. Look for `<- MISSING everywhere`. That
   means Shopee renamed a field. See [When Shopee changes field names](#when-shopee-changes-field-names).
4. It also prints three product links with the parsed price and `sold` / `historical_sold`.
   Use them for the [sold field check](#verifying-the-sold-field) below.

---

## A normal run

```bash
python -m leadfinder scrape                         # keywords + pages from config.toml
python -m leadfinder scrape --keywords "serum niacinamide" "suplemen kolagen" --pages 2 --max-shops 40
```

What happens:

1. For each keyword it loads `shopee.co.id/search?keyword=…&page=n` and scrolls slowly.
2. Shops are ranked by the summed `sold` of their items seen in the results.
3. Shopee Mall shops are skipped, because they would score `skip` anyway (`skip_official_candidates`).
   So are shops whose profile was captured in the last 14 days, unless you pass `--refresh`.
4. It visits the top `--max-shops` shop pages (`shopee.co.id/shop/<shopid>`) and scrolls them.
   Each shop is saved and scored **as soon as its page is read**.
5. Raw captured JSON (privacy-scrubbed) goes to `data/raw/<run_id>/`.

With the defaults (2 keywords × 2 pages + 40 shops) a run takes about **15–20 minutes**.
That is intentional.

- **Verification / CAPTCHA / login wall:** the terminal says so. Solve it in the browser window,
  press Enter, and that page is retried.
- **"Nothing was captured on this page":** usually a wall the tool didn't recognise, or a slow page.
  Look at the browser, fix what you see, press Enter to retry, or type `s` + Enter to skip.
- **Ctrl+C:** stops the run. Every shop already visited is in the database. The shop being
  loaded is saved with whatever was captured. The run is marked as interrupted. Closing the
  browser window does the same.

---

## Working the leads

```bash
python -m leadfinder list                          # top 20 by score
python -m leadfinder list --label good --status new --limit 50
python -m leadfinder list --label check --reasons  # also print why each scored that way

python -m leadfinder mark 111222333 --status contacted --channel ig_dm --note "DM'd about WA capture" --followup 3d
python -m leadfinder mark 111222333 --status replied --note "asked for pricing" --followup tomorrow
python -m leadfinder mark 111222333 --followup none   # clear the follow-up date
python -m leadfinder followups                     # follow-ups due today or overdue

python -m leadfinder export --label good --status new   # exports/leads_<date>.csv (UTF-8 BOM)
python -m leadfinder stats                         # aggregates for a content post, no shop names
python -m leadfinder score                         # recompute all scores after editing config.toml
```

- `mark`: statuses are `new researching contacted replied call_booked won lost not_fit`.
  Channels are `ig_dm tiktok_dm shopee_chat other`. `--followup` takes `3d`, `2w`, `today`,
  `tomorrow`, `YYYY-MM-DD` or `none`. Notes are appended with the date, never overwritten.
  `contacted_at` is set the first time a lead is marked `contacted`.
- **Re-scraping never overwrites** `status`, `contacted_at`, `next_followup_at` or `notes`.
  Only the score fields change.
- `stats` prints percentages and medians only. Cities with fewer than `min_group_size` shops are
  grouped as "Other" so no single shop can be picked out.
- The CSV opens cleanly in Excel and Google Sheets. Cells that start with `= + - @` get a leading
  `'` so they are never run as formulas.

---

## Tuning `config.toml`

Every value marked `TODO` is a guess. Tune them after your first few runs.

| Section        | What to tune                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `[scrape]`     | Default keywords, pages per keyword, `max_shops` (keep 40), delays, `skip_recent_days`, scroll steps.    |
| `[parse]`      | `price_divisor` and which JSON fields mean monthly vs all-time sold. Change these here, no code edits.   |
| `[score]`      | Sold range (300–2,000), points per signal, penalties, label cut-offs (`good` ≥ 70, `check` ≥ 45).        |
| `[categories]` | Words that count as skincare / supplement in item names. Add the words your target sellers actually use. |
| `[stats]`      | `min_group_size` for the city breakdown.                                                                 |

How the score works (0–100). The reasons for each lead are stored in `score_reasons`:

- Monthly sold seen in 300–2,000: **+50**. Near the range (≥150): +20. Above 2,000: +15 (maybe too
  big). This only counts items the tool saw, so it is a **lower bound**. The reasons say how many
  items were seen.
- Category match (skincare/supplement words in item names): up to **+25**. Full points when ≥30% of
  the seen items match.
- Lists Instagram or TikTok in the description: **+25**.
- Lists its own website: **−25**, and the label is capped at `check`, not `skip`. It could still be a
  "your site isn't converting" pitch.
- Shopee Mall / official: label **`skip`**.
- Joined less than 6 months ago: **−20**.
- Rating below 4.5: **−5**.
- Shop profile never captured: label capped at `check`, because socials and website are unknown.

After changing `[score]` or `[categories]`, run `python -m leadfinder score`.
After changing `[parse]`, run `python -m leadfinder reparse <run_id>` for each run you want rebuilt.

---

## Verifying the `sold` field

**Result: TODO — not verified yet.** The tool was built in an environment that could not reach
shopee.co.id, so this has to be done on your first tiny run.

Current assumption: `sold` ≈ sales in the last 30 days and `historical_sold` = all-time.
`monthly_sold_seen` is built from `sold`.

How to check (5 minutes):

1. Run the tiny test above. The end of the output lists three items as
   `Rp<price> sold=<n> historical_sold=<n>` with a `https://shopee.co.id/product/<shopid>/<itemid>` link.
2. Open 2–3 of those links. Compare:
   - the price on the page with `Rp<price>`. If it is off by a factor of 10/100/1000, fix
     `[parse].price_divisor`.
   - the "terjual" number(s) on the page, including any "terjual/bulan" figure, with `sold` and
     `historical_sold`.
3. If `sold` matches the monthly figure, replace the **Result** line above with what you saw
   (date + 2–3 examples).
4. If `sold` is actually all-time, swap the two lists in `[parse]` (`monthly_sold_fields` /
   `all_time_sold_fields`), then run `python -m leadfinder reparse <run_id>`. No re-scrape needed.

---

## When Shopee changes field names

The parser doesn't depend on endpoint paths. It walks every JSON response and classifies objects
by shape:

- **Item:** has `itemid` and `shopid`. Keeps `name`, `price`, `sold`, `historical_sold`,
  `shop_location`. The newer `item_card_display_price` / `item_card_display_sold_count` shape is
  handled too.
- **Shop:** has `shopid` plus some of `follower_count`, `rating_star`, `item_count`, `account`,
  `ctime`, `description`, `is_official_shop`, `shop_location`.
- Buyer reviews (`cmtid`, `author_*`) are never treated as items.

If the coverage report shows a field `MISSING everywhere`:

1. Open a file in `data/raw/<run_id>/` (e.g. `0003_shop.json`) and find what the field is called now.
2. Sold/price fields: add the new dotted path to the lists in `[parse]`. Other shop fields: adjust
   `parse_shop()` / `parse_item()` in `leadfinder/parse.py`.
3. `python -m leadfinder reparse <run_id>` rebuilds that run from the raw files without touching Shopee.

---

## Data and privacy

| Where                | What                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `data/leads.db`      | SQLite: `runs`, `shops`, `shop_snapshots` (one row per shop per run), `items`, `leads`. |
| `data/raw/<run_id>/` | Scrubbed JSON captures, `visits.jsonl` (pages loaded), `run.json`. Used by `reparse`.   |
| `exports/`           | CSV exports.                                                                            |
| `.shopee-profile/`   | Your logged-in browser profile.                                                         |

All four are gitignored. Back up with `cp data/leads.db ~/backups/leads_$(date +%F).db`.

Stripping is best effort. Phone numbers (08…, +62…, 62…, (0xx) landlines), emails, `wa.me` /
WhatsApp API links, Google Maps links, lines starting with `Alamat`/`Address`/📍, and text after
`Jl.` / `Jln.` / `Jalan <Name>` are replaced with placeholders like `[phone removed]`. A long
numeric licence number that starts with `0` can be removed by mistake. Over-stripping is the safe
direction.

---

## Apify evaluation: skipped

I checked the Apify Store for Shopee Indonesia scrapers that could be an optional
`--source apify`. **None qualified, so it is not built**, and there is no `.env` / `APIFY_TOKEN`.
`--source apify` prints a pointer to this section.

What I found, through web search only: apify.com was not reachable from the build environment,
so I could not open the actor pages, run stats or reviews.

- **Shop-profile actors**: [axlymxp/shopee-seller-scraper](https://apify.com/axlymxp/shopee-seller-scraper),
  [incognito_mode/shopee-shop-scraper](https://apify.com/incognito_mode/shopee-shop-scraper),
  [herus13/shopee-shop-scraper](https://apify.com/herus13/shopee-shop-scraper). These return
  followers, rating, item count and shop age, but no confirmed shop **description** (needed for the
  social/website signals) and no shop-level **sales**. One also advertises "contact signals", which
  this tool must not store.
- **Product actors**: [xtracto/shopee-shop-scraper](https://apify.com/xtracto/shopee-shop-scraper),
  [enrico_7/shopee-scraper](https://apify.com/enrico_7/shopee-scraper),
  [memo23/shopee-scraper](https://apify.com/memo23/shopee-scraper),
  [fatihtahta/shopee-scraper](https://apify.com/fatihtahta/shopee-scraper). These return sold counts
  per product, but no confirmed shop description. One listing notes a mid-2026 Shopee change that made
  product detail partial and descriptions browser-only.
- **Recent successful runs and reviews:** could not be verified. The review counts that showed up
  in search snapshots were small and inconsistent (e.g. 4.9 from 6 reviews vs 3.6 from 8 for the
  same actor).
- **Cost** would have been fine: ~$3–20 per 1,000 results, so ~40 shops is well under the
  $5/month free tier. Cost was not the blocker.

To revisit later: find an actor whose output schema has the shop `description` **and** sales.
Check its Runs tab for recent successes, then map its output onto `parse.Shop` / `parse.Item`
and call `db.save_visit()` the way `scrape_playwright.run()` does.

---

## Moving to Postgres later

`schema.sql` uses plain types (`TEXT`, `BIGINT`, `INTEGER`, `DOUBLE PRECISION`, `BOOLEAN`,
`DATE`, `TIMESTAMP`). It has explicit primary keys, no `AUTOINCREMENT`, and
`INSERT … ON CONFLICT … DO UPDATE` upserts. It should run unchanged on Postgres. In `db.py`,
change the `?` placeholders to `%s` and swap `sqlite3` for `psycopg`.

---

## Project layout

```
leadfinder/
  __main__.py           CLI (argparse): scrape, score, list, export, mark, followups, stats, reparse
  scrape_playwright.py  headed Chromium + response interception, walls, Ctrl+C, reparse
  parse.py              JSON tree walking, item/shop classification, privacy scrub
  extract.py            phone/email/address stripping, IG/TikTok/link-in-bio/website regexes
  score.py              ICP score + reasons
  db.py                 SQLite access, applies schema.sql on connect
  config.py             paths + config.toml loading
schema.sql              tables (Postgres-portable)
config.toml             keywords, thresholds, delays, max shops (TODO values flagged)
tests/                  pytest suite + hand-written Shopee-shaped fixtures
data/  exports/         gitignored
```

## Known gaps

- **Not yet run against real Shopee.** The build environment's network blocks shopee.co.id.
  The browser flow (interception, wall pause, Ctrl+C, skip rules) was tested end to end against a
  local fake site. Field names and shapes come from hand-written fixtures. The tiny first run above
  is the real test.
- The anti-bot error code (`90309999`) and the wall URL patterns are from public reports (TODO verify).
  The "nothing captured" prompt catches walls the tool doesn't recognise.
- Handles written without a platform ("Follow kami @glowria") are not captured, because the platform
  is ambiguous. Check those by hand.
- Ranking candidates by summed `sold` favours bigger shops. Shops over 2,000/month still get visited
  and score lower.
