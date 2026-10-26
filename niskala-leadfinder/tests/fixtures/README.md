Hand-written fixtures that mimic the shapes of JSON the Shopee web app loads.

- `search_items.json`: search results (`items[].item_basic`), including one item in the newer
  `item_card_display_*` shape and one Shopee Mall item. TODO verify against a real capture.
- `shop_<shopid>.json`: shop profile (`data.{shopid, account.username, follower_count, ...}`).
- `shop_items_111222333.json`: a shop page product list.
- `shop_ratings.json`: buyer reviews (must NOT be parsed as items; buyer data must be scrubbed).
- `blocked.json`: anti-bot answer (TODO verify error code on a real block).
- `account_info.json`: the logged-in user's own account (must never be stored).

All names, handles, numbers and domains are invented.
