import { describe, expect, it } from 'vitest';
import {
  hmacSha256Hex,
  safeEqualHex,
  signCallback,
  signInquiry,
  signPaymentMethod,
  signTransactionStatus,
} from './signature';

/** Known test vectors (Duitku sample-style merchant + key). */
const MERCHANT = 'DXXXX';
const API_KEY = 'XXXXXXXXXX7968XXXXXXXXXFB05332AF';

describe('duitku signature', () => {
  describe('hmacSha256Hex', () => {
    it('produces lowercase hex digest', () => {
      const dig = hmacSha256Hex('hello', 'secret');

      expect(dig).toMatch(/^[0-9a-f]{64}$/);
      expect(dig).toBe(
        // node: createHmac('sha256','secret').update('hello').digest('hex')
        '88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b',
      );
    });
  });

  describe('signInquiry', () => {
    it('signs merchantCode + merchantOrderId + paymentAmount', () => {
      // HMAC_SHA256("DXXXXabcde1234540000", apiKey)
      expect(signInquiry(MERCHANT, 'abcde12345', 40_000, API_KEY)).toBe(
        '914c41353a8b9217bac54924dd3baa48e47429fbd80f9a5e5a2be48eb5d7c3ae',
      );
    });

    it('accepts amount as string without changing digest', () => {
      expect(signInquiry(MERCHANT, 'abcde12345', '40000', API_KEY)).toBe(
        signInquiry(MERCHANT, 'abcde12345', 40_000, API_KEY),
      );
    });
  });

  describe('signPaymentMethod', () => {
    it('signs merchantCode + amount + datetime', () => {
      // HMAC_SHA256("DXXXX100002022-01-25 16:23:08", apiKey)
      expect(
        signPaymentMethod(MERCHANT, 10_000, '2022-01-25 16:23:08', API_KEY),
      ).toBe(
        '466a70dec2142c4ab0b17e9209be83d0e3413b138b12d733467de4aed0a1bd50',
      );
    });
  });

  describe('signCallback', () => {
    it('signs merchantCode + amount + merchantOrderId', () => {
      // HMAC_SHA256("DXXXX150000abcde12345", apiKey)
      expect(signCallback(MERCHANT, 150_000, 'abcde12345', API_KEY)).toBe(
        'fba055fb1e96fc1d0e07d5221bc73558ead54449f73e2119258f4c3ef9f7db2d',
      );
    });
  });

  describe('signTransactionStatus', () => {
    it('signs merchantCode + merchantOrderId', () => {
      // HMAC_SHA256("DXXXXabcde12345", apiKey)
      expect(signTransactionStatus(MERCHANT, 'abcde12345', API_KEY)).toBe(
        '9c4c04fbffb6034c404dd3002980860430d864690f5214a11bd1cd4fe42ed94e',
      );
    });
  });

  describe('safeEqualHex', () => {
    it('returns true for equal hex (case-insensitive)', () => {
      const a = '914c41353a8b9217bac54924dd3baa48e47429fbd80f9a5e5a2be48eb5d7c3ae';

      expect(safeEqualHex(a, a)).toBe(true);
      expect(safeEqualHex(a, a.toUpperCase())).toBe(true);
    });

    it('returns false for different or invalid values', () => {
      const a = '914c41353a8b9217bac54924dd3baa48e47429fbd80f9a5e5a2be48eb5d7c3ae';
      const b = '014c41353a8b9217bac54924dd3baa48e47429fbd80f9a5e5a2be48eb5d7c3ae';

      expect(safeEqualHex(a, b)).toBe(false);
      expect(safeEqualHex(a, 'short')).toBe(false);
      expect(safeEqualHex('', '')).toBe(false);
      expect(safeEqualHex('zzzz', 'zzzz')).toBe(false);
    });
  });
});
