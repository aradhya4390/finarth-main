import Entry from '../models/Entry.js'

export async function aggregateForUser(req, res) {
  try {
    const userId = req.userId
    const entries = await Entry.find({ user: userId }).lean()
    const totalEntries = entries.length
    let sumNumeric = 0
    const byDayMap = {}
    const byTagMap = {}

    for (const e of entries) {
      const num = Number(e.numericValue || 0)
      sumNumeric += num
      const day = new Date(e.createdAt).toISOString().slice(0,10)
      byDayMap[day] = (byDayMap[day] || 0) + num

      (e.tags || []).forEach(tag => {
        if(!tag) return
        const key = tag.toLowerCase()
        if(!byTagMap[key]) byTagMap[key] = { tag, count:0, sum:0 }
        byTagMap[key].count++
        byTagMap[key].sum += num
      })
    }

    const avgNumeric = totalEntries ? (sumNumeric / totalEntries) : 0
    const byDay = Object.keys(byDayMap).sort().map(d => ({ label: d, value: byDayMap[d] }))
    const byTag = Object.values(byTagMap).sort((a,b)=>b.count-a.count)

    res.json({ totalEntries, sumNumeric, avgNumeric, byDay, byTag })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Aggregation failed' })
  }
}
