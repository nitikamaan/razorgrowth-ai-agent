import { Router } from 'express'
import { query } from '../prisma/db.js'

const router = Router()

// GET /api/analytics
router.get('/', async (_req, res) => {
  try {
    // Summary statistics
    const summaryResult = await query<{
      total_revenue: string
      successful_payments: string
      average_order_value: string
    }>(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*) AS successful_payments,
        COALESCE(AVG(amount), 0) AS average_order_value
      FROM payments
      WHERE status = 'success'
    `)

    // Recent payment audit trail
    const auditResult = await query<{
      payment_id: string
      order_id: string
      amount: string
      currency: string
      status: string
      created_at: string
    }>(`
      SELECT
        payment_id,
        order_id,
        amount,
        currency,
        status,
        created_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT 20
    `)

    const analytics = summaryResult[0]

    res.json({
      success: true,

      analytics: {
        totalRevenue: Number(
          analytics?.total_revenue || 0
        ),

        successfulPayments: Number(
          analytics?.successful_payments || 0
        ),

        averageOrderValue: Number(
          analytics?.average_order_value || 0
        ),
      },

      auditTrail: auditResult.map((payment) => ({
        paymentId: payment.payment_id,
        orderId: payment.order_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.created_at,
      })),
    })
  } catch (error) {
    console.error('ANALYTICS ERROR:', error)

    res.status(500).json({
      success: false,
      error: 'Failed to load analytics',
    })
  }
})

export default router