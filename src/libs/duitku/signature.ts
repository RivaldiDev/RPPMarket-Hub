import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Duitku classic v2 API signatures (MD5-based, per gateway contract).
 * Formulas verified against the official duitkupg/duitku-php SDK (Duitku\Api):
 * - inquiry:            MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 * - transactionStatus:  MD5(merchantCode + merchantOrderId + apiKey)
 * - callback:           MD5(merchantCode + amount + merchantOrderId + apiKey)
 * MD5 here is the gateway's authentication scheme, not our choice of hash.
 */
function md5Hex(data: string): string {
  return createHash('md5').update(data, 'utf8').digest('hex');
}

/**
 * Inquiry / create transaction signature.
 * Formula: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
export function signInquiry(
  merchantCode: string,
  merchantOrderId: string,
  paymentAmount: number | string,
  apiKey: string,
): string {
  return md5Hex(`${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`);
}

/**
 * Callback verification signature.
 * Formula: MD5(merchantCode + amount + merchantOrderId + apiKey)
 */
export function signCallback(
  merchantCode: string,
  amount: number | string,
  merchantOrderId: string,
  apiKey: string,
): string {
  return md5Hex(`${merchantCode}${amount}${merchantOrderId}${apiKey}`);
}

/**
 * Transaction status check signature.
 * Formula: MD5(merchantCode + merchantOrderId + apiKey)
 */
export function signTransactionStatus(
  merchantCode: string,
  merchantOrderId: string,
  apiKey: string,
): string {
  return md5Hex(`${merchantCode}${merchantOrderId}${apiKey}`);
}

/**
 * Constant-time hex string comparison (prevents timing attacks).
 * Returns false if either value is not valid equal-length hex.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left.length !== right.length || left.length === 0) {
    return false;
  }
  if (!/^[0-9a-f]+$/.test(left) || !/^[0-9a-f]+$/.test(right)) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
  } catch {
    return false;
  }
}
