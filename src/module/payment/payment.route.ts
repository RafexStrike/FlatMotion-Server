// server/src/module/payment/payment.route.ts

import { Router } from 'express';
import {
  initDonationHandler,
  successHandler,
  failHandler,
  cancelHandler,
  getDonationsHandler,
} from './payment.controller';
import { validateInitDonation } from './payment.validation';

const paymentRouter = Router();

// POST /api/payment — Initiate a donation payment session
paymentRouter.post('/', validateInitDonation, initDonationHandler);

// POST /api/payment/success — SSLCommerz success callback
paymentRouter.post('/success', successHandler);

// POST /api/payment/fail — SSLCommerz fail callback
paymentRouter.post('/fail', failHandler);

// POST /api/payment/cancel — SSLCommerz cancel callback
paymentRouter.post('/cancel', cancelHandler);

// GET /api/payment/donations — List all donations (admin)
paymentRouter.get('/donations', getDonationsHandler);

export default paymentRouter;
