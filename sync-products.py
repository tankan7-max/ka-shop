"""Check products.json and copy it into the shop page as its backup product list.

The shop normally reads products.json. The backup copy inside the page is only
used when that file cannot be read (for example, when the page is opened
straight from disk). Run this after editing products.json:

    python sync-products.py

It first checks products.json for common mistakes (a missing price, two
products with the same id, a category that is not in the "categories" list…)
and stops without changing anything if it finds a serious one.

It updates every virtual-snack-shop*.html page in this folder, so it keeps
working if the page is renamed to a new version.
"""
import json
import pathlib
import re
import sys

here = pathlib.Path(__file__).resolve().parent
try:
    db = json.loads((here / "products.json").read_text(encoding="utf-8"))
except json.JSONDecodeError as e:
    raise SystemExit(f"products.json is not valid JSON (line {e.lineno}, column {e.colno}): {e.msg}")

SHAPES = {"bag", "box", "bar", "carton", "can", "tube", "cup"}
errors, warnings, seen = [], [], set()
products = db.get("products")
if not isinstance(products, list) or not products:
    raise SystemExit('products.json has no "products" list.')
categories = db.get("categories", [])
for n, p in enumerate(products, 1):
    label = f'Product {n} ("{p.get("name") or p.get("id") or "no name"}")'
    if not p.get("name"):
        errors.append(f"{label}: has no name.")
    if not p.get("id"):
        errors.append(f"{label}: has no id.")
    elif p["id"] in seen:
        errors.append(f'{label}: the id "{p["id"]}" is used by another product too. Ids must be unique.')
    seen.add(p.get("id"))
    price = p.get("price_sgd")
    if isinstance(price, bool) or not isinstance(price, (int, float)) or price < 0:
        errors.append(f"{label}: price_sgd must be a number (like 1.5, without quotes).")
    if categories and p.get("category") not in categories:
        warnings.append(f'{label}: category "{p.get("category")}" is not in the "categories" list, so its shelf goes last.')
    model = p.get("model") or {}
    if model.get("type") not in ("box", "cylinder"):
        warnings.append(f"{label}: model.type should be 'box' or 'cylinder'; it will be shown as a box.")
    if "shape" in model and model["shape"] not in SHAPES:
        warnings.append(f"{label}: model.shape should be one of {', '.join(sorted(SHAPES))}.")
    for side in ("width", "height", "depth"):
        v = model.get(side)
        if isinstance(v, bool) or not isinstance(v, (int, float)) or v <= 0:
            warnings.append(f"{label}: model.{side} should be a number above 0; a default size is used.")

for w in warnings:
    print("Note:", w)
if errors:
    for e in errors:
        print("Problem:", e)
    raise SystemExit("Nothing was changed. Fix the problems above in products.json and run this again.")

data = json.dumps(
    {"currency": db.get("currency", "SGD"), "shop": db.get("shop", {}),
     "categories": categories, "products": products},
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
        page.write_text(new, encoding="utf-8", newline="")
    updated += 1
    print(f"Copied {len(products)} products into {page.name}.")
if not updated:
    sys.exit("No shop page found to update (expected virtual-snack-shop*.html next to this script).")
