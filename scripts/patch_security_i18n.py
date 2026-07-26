import json
from pathlib import Path

updates = {
  "en": {
    "AdminWithdrawalsPage": {
      "title_bar": "Admin withdrawals",
      "title_bar_description": "Pending seller withdraw requests (manual review)",
      "pending_title": "Pending requests",
      "empty": "No pending withdrawals.",
      "net": "Net",
      "fee": "Fee",
      "store_id": "Store",
      "manual_note": "Mark paid only after you completed the bank transfer. Auto-disburse is deferred.",
      "mark_paid": "Mark paid",
      "marked_paid": "Withdraw marked as paid."
    },
    "PaymentsReturn": {
      "title": "Payment status",
      "description": "We confirm payment from our database, not only from the redirect.",
      "missing_order": "Missing merchant order id.",
      "order_not_found": "Order not found.",
      "order_id": "Order",
      "amount": "Amount",
      "status": "Status",
      "buyer": "Buyer",
      "mock_confirm": "Mock confirm payment",
      "mock_hint": "Only available when Duitku keys are not configured and mock mode is allowed.",
      "back_hub": "Back to hub"
    }
  },
  "id": {
    "AdminWithdrawalsPage": {
      "title_bar": "Admin withdraw",
      "title_bar_description": "Permintaan withdraw seller (review manual)",
      "pending_title": "Permintaan pending",
      "empty": "Tidak ada withdraw pending.",
      "net": "Net",
      "fee": "Fee",
      "store_id": "Toko",
      "manual_note": "Tandai paid hanya setelah transfer bank selesai. Auto-disburse ditunda.",
      "mark_paid": "Tandai paid",
      "marked_paid": "Withdraw ditandai paid."
    },
    "PaymentsReturn": {
      "title": "Status pembayaran",
      "description": "Kami konfirmasi pembayaran dari database, bukan hanya dari redirect.",
      "missing_order": "Merchant order id hilang.",
      "order_not_found": "Order tidak ditemukan.",
      "order_id": "Order",
      "amount": "Nominal",
      "status": "Status",
      "buyer": "Pembeli",
      "mock_confirm": "Mock konfirmasi bayar",
      "mock_hint": "Hanya tersedia jika key Duitku belum dikonfigurasi dan mode mock diizinkan.",
      "back_hub": "Kembali ke hub"
    }
  }
}

for loc, blocks in updates.items():
    p = Path(rf"C:\Users\rival\Documents\Ngoding\RPPMarket-Hub\src\locales\{loc}.json")
    data = json.loads(p.read_text(encoding="utf-8"))
    data.update(blocks)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("updated", loc)
