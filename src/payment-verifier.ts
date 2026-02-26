import { PinionClient } from 'pinion-os';
import { PaymentVerification } from './types';

export class PaymentVerifier {
  private pinionClient: PinionClient;

  constructor() {
    if (!process.env.PINION_PRIVATE_KEY) {
      throw new Error('PINION_PRIVATE_KEY environment variable is required');
    }
    
    this.pinionClient = new PinionClient({
      privateKey: process.env.PINION_PRIVATE_KEY,
      network: 'base' // Base L2 network
    });
  }

  async verifyPayment(paymentHeader: string, requiredAmount: number): Promise<PaymentVerification> {
    try {
      // Extract payment data from x402 header
      const paymentData = this.parsePaymentHeader(paymentHeader);
      
      if (!paymentData.signature || !paymentData.transactionHash) {
        return {
          valid: false,
          error: 'Invalid payment header format'
        };
      }

      // Verify the payment using PinionOS
      const verification = await this.pinionClient.verifyPayment({
        transactionHash: paymentData.transactionHash,
        signature: paymentData.signature,
        amount: requiredAmount,
        currency: 'USDC'
      });

      return {
        valid: verification.isValid,
        transactionHash: paymentData.transactionHash,
        error: verification.isValid ? undefined : 'Payment verification failed'
      };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Payment verification error'
      };
    }
  }

  private parsePaymentHeader(header: string): { signature: string; transactionHash: string } {
    try {
      // Expected format: "x402 signature=<sig>&tx=<tx_hash>"
      const params = new URLSearchParams(header.replace('x402 ', ''));
      return {
        signature: params.get('signature') || '',
        transactionHash: params.get('tx') || ''
      };
    } catch {
      return { signature: '', transactionHash: '' };
    }
  }

  generatePaymentResponse(amount: number) {
    return {
      error: 'Payment Required',
      message: 'This API requires a micropayment to access',
      payment_address: this.pinionClient.getPaymentAddress(),
      amount,
      currency: 'USDC',
      network: 'Base',
      instructions: `Send ${amount} USDC on Base network to ${this.pinionClient.getPaymentAddress()} and include the transaction hash in the 'x402' header as: 'x402 tx=<transaction_hash>&signature=<signature>'`
    };
  }
}
