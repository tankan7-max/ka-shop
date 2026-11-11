"""Copy products.json into the shop page as its backup product list.

The shop normally reads products.json. The backup copy inside the page is only
used when that file cannot be read (for example, when the page is opened
straight from disk). Run this after editing products.json:

    python sync-products.py

It updates every virtual-snack-shop*.html page in this folder (not the legacy
folder), so it keeps working if the page is renamed to a new version.
"""
import json
import pathlib
import re

here = pathlib.Path(__file__).resolve().parent
db = json.loads((here / "products.json").read_text(encoding="utf-8"))

data = json.dumps(
    {"currency": db.get("currency", "SGD"), "categories": db.get("categories", []), "products": db["products"]},
    ensure_ascii=False, separators=(",", ":"),
).replace("</", "<\\/")  # never close the <script> tag early

pages = sorted(here.glob("virtual-snack-shop*.html"))
updated = 0
for page in pages:
    html = page.read_text(encoding="utf-8")
    new, n = re.subn(r"/\*PRODUCTS-START\*/.*?/\*PRODUCTS-END\*/",
                     lambda m: "/*PRODUCTS-START*/" + data + "/*PRODUCTS-END*/", html, flags=re.S)
    if n != 1:
        print(f"Skipped {page.name}: no PRODUCTS-START / PRODUCTS-END markers.")
        continue
    if new != html:
        page.write_text(new, encoding="utf-8")
    updated += 1
    print(f"Copied {len(db['products'])} products into {page.name}.")
if not updated:
    raise SystemExit("No shop page found to update (expected virtual-snack-shop*.html next to this script).")
