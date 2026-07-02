import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { runAnalysis, getLatest } from '../controllers/aiController.js'
const router = express.Router()
router.post('/analyze', authMiddleware, runAnalysis)
router.get('/get-latest', authMiddleware, getLatest)
export default router
