import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query } from '../prisma/db.js';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required',
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('CREATE ORDER ERROR:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create Razorpay order',
    });
  }
});

// Verify Razorpay payment
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Check required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment verification details',
      });
    }

    // Create signature payload
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET!
      )
      .update(body)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature',
      });
    }

    // ------------------------------------------------
    // PAYMENT IS NOW VERIFIED
    // ------------------------------------------------

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(
      razorpay_order_id
    );

    // Create payments table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Save successful payment
    await query(
      `
      INSERT INTO payments (
        payment_id,
        order_id,
        amount,
        currency,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (payment_id)
      DO NOTHING
      `,
      [
        razorpay_payment_id,
        razorpay_order_id,
        order.amount,
        order.currency,
        'success',
      ]
    );

    console.log(
      'PAYMENT SAVED:',
      razorpay_payment_id
    );

    res.json({
      success: true,
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: order.amount,
      currency: order.currency,
      status: 'success',
    });
  } catch (error) {
    console.error('VERIFY PAYMENT ERROR:', error);

    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
    });
  }
});

export default router;