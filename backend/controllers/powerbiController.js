import Analysis from '../models/Analysis.js'

export async function powerbiDataset(req,res){
  try{
    const analysis = await Analysis.findOne({ user: req.userId }).sort({ createdAt: -1 })
    const dataset = analysis ? analysis.dataset : []
    const summary = analysis ? analysis.summary : ''
    const embedUrl = process.env.POWERBI_EMBED_URL || null
    const embedToken = process.env.POWERBI_EMBED_TOKEN || null
    res.json({ dataset, summary, embedUrl, embedToken })
  }catch(err){
    console.error(err)
    res.status(500).json({ message: 'Could not prepare PowerBI dataset' })
  }
}
