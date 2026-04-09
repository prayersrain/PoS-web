declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface CoreApiConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionResponse {
    token: string;
    redirect_url: string;
    transaction_id?: string;
    order_id?: string;
    transaction_status?: string;
    payment_type?: string;
    fraud_status?: string;
    status_code?: string;
    gross_amount?: string;
  }

  interface RefundResponse {
    id?: string;
    status_code?: string;
    status_message?: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: any): Promise<TransactionResponse>;
    createTransactionToken(parameter: any): Promise<string>;
    createTransactionRedirectUrl(parameter: any): Promise<string>;
    transaction: {
      notification: (notification: any) => Promise<TransactionResponse>;
      refundDirect: (transactionId: string, params: any) => Promise<RefundResponse>;
      cancel: (transactionId: string) => Promise<any>;
    };
  }

  class CoreApi {
    constructor(config: CoreApiConfig);
    transaction: {
      notification: (notification: any) => Promise<TransactionResponse>;
      refundDirect: (transactionId: string, params: any) => Promise<RefundResponse>;
      cancel: (transactionId: string) => Promise<any>;
      status: (transactionId: string) => Promise<TransactionResponse>;
    };
  }

  export { Snap, CoreApi };
  export default { Snap, CoreApi };
}
