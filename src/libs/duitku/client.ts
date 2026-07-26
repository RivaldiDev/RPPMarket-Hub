import type {
  DuitkuInquiryRequest,
  DuitkuInquiryResponse,
  DuitkuTransactionStatusResponse,
} from './types';
import { Buffer } from 'node:buffer';
import { Env } from '@/libs/Env';
import {
  signInquiry,
  signTransactionStatus,
} from './signature';

function assertIntegerIdr(amount: number, label = 'amount'): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Duitku requires positive integer IDR for ${label}`);
  }
}

function requireConfig(): { merchantCode: string; apiKey: string; baseUrl: string } {
  if (!isDuitkuConfigured()) {
    throw new Error(
      'Duitku is not configured. Set DUITKU_MERCHANT_CODE and DUITKU_API_KEY.',
    );
  }
  return {
    merchantCode: Env.DUITKU_MERCHANT_CODE,
    apiKey: Env.DUITKU_API_KEY,
    baseUrl: Env.DUITKU_BASE_URL.replace(/\/$/, ''),
  };
}

/** True when merchant code and API key are both non-empty. */
export function isDuitkuConfigured(): boolean {
  return Boolean(Env.DUITKU_MERCHANT_CODE?.trim() && Env.DUITKU_API_KEY?.trim());
}

/**
 * Create a payment inquiry (v2).
 * POST /webapi/api/merchant/v2/inquiry
 */
export async function createInquiry(
  params: DuitkuInquiryRequest,
): Promise<DuitkuInquiryResponse> {
  assertIntegerIdr(params.paymentAmount, 'paymentAmount');
  if (!params.merchantOrderId?.trim()) {
    throw new Error('merchantOrderId is required');
  }
  if (!params.paymentMethod?.trim()) {
    throw new Error('paymentMethod is required');
  }

  const { merchantCode, apiKey, baseUrl } = requireConfig();
  const signature = signInquiry(
    merchantCode,
    params.merchantOrderId,
    params.paymentAmount,
    apiKey,
  );

  const body = {
    merchantCode,
    paymentAmount: params.paymentAmount,
    paymentMethod: params.paymentMethod,
    merchantOrderId: params.merchantOrderId,
    productDetails: params.productDetails,
    additionalParam: params.additionalParam ?? '',
    merchantUserInfo: params.merchantUserInfo ?? '',
    customerVaName: params.customerVaName ?? params.email,
    email: params.email,
    phoneNumber: params.phoneNumber ?? '',
    itemDetails: params.itemDetails,
    customerDetail: params.customerDetail,
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    signature,
    expiryPeriod: params.expiryPeriod,
  };

  return postJson<DuitkuInquiryResponse>(
    `${baseUrl}/webapi/api/merchant/v2/inquiry`,
    body,
  );
}

/**
 * Check transaction status by merchant order id.
 * POST /webapi/api/merchant/transactionStatus
 */
export async function getTransactionStatus(
  merchantOrderId: string,
): Promise<DuitkuTransactionStatusResponse> {
  if (!merchantOrderId?.trim()) {
    throw new Error('merchantOrderId is required');
  }

  const { merchantCode, apiKey, baseUrl } = requireConfig();
  const signature = signTransactionStatus(merchantCode, merchantOrderId, apiKey);

  const body = {
    merchantCode,
    merchantOrderId,
    signature,
  };

  return postJson<DuitkuTransactionStatusResponse>(
    `${baseUrl}/webapi/api/merchant/transactionStatus`,
    body,
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const payload = JSON.stringify(body);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(payload)),
    },
    body: payload,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Duitku returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg
      = typeof data === 'object' && data !== null && 'Message' in data
        ? String((data as { Message: unknown }).Message)
        : text.slice(0, 200);
    throw new Error(`Duitku HTTP ${res.status}: ${msg}`);
  }

  return data as T;
}
