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
| `products.html` | Product manager page (needs the Supabase database): add, edit, hide or delete products, upload pack photos and 3D models. |
| `vendor/` | A copy of the 3D library (three.js 0.160, MIT licence, see `vendor/LICENSE-three.txt`) and its 3D-model loader, so the shop loads nothing from public CDNs and works offline. The page falls back to unpkg / jsDelivr only if this folder is missing. |
| `tools/check-shop.mjs` | A walkability and speed check for the 3D shop (see *Checking the shop* below). |
| `qrcode.js` | The QR code library used for the PayNow code at checkout (MIT licence, by Kazuhiko Arase). |
| `ka.html` | Tan Kwan Ann's professional page: dark, with a spinning 3D ring, an interactive 3D protein structure and a print-to-PDF résumé (two pages from the browser's print dialog). |
| `ka2.html` | The joke edition, 鲍鱼王 the Abalone King of the Multiverse: an abalone clicker game, royal decrees, a translated résumé and a universe roller. Links back to `ka.html`. |
| `images/`, `Tan_Kwan_Ann_Resume.pdf` | Photos and the résumé download used by `ka.html` and `ka2.html`. `ka-og.jpg` and `ka2-og.jpg` are the pictures shown when each page's link is shared. |
| `data/ka-8z5g.bin` | The backbone of PDB 8Z5G (11,024 amino acids, 52 chains) drawn in 3D by `ka.html`. Data from the Protein Data Bank (free to reuse, CC0). Rebuild it with `tools/make-structure.py`. |
| `fonts/` | The page's fonts, hosted here so it loads nothing from other websites (open licence, see `fonts/LICENSES.txt`). |

## Checking the shop

After changing the layout (moving a table, shelf or the counter), run the built-in check. It opens the shop in a
headless browser with no internet, then tests that every snack, every bundle tray and the starting spot can be walked
to without a big detour, that the floor is one connected space, and that the opening view stays inside a drawing budget
(draw calls) so phones stay smooth. It exits with an error and says what is wrong if something fails.

```bash
npm install playwright          # once
npx playwright install chromium # once
node tools/check-shop.mjs       # add --verbose for every route
```

The shop page also takes `?debug` in its address, which exposes its internals on `window.__dbg` (that is what the check uses).

## Speed

