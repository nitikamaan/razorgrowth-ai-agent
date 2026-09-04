import { Router } from 'express'

const router = Router()

type AuditEvent = {
  id: string
  timestamp: string
  type: string
  message: string
  status: 'success' | 'info' | 'failed'
}

const auditEvents: AuditEvent[] = []

export function addAuditEvent(
  type: string,
  message: string,
  status: AuditEvent['status'] = 'info'
) {
  auditEvents.unshift({
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    status,
  })

  // Keep only latest 50 events
  if (auditEvents.length > 50) {
    auditEvents.pop()
  }
}

router.get('/', (_req, res) => {
  res.json({
    success: true,
    events: auditEvents,
  })
})

export default router