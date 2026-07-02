import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { powerbiDataset } from '../controllers/powerbiController.js'
const router = express.Router()
router.get('/dataset', authMiddleware, powerbiDataset)
export default router
