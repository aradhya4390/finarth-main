import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import fileAnalysisRoute from './routes/fileAnalysis.js'
import analyticsRoute from './routes/analytics.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err))

app.get('/', (req, res) => {
  res.send('🚀 Personal Finance Tracker API is running')
})

// mount file analysis route
app.use('/api/analysis', fileAnalysisRoute)
// analytics dashboard route
app.use('/api/analytics', analyticsRoute)

// serve uploads for inspection (optional)
app.use('/uploads', express.static('uploads'))

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})