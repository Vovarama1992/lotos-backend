export class BankInvoice {
  amount: number;
  timestamp: Date;
  currency: string;

  payment_details: {
    card?: string;
    sbp?: string;
  };

  constructor(invoice: Partial<BankInvoice>) {
    Object.assign(this, invoice);
  }
}
