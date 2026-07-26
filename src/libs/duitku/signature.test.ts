import { describe, expect, it } from 'vitest';
import {
  safeEqualHex,
  signCallback,
  signInquiry,
  signTransactionStatus,
} from './signature';

/**
 * Formulas follow the official duitkupg/duitku-php SDK (Duitku\Api):
 * - inquiry:           MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 * - callback:          MD5(merchantCode + amount + merchantOrderId + apiKey)
 * - transactionStatus: MD5(merchantCode + merchantOrderId + apiKey)
 */
const MERCHANT = 'DXXXX';
const API_KEY = 'XXXXXXXXXX7968XXXXXXXXXFB05332AF';

describe('duitku signature', () => {
  describe('signInquiry', () => {
    it('signs MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)', () => {
      // md5("DXXXXabcde1234540000" + apiKey)
      expect(signInquiry(MERCHANT, 'abcde12345', 40_000, API_KEY)).toBe(
        '99be32a0207b86cb6f16a3dffc8cc2f2',
      );
    });

    it('accepts amount as string without changing digest', () => {
      expect(signInquiry(MERCHANT, 'abcde12345', '40000', API_KEY)).toBe(
        signInquiry(MERCHANT, 'abcde12345', 40_000, API_KEY),
      );
    });
  });

  describe('signCallback', () => {
    it('signs MD5(merchantCode + amount + merchantOrderId + apiKey)', () => {
      // md5("DXXXX150000abcde12345" + apiKey)
      expect(signCallback(MERCHANT, 150_000, 'abcde12345', API_KEY)).toBe(
        'b12f147640eda89b1c709f88cb2081eb',
      );
    });

    it('is order-sensitive: amount before merchantOrderId', () => {
      expect(signCallback(MERCHANT, 150_000, 'abcde12345', API_KEY)).not.toBe(
        signCallback(MERCHANT, 'abcde12345', 150_000 as unknown as string, API_KEY),
      );
    });
  });

  describe('signTransactionStatus', () => {
    it('signs MD5(merchantCode + merchantOrderId + apiKey)', () => {
      // md5("DXXXXabcde12345" + apiKey)
      expect(signTransactionStatus(MERCHANT, 'abcde12345', API_KEY)).toBe(
        'd6a98e9d5a19a08da34e7ef094ee1627',
      );
    });
  });

  describe('safeEqualHex', () => {
    it('returns true for equal hex (case-insensitive)', () => {
      const a = '99be32a0207b86cb6f16a3dffc8cc2f2';

      expect(safeEqualHex(a, a)).toBe(true);
      expect(safeEqualHex(a, a.toUpperCase())).toBe(true);
    });

    it('returns false for different or invalid values', () => {
      const a = '99be32a0207b86cb6f16a3dffc8cc2f2';
      const b = '09be32a0207b86cb6f16a3dffc8cc2f2';

      expect(safeEqualHex(a, b)).toBe(false);
      expect(safeEqualHex(a, 'short')).toBe(false);
      expect(safeEqualHex('', '')).toBe(false);
      expect(safeEqualHex('zzzz', 'zzzz')).toBe(false);
    });
  });
});
