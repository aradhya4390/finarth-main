import Entry from '../models/Entry.js'
import Analysis from '../models/Analysis.js'

function topTags(entries, n=5){
  const map = {}
  for(const e of entries){
    (e.tags||[]).forEach(t=>{
      if(!t) return
      const key = t.toLowerCase()
      if(!map[key]) map[key] = { tag: t, count: 0, sum:0 }
      map[key].count++
      map[key].sum += Number(e.numericValue || 0)
    })
  }
  return Object.values(map).sort((a,b)=>b.count-a.count).slice(0,n)
}

function dailySeries(entries){
  const map = {}
  for(const e of entries){
    const day = new Date(e.createdAt).toISOString().slice(0,10)
    map[day] = (map[day]||0) + (Number(e.numericValue||0))
  }
  return Object.keys(map).sort().map(k=>({ label:k, value: map[k] }))
}

export async function detailedAnalyze(req,res){
  try{
    const entries = await Entry.find({ user: req.userId }).lean()
    const totalEntries = entries.length
    const sum = entries.reduce((s,e)=> s + Number(e.numericValue||0),0)
    const avg = totalEntries ? (sum/totalEntries) : 0
    const tags = topTags(entries, 10)
    const series = dailySeries(entries)

    const summaryParts = []
    summaryParts.push(`You have ${totalEntries} entries with total value ${sum} and average ${avg.toFixed(2)}.`)
    if(tags.length) summaryParts.push(`Top tags: ` + tags.map(t=>`${t.tag} (${t.count})`).join(', '))
    if(series.length) summaryParts.push(`Data spans ${series[0].label} to ${series[series.length-1].label}.`)

    const summary = summaryParts.join(' ')

    const analysis = await Analysis.create({
      user: req.userId,
      summary,
      dataset: series
    })

    res.json({ summary, dataset: series, topTags: tags, analysisId: analysis._id })
  }catch(err){
    console.error(err)
    res.status(500).json({ message: 'AI analysis failed' })
  }
}
