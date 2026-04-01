// server/src/module/payment/payment.service.ts

import { prisma } from '../../lib/prisma';
import config from '../../config/env';
import { InitDonationRequest, DonationRecord } from './payment.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SSLCommerzPayment = require('sslcommerz-lts');

/**
 * Generate a unique transaction ID with a timestamp prefix.
 */
const generateTranId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DON-${timestamp}-${random}`;
};

/**
 * Initiate a donation session with SSLCommerz sandbox.
 * Creates a pending donation record in DB, then returns the gateway redirect URL.
 */
export const initDonation = async (data: InitDonationRequest): Promise<{ gatewayUrl: string; tranId: string }> => {
  const tranId = generateTranId();
  console.log(`[PaymentService] Initiating donation: tranId=${tranId}, amount=${data.amount}, email=${data.email}`);

  // Determine callback base URL (the server itself handles callbacks)
  // Use the production URL from BETTER_AUTH_URL if available, otherwise fallback to localhost
  const authUrls = process.env.BETTER_AUTH_URL?.split(',').map(u => u.trim()) || [];
  const productionUrl = authUrls.find(u => !u.includes('localhost'));
  const serverBase = productionUrl || `http://localhost:${config.port}`;
  console.log(`[PaymentService] Using serverBase for callbacks: ${serverBase}`);

  // Determine the client origin for redirects after callback
  // Match the serverBase: if production URL, use production client origin; else use localhost
  const clientOrigins = process.env.TRUSTED_CLIENT_ORIGIN?.split(',').map(u => u.trim()) || [];
  let clientOrigin: string;
  if (productionUrl) {
    // In production, find a non-localhost client origin
    clientOrigin = clientOrigins.find(u => !u.includes('localhost')) || 'https://flat-motion.vercel.app';
  } else {
    // In local development, use localhost client origin
    clientOrigin = clientOrigins.find(u => u.includes('localhost')) || 'http://localhost:3000';
  }
  console.log(`[PaymentService] Using clientOrigin for redirect: ${clientOrigin}`);

  // Save pending donation record in DB
  const donation = await prisma.donation.create({
    data: {
      userId: data.userId || null,
      name: data.name,
      email: data.email,
      amount: data.amount,
      currency: data.currency || 'BDT',
      tranId,
      status: 'pending',
    },
  });
  console.log(`[PaymentService] Donation record created: id=${donation.id}, tranId=${tranId}`);

  // Prepare SSLCommerz payment data
  const paymentData = {
    total_amount: data.amount,
    currency: data.currency || 'BDT',
    tran_id: tranId,
    success_url: `${serverBase}/api/payment/success`,
    fail_url: `${serverBase}/api/payment/fail`,
    cancel_url: `${serverBase}/api/payment/cancel`,
    ipn_url: `${serverBase}/api/payment/ipn`,
    shipping_method: 'NO',
    product_name: 'FlatMotion Donation',
    product_category: 'Donation',
    product_profile: 'non-physical-goods',
    cus_name: data.name,
    cus_email: data.email,
    cus_add1: 'N/A',
    cus_city: 'N/A',
    cus_postcode: '0000',
    cus_country: 'Bangladesh',
    cus_phone: '01700000000',
    ship_name: 'N/A',
    ship_add1: 'N/A',
    ship_city: 'N/A',
    ship_postcode: 0,
    ship_country: 'Bangladesh',
    value_a: clientOrigin, // Pass client origin for redirect in callbacks
  };

  // Call SSLCommerz API
  if (!config.sslcStoreId || !config.sslcStorePass) {
    console.error('[PaymentService] SSLCommerz credentials missing:', {
      storeId: config.sslcStoreId ? 'SET' : 'MISSING',
      storePass: config.sslcStorePass ? 'SET' : 'MISSING',
      isLive: config.sslcIsLive,
      nodeEnv: process.env.NODE_ENV,
    });
    throw new Error('SSLCommerz credentials not configured. Please set SSLC_STORE_ID and SSLC_STORE_PASS environment variables.');
  }

  const sslcz = new SSLCommerzPayment(config.sslcStoreId, config.sslcStorePass, config.sslcIsLive);
  const apiResponse = await sslcz.init(paymentData);

  if (!apiResponse?.GatewayPageURL) {
    console.error('[PaymentService] SSLCommerz init failed:', apiResponse);
    throw new Error('Failed to initialize payment gateway. Please try again.');
  }

  console.log(`[PaymentService] Gateway URL received for tranId=${tranId}`);
  return { gatewayUrl: apiResponse.GatewayPageURL, tranId };
};

/**
 * Handle SSLCommerz success callback.
 * Validates the transaction and updates the donation status to "success".
 */
export const handleSuccess = async (body: any): Promise<DonationRecord> => {
  const { tran_id, val_id } = body;
  console.log(`[PaymentService] Success callback received: tran_id=${tran_id}, val_id=${val_id}`);

  const donation = await prisma.donation.update({
    where: { tranId: tran_id },
    data: {
      status: 'success',
      valId: val_id || null,
      updatedAt: new Date(),
    },
  });

  console.log(`[PaymentService] Donation ${donation.id} marked as success`);
  return donation as DonationRecord;
};

/**
 * Handle SSLCommerz fail callback.
 */
export const handleFail = async (body: any): Promise<DonationRecord> => {
  const { tran_id } = body;
  console.log(`[PaymentService] Fail callback received: tran_id=${tran_id}`);

  const donation = await prisma.donation.update({
    where: { tranId: tran_id },
    data: {
      status: 'failed',
      updatedAt: new Date(),
    },
  });

  console.log(`[PaymentService] Donation ${donation.id} marked as failed`);
  return donation as DonationRecord;
};

/**
 * Handle SSLCommerz cancel callback.
 */
export const handleCancel = async (body: any): Promise<DonationRecord> => {
  const { tran_id } = body;
  console.log(`[PaymentService] Cancel callback received: tran_id=${tran_id}`);

  const donation = await prisma.donation.update({
    where: { tranId: tran_id },
    data: {
      status: 'cancelled',
      updatedAt: new Date(),
    },
  });

  console.log(`[PaymentService] Donation ${donation.id} marked as cancelled`);
  return donation as DonationRecord;
};

/**
 * List all donation records (admin use).
 */
export const getDonations = async (): Promise<DonationRecord[]> => {
  console.log('[PaymentService] Listing all donations');
  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return donations as DonationRecord[];
};
