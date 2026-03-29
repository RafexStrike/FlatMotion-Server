// server/src/module/payment/payment.controller.ts

import { Request, Response } from 'express';
import {
  initDonation,
  handleSuccess,
  handleFail,
  handleCancel,
  getDonations,
} from './payment.service';

/**
 * POST /api/payment — Initiate a donation session.
 * Returns the SSLCommerz gateway URL for redirect.
 */
export const initDonationHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { amount, currency, name, email, userId } = req.body;
    console.log(`[PaymentController] initDonation request: amount=${amount}, name=${name}, email=${email}`);

    const result = await initDonation({ amount, currency, name, email, userId });

    return res.status(200).json({
      success: true,
      message: 'Payment session created. Redirect to gateway.',
      data: { gatewayUrl: result.gatewayUrl, tranId: result.tranId },
    });
  } catch (err: any) {
    console.error('[PaymentController] initDonation error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to initiate donation.',
      data: null,
    });
  }
};

/**
 * POST /api/payment/success — SSLCommerz success callback.
 * Updates donation status and redirects user to the client success page.
 */
export const successHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('[PaymentController] Success callback body:', req.body);
    const donation = await handleSuccess(req.body);

    // Redirect to client success page
    const clientOrigin = req.body.value_a || 'http://localhost:3000';
    return res.redirect(`${clientOrigin}/payment/success?tranId=${donation.tranId}&amount=${donation.amount}`);
  } catch (err: any) {
    console.error('[PaymentController] success error:', err.message);
    const clientOrigin = req.body?.value_a || 'http://localhost:3000';
    return res.redirect(`${clientOrigin}/payment/fail?error=processing_error`);
  }
};

/**
 * POST /api/payment/fail — SSLCommerz fail callback.
 * Updates donation status and redirects user to the client fail page.
 */
export const failHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('[PaymentController] Fail callback body:', req.body);
    await handleFail(req.body);

    const clientOrigin = req.body.value_a || 'http://localhost:3000';
    return res.redirect(`${clientOrigin}/payment/fail`);
  } catch (err: any) {
    console.error('[PaymentController] fail error:', err.message);
    const clientOrigin = req.body?.value_a || 'http://localhost:3000';
    return res.redirect(`${clientOrigin}/payment/fail`);
  }
};

/**
 * POST /api/payment/cancel — SSLCommerz cancel callback.
 * Updates donation status and redirects user to the client cancel page.
 */
export const cancelHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('[PaymentController] Cancel callback body:', req.body);
    await handleCancel(req.body);

    const clientOrigin = req.body.value_a || 'http://localhost:3000';
    return res.redirect(`${clientOrigin}/payment/cancel`);
  } catch (err: any) {
    console.error('[PaymentController] cancel error:', err.message);
    const clientOrigin = req.body?.value_a || 'http://localhost:3000';
    return res.redirect(`${clientOrigin}/payment/cancel`);
  }
};

/**
 * GET /api/payment/donations — List all donation records (admin endpoint).
 */
export const getDonationsHandler = async (_req: Request, res: Response): Promise<any> => {
  try {
    const donations = await getDonations();
    return res.status(200).json({
      success: true,
      message: `Found ${donations.length} donation(s).`,
      data: donations,
    });
  } catch (err: any) {
    console.error('[PaymentController] getDonations error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to list donations.',
      data: null,
    });
  }
};