The shop is built to stay smooth on phones: all price tags are drawn from one shared picture and in one go, plain shelf
and wall boxes are merged, each pack is drawn in as few steps as its materials allow (a typical opening view is about
220 draw calls, down from about 550), the page lowers its drawing resolution by itself if frames run slow and raises it
again when there is room, and the 3D library is hosted in `vendor/`.

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
- **Remembered details and cues**: the name and delivery address are remembered on the shopper's own device (untick the box at checkout to forget them), and adding to the cart gives a soft sound and a short buzz on phones (switch it off in Help).
- **Badges**: set *Badge* (New or Popular) on a product in `products.html` (or `"badge": "new"` / `"popular"` inside the product's `"model"` in `products.json`) and a small tag shows next to its name in the list and on its card.
- **Bundles**: ready-made boxes on a table in the middle of the front of the shop (one row of trays facing the entrance). If the table is full, the rest go on two-tray, eye-level shelves on the left wall by the entrance. Add, edit, reorder or hide them on `products.html` (Bundles section; pick snacks, set a price, and it shows the saving). One-time set-up: run `supabase-bundles.sql` in the Supabase SQL Editor. Until that table exists the shop uses the `bundles` list in `products.json`. A bundle may use the same snack more than once (e.g. 2 × Mamee noodles); it then needs that many in stock per box. The shelf boards are slanted to face a shopper, so the top tray is easy to see. Inspect a bundle and its snacks ride glowing rings spinning round a bright core; tap a snack's name to spotlight it. A bundle takes one of each of its snacks from the stock, shared with the same snacks bought on their own.
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
  The pack shape (bag, box, bar, roll, hex, carton, can, tube, cup, bottle) is worked out from
  the `pack` text; add `"shape"` to `model` to choose it yourself.
- **Photos**: set `texture.image_url` to a pack photo. Without one, the shop
  draws the pack from the product's name and colour.
- **Shelves**: like a supermarket, every product has one space on a shelf
  with its packs queued up behind the front one, and each category has its
  own stretch of shelf with a sign. The shop is sized to what you sell: it
  starts small and grows longer shelves, then extra aisles, as you add
  products. Categories are placed in the order of `"categories"` where
  they fit.
- **Other shoppers**: with the Supabase database connected, customers see
  each other as little figures walking around, and as dots on the map. Only
  a position, an optional nickname and a colour are shared — never the cart.
  Each customer can switch it off from the people button in the top bar; set
  `"multiplayer": false` under `"shop"` to turn it off for everyone.
- **Pack size and texture tools (products.html)**: sizes have sliders; round packs (can, bottle, tube, cup) are set by *diameter* and *height*, a roll by *length* and *diameter*. For round packs choose how the label wraps (the same art on front and back, one continuous label once all the way round, or front only) and turn it around the pack with a slider. *Edit picture / design a label* opens a built-in editor: rotate, flip, a drag-to-crop tool (free or locked to a shape, with undo) and zoom to the pack's printable area, brightness / contrast / colour, make a white background see-through, and add up to four lines of text. Saved as `texture.wrap` (`once` / `front`) and `texture.rotate` (degrees) in the product.
- **Products page (Supabase)**: open `products.html` and sign in with the
  owner login.
  - The first time, press **Copy the products from products.json**. From
    then on the shop reads its products from the database and
    `products.json` is only the fallback (use **Download backup** now and
    then, upload the file and run `python sync-products.py`).
  - **Add a product**: name, price, pack, shelf, starting stock, pack shape
    (bag, box, bar, sweet roll, hexagonal tub, drink packet, can, bottle, tube, cup), size and colour.
  - **Photo of the pack front**: uploaded to the database's file storage and
    shown on the 3D pack. Tick "the photo is the flat artwork" to wrap it
    across the whole front.
  - **3D model**: upload a `.glb` file (up to 8 MB, no Draco compression) to
    replace the built-in shape for that product. It is sized to the width,
    height and depth you enter; it should stand upright (+Y) and face
    forward (+Z). Keep it low-poly — every pack on the shelf is a copy.
  - Untick **On sale** to hide a product without losing it.
- **Live stock (Supabase)**: with `"supabase_url"` and `"supabase_key"`
  set under `"shop"` in `products.json`, stock lives in the shop's Supabase
  database instead of a file.
  - Open `inventory.html` and sign in. **Save to the shop** changes the
    stock for customers within 20 seconds — list, cart and shelves update
    without a reload.
  - When a customer presses Checkout their snacks are set aside while they
    pay (30 minutes), so two customers cannot both get the last pack. If
    they never send the order, the snacks go back on sale by themselves.
  - A sent order appears under *Orders waiting for you* and stays set
    aside until you press **Paid — take off stock** or **Release**.
  - The key in `products.json` is the public "publishable" key and is safe
    to show. Never put a "secret" or "service_role" key in this repository.
  - `inventory.json` is the fallback when the database cannot be reached:
    use **Download backup** on the stock page now and then and upload it.
  - Remove the two settings and the shop goes back to the file-only way
    described next.
- **Stock by file**: open `inventory.html` to change how many of each snack you
  have. Download the updated `inventory.json` from that page and upload it
  to the site (or send it to be pushed); the shop reads it when the page
  loads, and again when a customer presses Checkout.
  - A product at `0` shows as “Out of stock”: it cannot be added to the
    cart and its shelf space is empty apart from a grey tag.
  - Customers cannot put more of a snack in the cart than you have. When
    few are left the shop says “Only N left” and the shelf shows just those
    packs (the level is `low_stock_at` in `inventory.json`, set on the
    stock page).
  - In file mode **stock does not go down by itself**. When an
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
