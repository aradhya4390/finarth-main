import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { exportCsv } from '../controllers/exportController.js'
const router = express.Router()
router.get('/csv', authMiddleware, exportCsv)
export default router
