// Shared request/DTO shapes for the payment module.

export type RequestingUser = { id: string; role: "ADMIN" | "STAFF" | "CLIENT" };
export type BkashCreateResponse = {
  paymentID?: string;
  bkashURL?: string;
  statusCode?: string;
  statusMessage?: string;
};
export type BkashExecuteResponse = {
  transactionStatus?: string;
  trxID?: string;
  statusMessage?: string;
};
export type SslcommerzInitResponse = {
  status?: string;
  GatewayPageURL?: string;
  failedreason?: string;
};
export type SslcommerzValidateResponse = { status?: string };
