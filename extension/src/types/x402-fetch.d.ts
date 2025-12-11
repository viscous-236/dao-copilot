declare module 'x402-fetch' {
  export type Signer = any;
  export type MultiNetworkSigner = any;
  export type X402Config = any;
  export type PaymentRequirementsSelector = any;

  export function wrapFetchWithPayment(
    fetchFn: typeof fetch,
    wallet: any,
    maxValue?: bigint,
    paymentRequirementsSelector?: PaymentRequirementsSelector,
    config?: X402Config
  ): typeof fetch;

  export function createSigner(wallet: any): Signer;

  export function decodeXPaymentResponse(header: string): any;
}
