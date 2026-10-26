-- Niskala Shopee Lead Finder schema. Applied on every start (idempotent).
--
-- Kept to plain, portable types so it moves to Postgres without changes:
--   * timestamps are stored as 'YYYY-MM-DD HH:MM:SS' local time (TIMESTAMP), dates as 'YYYY-MM-DD' (DATE)
--   * Shopee ids exceed 32 bits, so they are BIGINT
--   * no AUTOINCREMENT / rowid tricks; every table has an explicit primary key
--   * upserts use INSERT ... ON CONFLICT (...) DO UPDATE, which both databases support

CREATE TABLE IF NOT EXISTS runs (
    id            TEXT PRIMARY KEY,           -- e.g. 20261026-153000; also the data/raw/<run_id>/ folder
    started_at    TIMESTAMP NOT NULL,
    finished_at   TIMESTAMP,
    source        TEXT NOT NULL,              -- playwright | apify
    keywords      TEXT NOT NULL,              -- JSON array of the keywords searched
    shops_visited INTEGER NOT NULL DEFAULT 0,
    notes         TEXT
);

CREATE TABLE IF NOT EXISTS shops (
    shopid            BIGINT PRIMARY KEY,
    shop_name         TEXT,
    username          TEXT,
    shop_url          TEXT NOT NULL,
    location          TEXT,                   -- city/regency as shown by Shopee, e.g. "Kota Bandung"
    joined_at         DATE,
    is_official       BOOLEAN,                -- Shopee Mall
    description_clean TEXT,                   -- shop's own description, phone numbers/emails/addresses stripped
    instagram         TEXT,                   -- handles/links only from the shop's own description
    tiktok            TEXT,
    link_in_bio       TEXT,
    website           TEXT,
    first_seen_run    TEXT REFERENCES runs (id),
    last_seen_run     TEXT REFERENCES runs (id)
);

CREATE TABLE IF NOT EXISTS shop_snapshots (
    shopid             BIGINT NOT NULL REFERENCES shops (shopid),
    run_id             TEXT NOT NULL REFERENCES runs (id),
    followers          INTEGER,
    rating             DOUBLE PRECISION,
    item_count         INTEGER,
    monthly_sold_seen  INTEGER,               -- sum of `sold` over items seen this run (a lower bound)
    all_time_sold_seen BIGINT,                -- sum of `historical_sold` over items seen this run
    items_seen         INTEGER,
    PRIMARY KEY (shopid, run_id)
);

CREATE TABLE IF NOT EXISTS items (
    itemid          BIGINT PRIMARY KEY,
    shopid          BIGINT NOT NULL REFERENCES shops (shopid),
    name            TEXT,
    price           BIGINT,                   -- rupiah, already divided by parse.price_divisor
    sold            INTEGER,
    historical_sold INTEGER,
    last_seen_run   TEXT REFERENCES runs (id)
);

CREATE TABLE IF NOT EXISTS leads (
    shopid           BIGINT PRIMARY KEY REFERENCES shops (shopid),
    icp_score        INTEGER,                 -- 0-100; re-scoring only touches icp_* and score_reasons
    icp_label        TEXT,
    score_reasons    TEXT,
    status           TEXT NOT NULL DEFAULT 'new',
    contact_channel  TEXT,
    contacted_at     TIMESTAMP,
    next_followup_at DATE,
    notes            TEXT,
    CHECK (icp_label IS NULL OR icp_label IN ('good', 'check', 'low', 'skip')),
    CHECK (status IN ('new', 'researching', 'contacted', 'replied', 'call_booked', 'won', 'lost', 'not_fit')),
    CHECK (contact_channel IS NULL OR contact_channel IN ('ig_dm', 'tiktok_dm', 'shopee_chat', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_items_shopid ON items (shopid);
CREATE INDEX IF NOT EXISTS idx_snapshots_run ON shop_snapshots (run_id);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads (next_followup_at);
