import Analysis from '../models/Analysis.js'

function tryParseNumber(v){
  if(v==null) return null
  if(typeof v === 'number') return v
  const s = String(v).replace(/[,$\s]/g,'')
  const m = s.match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

export async function getDashboard(req, res){
  try{
    if(!req.userId) return res.status(401).json({ message: 'Not authenticated' })
    const userId = req.userId

    const analyses = await Analysis.find({ user: userId }).lean()

    const totalFiles = analyses.length
    let grandTotal = 0
    const monthly = {}
    const categoryMap = {}

    const now = new Date()
    for(let i=11;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      monthly[key] = 0
    }

    analyses.forEach(a=>{
      const amt = (a.summary && a.summary.totalAmount) ? Number(a.summary.totalAmount) : 0
      grandTotal += amt
      const d = a.createdAt ? new Date(a.createdAt) : new Date()
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      if(typeof monthly[key] === 'undefined') monthly[key] = 0
      monthly[key] += amt

      if(Array.isArray(a.extractedData)){
        a.extractedData.forEach(row=>{
          let value = null
          let category = 'Other'
          if(row && typeof row === 'object'){
            const vals = Object.entries(row)
            for(const [k,v] of vals){
              const n = tryParseNumber(v)
              if(n!==null && value===null) value = n
            }
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

    const averagePerFile = totalFiles ? grandTotal / totalFiles : 0

    const monthlyTrend = Object.keys(monthly).sort().map(k=>({ month: k, total: monthly[k] }))
    const bar = { labels: monthlyTrend.map(x=>x.month), data: monthlyTrend.map(x=>x.total) }
    const line = { labels: monthlyTrend.map(x=>x.month), data: monthlyTrend.map(x=>x.total) }
    const pie = Object.entries(categoryMap).map(([k,v])=>({ label: k, value: v }))

    const summaryCards = [
      { title: 'Total Files', value: totalFiles },
      { title: 'Grand Total', value: grandTotal },
      { title: 'Average per File', value: averagePerFile }
    ]

    const dashboardConfig = {
      summaryCards,
      charts: { bar, line, pie }
    }

    res.json({ dashboard: dashboardConfig })
  }catch(err){
    console.error('Dashboard error:', err)
    res.status(500).json({ message: 'Failed to build dashboard', error: err.message })
  }
}

export default { getDashboard }
