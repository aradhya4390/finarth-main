import express from 'express'
import { signup, login, me, updateProfile } from '../controllers/authController.js'
import authMiddleware from '../middleware/authMiddleware.js'
const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', authMiddleware, me)
router.post('/update-profile', authMiddleware, updateProfile)

export default router
