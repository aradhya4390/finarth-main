import Entry from '../models/Entry.js'

function escapeCsv(value = '') {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function exportCsv(req, res) {
  try {
    const entries = await Entry.find({ user: req.userId }).sort({ createdAt: -1 }).lean()
    const headers = ['id','title','content','numericValue','tags','createdAt']
    const csvRows = [headers.join(',')]
    for (const e of entries) {
      const row = [
        escapeCsv(e._id),
        escapeCsv(e.title),
        escapeCsv(e.content),
        escapeCsv(e.numericValue),
        escapeCsv((e.tags || []).join(';')),
        escapeCsv(e.createdAt)
      ]
      csvRows.push(row.join(','))
    }
    const csv = csvRows.join('\n')
    res.setHeader('Content-Type','text/csv')
    res.setHeader('Content-Disposition','attachment; filename=entries.csv')
    return res.send(csv)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not export CSV' })
  }
}
