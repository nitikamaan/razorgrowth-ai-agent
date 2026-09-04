import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import productRoutes from './routes/products.js'
import catalogRouter from './routes/catalog.js'
import agentRouter from './routes/agent.js'
import paymentRouter from './routes/payment.js'
import auditRouter from './routes/audit.js'
import analyticsRouter from './routes/analytics.js'

const app = express()

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  helmet()
)

app.use(
  cors()
)

app.use(
  express.json()
)

app.use(
  morgan('dev')
)

// ==========================================
// API ROUTES
// ==========================================

app.use(
  '/api/products',
  productRoutes
)

app.use(
  '/api/catalog',
  catalogRouter
)

app.use(
  '/api/agent',
  agentRouter
)

app.use(
  '/api/payment',
  paymentRouter
)

app.use(
  '/api/audit',
  auditRouter
)

app.use('/api/analytics', analyticsRouter)


// ==========================================
// ROOT
// ==========================================

app.get(
  '/',
  (_req, res) => {
    res.json({
      success: true,

      message:
        'Razorpay AI Growth Agent API is running',
    })
  }
)

// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
  '/health',
  (_req, res) => {
    res.json({
      success: true,

      status: 'healthy',

      timestamp:
        new Date().toISOString(),
    })
  }
)

// ==========================================
// SERVER
// ==========================================

const PORT =
  Number(process.env.PORT) ||
  5000

app.listen(
  PORT,
  () => {
    console.log(
      `Backend running on http://localhost:${PORT}`
    )
  }
)