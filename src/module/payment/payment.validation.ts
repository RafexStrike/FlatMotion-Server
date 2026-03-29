// server/src/module/payment/payment.validation.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Validates the donation initiation request body.
 * Requires: amount (positive number), name (non-empty string), email (valid format).
 */
export const validateInitDonation = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const { amount, name, email } = req.body;

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, message: 'amount must be a positive number.' });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'name is required.' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }

  next();
};
