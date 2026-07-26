import json
from pathlib import Path

unused = {
  "SellerStorePage": ["placeholder_title", "placeholder_description"],
  "SellerProductsPage": ["placeholder_title", "placeholder_description"],
  "SellerOrdersPage": ["placeholder_title", "placeholder_description"],
  "SellerWalletPage": ["placeholder_title", "placeholder_description"],
  "Storefront": ["coming_title", "coming_description", "slug_label", "back_hub"],
}

for loc in ["en", "id"]:
    p = Path(rf"C:\Users\rival\Documents\Ngoding\RPPMarket-Hub\src\locales\{loc}.json")
    data = json.loads(p.read_text(encoding="utf-8"))
    for ns, keys in unused.items():
        if ns in data:
            for k in keys:
                data[ns].pop(k, None)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("cleaned", loc)
