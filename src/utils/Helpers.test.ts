import { describe, expect, it } from 'vitest';
import { routing } from '@/libs/I18nRouting';
import {
  getBaseUrl,
  getI18nPath,
  isMockPaymentsAllowed,
  isSafeHttpUrl,
  isSafePaymentRedirectUrl,
} from './Helpers';

describe('Helpers', () => {
  describe('I18n path helper', () => {
    it('should not include locale for default locale', () => {
      expect(getI18nPath('/dashboard', routing.defaultLocale)).toBe('/dashboard');
    });

    it('should include locale for non-default locales', () => {
      expect(getI18nPath('/dashboard', 'en')).toBe('/en/dashboard');
    });
  });

  describe('URL safety', () => {
    it('accepts https media urls', () => {
      expect(isSafeHttpUrl('https://cdn.example.com/a.png')).toBe(true);
    });

    it('rejects javascript and data urls', () => {
      expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeHttpUrl('data:text/html;base64,aaa')).toBe(false);
      expect(isSafeHttpUrl('http://evil.com/x')).toBe(false);
    });

    it('allows relative payment return paths', () => {
      expect(isSafePaymentRedirectUrl('/payments/return?x=1')).toBe(true);
      expect(isSafePaymentRedirectUrl('//evil.com')).toBe(false);
    });

    it('allows only duitku payment hosts', () => {
      expect(isSafePaymentRedirectUrl('https://app.duitku.com/pay/abc')).toBe(true);
      expect(isSafePaymentRedirectUrl('https://evil.com/pay')).toBe(false);
      expect(isSafePaymentRedirectUrl('http://app.duitku.com/pay')).toBe(false);
    });
  });

  describe('mock payments gate', () => {
    it('exposes helper', () => {
      expect(typeof isMockPaymentsAllowed()).toBe('boolean');
      expect(typeof getBaseUrl()).toBe('string');
    });
  });
});
