import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import {
  createEntry,
  listEntries,
  getEntry,
  updateEntry,
  deleteEntry
} from '../controllers/dataController.js'

const router = express.Router()

router.post('/', authMiddleware, createEntry)
router.get('/', authMiddleware, listEntries)
router.get('/:id', authMiddleware, getEntry)
router.put('/:id', authMiddleware, updateEntry)
router.delete('/:id', authMiddleware, deleteEntry)

export default router
