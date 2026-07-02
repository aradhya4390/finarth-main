import express from 'express'
// NOTE: JWT auth is temporarily disabled on this route for local development/testing.
// Do NOT leave this disabled in production. Re-enable `authMiddleware` before deploying.
import { getDashboard } from '../controllers/analyticsController.js'

const router = express.Router()

// GET /api/analytics/dashboard
// Authentication temporarily disabled for development/testing
router.get('/dashboard', getDashboard)

export default router
