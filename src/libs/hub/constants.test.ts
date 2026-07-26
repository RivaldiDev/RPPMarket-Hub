import { describe, expect, it } from 'vitest';
import {
  computeWithdrawFee,
  isValidStoreSlug,
} from './constants';

describe('hub constants', () => {
  describe('isValidStoreSlug', () => {
    it('accepts valid slugs', () => {
      expect(isValidStoreSlug('toko-satu')).toBe(true);
      expect(isValidStoreSlug('agent99')).toBe(true);
    });

    it('rejects reserved and invalid slugs', () => {
      expect(isValidStoreSlug('dashboard')).toBe(false);
      expect(isValidStoreSlug('sign-in')).toBe(false);
      expect(isValidStoreSlug('ab')).toBe(false);
      expect(isValidStoreSlug('Toko')).toBe(false);
      expect(isValidStoreSlug('-bad')).toBe(false);
    });
  });

  describe('computeWithdrawFee', () => {
    it('applies 5% flat fee', () => {
      expect(computeWithdrawFee(100_000)).toEqual({
        feeIdr: 5_000,
        netIdr: 95_000,
      });
    });

    it('floors fractional fee', () => {
      expect(computeWithdrawFee(1_001)).toEqual({
        feeIdr: 50,
        netIdr: 951,
      });
    });

    it('throws on invalid amount', () => {
      expect(() => computeWithdrawFee(0)).toThrow('invalid_amount');
      expect(() => computeWithdrawFee(10.5)).toThrow('invalid_amount');
    });
  });
});
