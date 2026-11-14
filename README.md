# ka-shop

A first-person online store: customers walk around a 3D snack shop in their
browser, pick snacks off the shelves and send you their order.

It is one web page (`virtual-snack-shop.html`) plus one product list
(`products.json`). There is nothing to install or build.

## Files

| File | What it is |
| --- | --- |
| `virtual-snack-shop.html` | The shop: 3D room, product list, cart and checkout. |
| `products.json` | Everything the shop sells, plus the shop's name and order contact. **This is the file you edit.** |
| `sync-products.py` | Checks `products.json` for mistakes and refreshes the backup copy stored inside the page. |
| `index.html` | Sends visitors of the folder's web address on to the shop page. |
| `inventory.json` | Stock on hand per product id. `0` means out of stock. |
| `inventory.html` | Stock manager page: change quantities, record orders, download the updated `inventory.json`. |
| `qrcode.js` | The QR code library used for the PayNow code at checkout (MIT licence, by Kazuhiko Arase). |

## Try it on your computer

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>. (Double-clicking the page also works, but
then it shows the backup product list stored inside the page rather than
reading `products.json`.)

## What customers can do

- **Walk**: `W A S D` or the arrow keys on a computer (Shift to go faster), the
  round pad on a phone. Drag to look around. Click or tap the floor, or the
  mini map, to walk to that spot.
- **Pick**: click a snack to see its price and add it to the cart.
- **Inspect**: from a snack's card, open it on its own and drag to turn the pack around; scroll or pinch to zoom.
- **Pay**: at checkout, scan the PayNow QR for the exact total, tick “I’ve paid”, then send the order on WhatsApp — the shop matches the payment by the order reference. You can also download the QR code to pay later.
- **After-hours mood**: dark aisles with warm light over each shelf, so the snacks stand out.
- **Browse**: the list has every snack with search and categories. *Add* puts
  it in the cart; *Find* walks the customer to the right shelf.
- **Checkout**: shows the order and sends it to you as a ready-written
  WhatsApp message or email. No payment is taken on the page.
- A link ending in `?product=<id>` (for example `?product=pringles-sco`) opens
  the shop and walks straight to that snack.

If a device cannot show 3D, the shop still works as a plain list with cart and
checkout.

## Changing the shop

Edit `products.json`, then run:

```bash
python sync-products.py
```

- **Receiving orders**: in `"shop"`, put your WhatsApp number with country
  code (e.g. `"6591234567"`) in `"whatsapp"` and/or your address in `"email"`.
  While both are empty the shop is a demo: checkout only offers "Copy order".
- **Shop name**: `"shop"` → `"name"`. It appears in the top bar, on the sign
  on the back wall and in order messages.
- **Products**: each has an `id` (unique, never change it), `name`,
  `category`, `price_sgd`, `pack` and a `model` (size and colour of the pack).
  The pack shape (bag, box, bar, carton, can, tube, cup) is worked out from
  the `pack` text; add `"shape"` to `model` to choose it yourself.
- **Photos**: set `texture.image_url` to a pack photo. Without one, the shop
  draws the pack from the product's name and colour.
- **Shelves**: the order of `"categories"` is the order of the shelves. The
  room adds aisles by itself when there are more products.
- **Stock**: open `inventory.html` to change how many of each snack you
  have. Download the updated `inventory.json` from that page and upload it
  to the site (or send it to be pushed); the shop reads it when the page
  loads, and again when a customer presses Checkout.
  - A product at `0` shows as “Out of stock”: it cannot be added to the
    cart and its shelf space is empty apart from a grey tag.
  - Customers cannot put more of a snack in the cart than you have. When
    few are left the shop says “Only N left” and the shelf shows just those
    packs (the level is `low_stock_at` in `inventory.json`, set on the
    stock page).
  - **Stock does not go down by itself** — the shop has no server. When an
    order arrives, open `inventory.html` → *Record an order*, paste the
    order message, and upload the new file. Until then the shop still
    offers those packs, so two customers can order the last one.
  - A product with no entry in `inventory.json` is sold without a limit.
    `python sync-products.py` lists these and checks the file for mistakes.
- **PayNow**: `"shop"` → `"paynow"` is your PayNow mobile number (8 digits
  or with `+65`) or company UEN. Every order gets a reference (`VSS-…`)
  that is in both the QR code and the order message.

Prices in the list are starting points; each product's `reference.note` says
whether it came from a store listing or is an estimate. Set your own prices
before selling.

## Putting it online

Upload the files to any web host. On GitHub: repository **Settings →
Pages → Deploy from a branch**, pick the branch and the `/ (root)` folder.

The 3D library (three.js) is loaded from a public CDN, so customers need an
internet connection.
