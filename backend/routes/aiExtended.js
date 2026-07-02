import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { detailedAnalyze } from '../controllers/aiAnalysisController.js'
const router = express.Router()
router.post('/detailed', authMiddleware, detailedAnalyze)
export default router
