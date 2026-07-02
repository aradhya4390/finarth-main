import Entry from '../models/Entry.js'
import Analysis from '../models/Analysis.js'

function simpleAnalyze(entries){
  const byDay = {}
  let total = 0
  for(const e of entries){
    const day = new Date(e.createdAt).toISOString().slice(0,10)
    byDay[day] = (byDay[day] || 0) + (e.numericValue || 1)
    total += (e.numericValue || 1)
  }
  const dataset = Object.keys(byDay).sort().map(d=>({ label:d, value: byDay[d] }))
  const summary = `You have ${entries.length} entries with total value ${total}.`
  return { dataset, summary }
}

export async function runAnalysis(req,res){
  const entries = await Entry.find({ user: req.userId })
  const { dataset, summary } = simpleAnalyze(entries)
  const a = await Analysis.create({ user: req.userId, dataset, summary })
  res.json({ analysis: a })
}

export async function getLatest(req,res){
  const a = await Analysis.findOne({ user: req.userId }).sort({ createdAt: -1 })
  if(!a) return res.json({ dataset: [], summary: null })
  res.json({ dataset: a.dataset, summary: a.summary })
}
