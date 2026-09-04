import { useCallback, useEffect, useState } from 'react'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

type AuditRecord = {
  paymentId: string
  orderId: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

type DashboardStats = {
  totalRevenue: number
  successfulPayments: number
  averageOrderValue: number
}

function Dashboard() {
  const [stats, setStats] =
    useState<DashboardStats>({
      totalRevenue: 0,
      successfulPayments: 0,
      averageOrderValue: 0,
    })

  const [auditTrail, setAuditTrail] =
    useState<AuditRecord[]>([])

  const [loading, setLoading] =
    useState(true)

  const fetchDashboard = useCallback(
    async () => {
      try {
        setLoading(true)

        const response = await fetch(
          `${API_BASE_URL}/api/analytics`
        )

        if (!response.ok) {
          throw new Error(
            'Failed to fetch analytics'
          )
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(
            data.error ||
              'Analytics request failed'
          )
        }

        const analytics =
          data.analytics

        setStats({
          totalRevenue:
            Number(
              analytics?.totalRevenue
            ) || 0,

          successfulPayments:
            Number(
              analytics?.successfulPayments
            ) || 0,

          averageOrderValue:
            Number(
              analytics?.averageOrderValue
            ) || 0,
        })

        setAuditTrail(
          Array.isArray(data.auditTrail)
            ? data.auditTrail
            : []
        )
      } catch (error) {
        console.error(
          'DASHBOARD ERROR:',
          error
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchDashboard()

    const handlePaymentSuccess =
      () => {
        console.log(
          'Payment successful — refreshing dashboard'
        )

        fetchDashboard()
      }

    window.addEventListener(
      'payment-success',
      handlePaymentSuccess
    )

    return () => {
      window.removeEventListener(
        'payment-success',
        handlePaymentSuccess
      )
    }
  }, [fetchDashboard])

  const formatPrice = (
    amount: number
  ) => {
    return `₹${(
      amount / 100
    ).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-container">

        {/* HEADER */}
        <div className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              MERCHANT CONTROL CENTER
            </span>

            <h2>
              Growth Dashboard
            </h2>

            <p>
              Monitor revenue, payments,
              recommendations and
              AI-driven growth activity.
            </p>
          </div>

          <div className="dashboard-status">
            <span className="status-dot" />
            Live
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="merchant-panel">

          {/* PANEL HEADER */}
          <div className="merchant-panel-header">
            <div>
              <h3>
                Merchant Dashboard
              </h3>

              <p>
                Track your RazorGrowth
                performance
              </p>
            </div>

            <div className="merchant-badge">
              RG
            </div>
          </div>

          {/* STATISTICS */}
          <div className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon">
                ₹
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  Total Revenue
                </span>

                <strong className="stat-value">
                  {loading
                    ? '—'
                    : formatPrice(
                        stats.totalRevenue
                      )}
                </strong>

                <span className="stat-description">
                  Successful payment
                  revenue
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ✓
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  Payments
                </span>

                <strong className="stat-value">
                  {loading
                    ? '—'
                    : stats.successfulPayments}
                </strong>

                <span className="stat-description">
                  Successful
                  transactions
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ↗
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  Average Order
                  Value
                </span>

                <strong className="stat-value">
                  {loading
                    ? '—'
                    : formatPrice(
                        stats.averageOrderValue
                      )}
                </strong>

                <span className="stat-description">
                  Average successful
                  payment
                </span>
              </div>
            </div>

          </div>

          {/* AUDIT TRAIL */}
          <div className="audit-section">

            <div className="audit-header">
              <div>
                <span className="dashboard-eyebrow">
                  TRANSACTION MONITOR
                </span>

                <h3>
                  Payment Audit Trail
                </h3>

                <p>
                  Every successful money
                  action is recorded and
                  traceable.
                </p>
              </div>

              <div className="audit-count">
                {auditTrail.length} records
              </div>
            </div>

            {auditTrail.length === 0 ? (
              <div className="audit-empty">
                <div className="audit-empty-icon">
                  ✓
                </div>

                <h4>
                  No payment activity yet
                </h4>

                <p>
                  Successful payments will
                  appear here automatically.
                </p>
              </div>
            ) : (
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditTrail.map(
                      (payment) => (
                        <tr
                          key={
                            payment.paymentId
                          }
                        >
                          <td>
                            <span className="payment-id">
                              {payment.paymentId}
                            </span>
                          </td>

                          <td>
                            <span className="order-id">
                              {payment.orderId}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {formatPrice(
                                payment.amount
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                payment.status ===
                                'success'
                                  ? 'audit-status success'
                                  : 'audit-status failed'
                              }
                            >
                              {payment.status ===
                              'success'
                                ? '✓ Verified'
                                : payment.status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              payment.createdAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="dashboard-footer-row">

            <div>
              <span className="mini-label">
                SYSTEM
              </span>

              <strong>
                RazorGrowth AI Agent
              </strong>
            </div>

            <div>
              <span className="mini-label">
                PAYMENTS
              </span>

              <strong>
                Razorpay Test Mode
              </strong>
            </div>

            <div>
              <span className="mini-label">
                STATUS
              </span>

              <strong className="online-text">
                ● Online
              </strong>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

export default Dashboard