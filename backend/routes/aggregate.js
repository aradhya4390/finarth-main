import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { aggregateForUser } from '../controllers/aggregateController.js'

const router = express.Router()
router.get('/', authMiddleware, aggregateForUser)
export default router
