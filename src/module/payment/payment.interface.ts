// server/src/module/payment/payment.interface.ts

export interface InitDonationRequest {
  amount: number;
  currency?: string;
  name: string;
  email: string;
  userId?: string;
}

export interface DonationRecord {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  amount: number;
  currency: string;
  tranId: string;
  status: string;
  valId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
