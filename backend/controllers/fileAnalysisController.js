import Analysis from '../models/Analysis.js'
import { parseFile } from '../utils/parseFile.js'
import fs from 'fs'

export async function analyzeFile(req, res){
  try{
    if(!req.file) return res.status(400).json({ message: 'No file uploaded' })

    // Development mode: allow unauthenticated uploads for local testing.
    // In production, ensure authMiddleware sets `req.userId` and re-enable auth on the route.
    const { path: filePath, mimetype, originalname } = req.file

    // parse file
    let result
    try{
      result = await parseFile(filePath, mimetype, originalname)
    }catch(parseErr){
      console.error('Parse error:', parseErr)
      try{ await fs.promises.unlink(filePath) }catch(e){}
      return res.status(422).json({ success: false, errorCode: 'INVALID_FILE', message: 'File could not be parsed or is unreadable' })
    }

    // Determine if file is readable/valid. Accept small data as valid if readable text exists.
    const hasRows = result && Array.isArray(result.rows) && result.rows.length>0
    const hasText = result && result.rawText && String(result.rawText).trim().length>0
    const hasSummaryCounts = result && result.summary && (result.summary.count > 0 || result.summary.amountsFound > 0)

    const readable = !!(hasRows || hasText || hasSummaryCounts)

    if(!readable){
      try{ await fs.promises.unlink(filePath) }catch(e){}
      return res.status(422).json({ success: false, errorCode: 'INVALID_FILE', message: 'File is not valid' })
    }

    // If no rows but we have text, create basic rows from text lines
    let rows = Array.isArray(result.rows) ? result.rows : []
    if((!rows || rows.length===0) && result.rawText){
      const lines = String(result.rawText).split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
      rows = lines.map(l=>({ line: l }))
    }

    const analysis = await Analysis.create({
      // store user if available, otherwise null for dev/testing
      user: req.userId || null,
      filename: originalname,
      filetype: mimetype,
      summary: result.summary || { count: rows.length },
      extractedData: rows,
      dataset: []
    })

    // remove uploaded file to keep storage clean
    try{ await fs.promises.unlink(filePath) }catch(e){}

    // Respond success with analysis data so frontend can proceed
    return res.status(200).json({ success: true, analysisData: { summary: analysis.summary, extractedData: analysis.extractedData }, analysisId: analysis._id })
  }catch(err){
    console.error('Analysis error:', err)
    // if multer stored file, try remove
    if(req.file && req.file.path){ try{ await fs.promises.unlink(req.file.path) }catch(e){} }
    res.status(500).json({ message: 'Failed to analyze file', error: err.message })
  }
}

 
function tryParseNumber(v){
  if(v==null) return null
  if(typeof v === 'number') return v
  const s = String(v).replace(/[,$\s]/g,'')
  const m = s.match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

export async function getAnalytics(req, res){
  try{
    // Development: allow analytics without authentication by returning global analytics
    // In production, require req.userId (via authMiddleware) and limit to user's analyses.
    const userId = req.userId || null
    const analyses = userId ? await Analysis.find({ user: userId }).lean() : await Analysis.find({}).lean()

    const totalFiles = analyses.length
    let totalAmount = 0
    const monthlyMap = {}
    const categoryMap = {}

    const now = new Date()
    // prepare last 12 months keys
    for(let i=11;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      monthlyMap[key] = 0
    }

    analyses.forEach(a=>{
      const amt = (a.summary && a.summary.totalAmount) ? Number(a.summary.totalAmount) : 0
      totalAmount += amt
      const d = a.createdAt ? new Date(a.createdAt) : new Date()
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      if(typeof monthlyMap[key] === 'undefined') monthlyMap[key] = 0
      monthlyMap[key] += amt

      // categories from extractedData
      if(Array.isArray(a.extractedData)){
        a.extractedData.forEach(row=>{
          // find numeric value and category-like field
          let value = null
          let category = 'Other'
          if(row && typeof row === 'object'){
            const vals = Object.entries(row)
            for(const [k,v] of vals){
              const n = tryParseNumber(v)
              if(n!==null && value===null) value = n
            }
            // prefer explicit fields
            if(row.category) category = String(row.category)
            else if(row.type) category = String(row.type)
            else if(row.description) category = String(row.description).slice(0,30)
            else if(vals[0] && vals[0][1]) category = String(vals[0][1]).slice(0,30)
          }
          if(value!==null){
            categoryMap[category] = (categoryMap[category] || 0) + Number(value)
          }
        })
      }
    })

    const averagePerFile = totalFiles ? totalAmount / totalFiles : 0

    const monthlyTrend = Object.keys(monthlyMap).sort().map(k=>({ month: k, total: monthlyMap[k] }))
    const pieChart = Object.entries(categoryMap).map(([k,v])=>({ category: k, total: v }))

    res.json({
      totalFiles,
      totalAmount,
      averagePerFile,
      monthlyTrend,
      pieChart
    })
  }catch(err){
    console.error('Analytics error:', err)
    res.status(500).json({ message: 'Failed to compute analytics', error: err.message })
  }
}

export default { analyzeFile, getAnalytics }
