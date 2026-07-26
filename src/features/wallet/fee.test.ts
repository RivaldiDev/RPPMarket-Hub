import { describe, expect, it } from 'vitest';
import {
  computeWithdrawFee,
  DEFAULT_MIN_WITHDRAW_IDR,
  DEFAULT_WITHDRAW_FEE_BPS,
} from './fee';

describe('wallet fee', () => {
  it('re-exports default fee constants', () => {
    expect(DEFAULT_WITHDRAW_FEE_BPS).toBe(500);
    expect(DEFAULT_MIN_WITHDRAW_IDR).toBe(50_000);
  });

  it('applies 5% platform withdraw fee', () => {
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
    expect(() => computeWithdrawFee(-1)).toThrow('invalid_amount');
    expect(() => computeWithdrawFee(10.5)).toThrow('invalid_amount');
  });

  it('accepts custom fee bps', () => {
    expect(computeWithdrawFee(100_000, 250)).toEqual({
      feeIdr: 2_500,
      netIdr: 97_500,
    });
  });
});
