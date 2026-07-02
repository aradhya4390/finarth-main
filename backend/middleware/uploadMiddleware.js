import multer from 'multer'
import path from 'path'
import fs from 'fs'

const UPLOAD_DIR = path.resolve('./backend/uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${unique}${ext}`)
  }
})

function fileFilter(req, file, cb) {
  const allowed = [
    'application/pdf',
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  // Accept DOCX as well
  const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (file.mimetype === docxMime) cb(null, true)
  else if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Unsupported file type. Only PDF, CSV, TXT, DOCX and XLSX are allowed.'), false)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
})

export default upload
