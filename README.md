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

Prices in the list are starting points; each product's `reference.note` says
whether it came from a store listing or is an estimate. Set your own prices
before selling.

## Putting it online

Upload the four files to any web host. On GitHub: repository **Settings →
Pages → Deploy from a branch**, pick the branch and the `/ (root)` folder.

The 3D library (three.js) is loaded from a public CDN, so customers need an
internet connection.
