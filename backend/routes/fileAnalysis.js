import express from 'express'
// NOTE: JWT auth is temporarily disabled on these routes for local development/testing.
// Do NOT leave this disabled in production. Re-enable `authMiddleware` before deploying.
import upload from '../middleware/uploadMiddleware.js'
import { analyzeFile } from '../controllers/fileAnalysisController.js'
import { getAnalytics } from '../controllers/fileAnalysisController.js'

const router = express.Router()

// POST /api/analysis - form-data with field `file`
// Authentication temporarily disabled for development/testing
router.post('/', upload.single('file'), analyzeFile)

// GET /api/analysis/analytics - aggregated analytics for dashboard
// Authentication temporarily disabled for development/testing
router.get('/analytics', getAnalytics)

export default router
