import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import fileAnalysisRoute from './routes/fileAnalysis.js'
import analyticsRoute from './routes/analytics.js'
import authRoute from './routes/auth.js'
import dataRoute from './routes/data.js'
import exportRoute from './routes/export.js'
import powerbiRoute from './routes/powerbi.js'
import aiRoute from './routes/ai.js'
import aiExtendedRoute from './routes/aiExtended.js'
import aggregateRoute from './routes/aggregate.js'

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

// mount auth and app routes
app.use('/api/auth', authRoute)
app.use('/api/data', dataRoute)
app.use('/api/export', exportRoute)
app.use('/api/powerbi', powerbiRoute)
app.use('/api/ai', aiRoute)
app.use('/api/ai-extended', aiExtendedRoute)
app.use('/api/aggregate', aggregateRoute)

// serve uploads for inspection (optional)
app.use('/uploads', express.static('uploads'))

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})