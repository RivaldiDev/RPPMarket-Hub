/** Duitku item line for inquiry. */
type DuitkuItemDetail = {
  name: string;
  price: number;
  quantity: number;
};

/** Optional address block inside customerDetail. */
type DuitkuAddress = {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  countryCode?: string;
};

type DuitkuCustomerDetail = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  billingAddress?: DuitkuAddress;
  shippingAddress?: DuitkuAddress;
};

/** Params for createInquiry (merchantCode/signature filled by client). */
export type DuitkuInquiryRequest = {
  paymentAmount: number;
  paymentMethod: string;
  merchantOrderId: string;
  productDetails: string;
  email: string;
  callbackUrl: string;
  returnUrl: string;
  customerVaName?: string;
  phoneNumber?: string;
  additionalParam?: string;
  merchantUserInfo?: string;
  expiryPeriod?: number;
  itemDetails?: DuitkuItemDetail[];
  customerDetail?: DuitkuCustomerDetail;
};

/** Successful inquiry response (subset of Duitku fields). */
export type DuitkuInquiryResponse = {
  merchantCode?: string;
  reference: string;
  paymentUrl?: string;
  vaNumber?: string;
  amount?: number | string;
  statusCode: string;
  statusMessage: string;
};

/** transactionStatus response. */
export type DuitkuTransactionStatusResponse = {
  merchantOrderId?: string;
  reference?: string;
  amount?: string | number;
  fee?: string | number;
  statusCode: string;
  statusMessage: string;
};
