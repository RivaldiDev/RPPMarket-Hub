import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-SHA256 hex digest (lowercase).
 * Duitku signatures use HMAC_SHA256(stringToSign, apiKey) → hex.
 */
export function hmacSha256Hex(data: string, apiKey: string): string {
  return createHmac('sha256', apiKey).update(data, 'utf8').digest('hex');
}

/**
 * Inquiry / create transaction signature.
 * Formula: HMAC_SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey)
 */
export function signInquiry(
  merchantCode: string,
  merchantOrderId: string,
  paymentAmount: number | string,
  apiKey: string,
): string {
  const stringToSign = `${merchantCode}${merchantOrderId}${paymentAmount}`;
  return hmacSha256Hex(stringToSign, apiKey);
}

/**
 * Get payment method signature.
 * Formula: HMAC_SHA256(merchantCode + amount + datetime, apiKey)
 */
export function signPaymentMethod(
  merchantCode: string,
  amount: number | string,
  datetime: string,
  apiKey: string,
): string {
  const stringToSign = `${merchantCode}${amount}${datetime}`;
  return hmacSha256Hex(stringToSign, apiKey);
}

/**
 * Callback verification signature.
 * Formula: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)
 */
export function signCallback(
  merchantCode: string,
  amount: number | string,
  merchantOrderId: string,
  apiKey: string,
): string {
  const stringToSign = `${merchantCode}${amount}${merchantOrderId}`;
  return hmacSha256Hex(stringToSign, apiKey);
}

/**
 * Transaction status check signature.
 * Formula: HMAC_SHA256(merchantCode + merchantOrderId, apiKey)
 */
export function signTransactionStatus(
  merchantCode: string,
  merchantOrderId: string,
  apiKey: string,
): string {
  const stringToSign = `${merchantCode}${merchantOrderId}`;
  return hmacSha256Hex(stringToSign, apiKey);
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
