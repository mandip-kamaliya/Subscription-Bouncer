export interface BouncerConfig {
  target: string;
  price: number;
  port: number;
}

export interface PaymentVerification {
  valid: boolean;
  transactionHash?: string;
  error?: string;
}

export interface PaymentRequiredResponse {
  error: string;
  message: string;
  payment_address: string;
  amount: number;
  currency: string;
  network: string;
  instructions: string;
}
