import json
from pathlib import Path

admin = {
  "en": {
    "title_bar": "Admin withdrawals",
    "title_bar_description": "Pending seller withdraw requests (manual review)",
    "pending_title": "Pending requests",
    "empty": "No pending withdrawals.",
    "net": "Net",
    "fee": "Fee",
    "store_id": "Store",
    "manual_note": "Approval and disbursement are manual in MVP. Auto-disburse is deferred."
  },
  "id": {
    "title_bar": "Admin withdraw",
    "title_bar_description": "Permintaan withdraw seller (review manual)",
    "pending_title": "Permintaan pending",
    "empty": "Tidak ada withdraw pending.",
    "net": "Net",
    "fee": "Fee",
    "store_id": "Toko",
    "manual_note": "Approval dan disbursement masih manual di MVP. Auto-disburse ditunda."
  }
}

for loc, block in admin.items():
    p = Path(rf"C:\Users\rival\Documents\Ngoding\RPPMarket-Hub\src\locales\{loc}.json")
    data = json.loads(p.read_text(encoding="utf-8"))
    data["AdminWithdrawalsPage"] = block
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("admin keys", loc)
