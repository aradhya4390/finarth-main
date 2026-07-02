import fs from 'fs'
import pdf from 'pdf-parse'
import { parse as csvParse } from 'csv-parse/sync'
import XLSX from 'xlsx'
import mammoth from 'mammoth'

function tryParseNumber(v){
  if(v==null) return null
  if(typeof v === 'number') return v
  const s = String(v).replace(/[,$\s]/g,'')
  const m = s.match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

function tryParseDate(v){
  if(!v) return null
  const d = new Date(v)
  if(!isNaN(d)) return d
  // try common formats
  const m = v.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
  if(m){
    const d2 = new Date(m[1])
    if(!isNaN(d2)) return d2
  }
  return null
}

function summarizeRows(rows){
  const summary = { count: rows.length, totalAmount: 0, amountsFound: 0, dateRange: null, sample: rows.slice(0,5) }
  const amounts = []
  const dates = []
  rows.forEach(r=>{
    Object.values(r).forEach(v=>{
      const n = tryParseNumber(v)
      if(n!==null) amounts.push(n)
      const dt = tryParseDate(v)
      if(dt) dates.push(dt)
    })
  })
  if(amounts.length){
    summary.totalAmount = amounts.reduce((a,b)=>a+b,0)
    summary.amountsFound = amounts.length
  }
  if(dates.length){
    dates.sort((a,b)=>a-b)
    summary.dateRange = { from: dates[0], to: dates[dates.length-1] }
  }
  return summary
}

export async function parseFile(filePath, mimeType, originalName){
  const ext = (originalName && originalName.split('.').pop()) || ''
  const lower = ext.toLowerCase()
  if(mimeType === 'application/pdf' || lower === 'pdf'){
    const data = await fs.promises.readFile(filePath)
    const parsed = await pdf(data)
    const text = parsed.text || ''
    // Basic heuristic: split into lines, try CSV-like detection of columns
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
    // Try to generate rows by splitting on multiple spaces or tabs
    const rows = lines.map(line=>{
      const parts = line.split(/\s{2,}|\t|,/) // naive
      const obj = {}
      parts.forEach((p,i)=> obj[`c${i+1}`]=p)
      return obj
    }).filter(r=>Object.keys(r).length>0)
    const summary = summarizeRows(rows)
    return { type: 'pdf', rows, summary, rawText: text }
  }

  if(mimeType === 'text/csv' || lower === 'csv'){
    const content = await fs.promises.readFile(filePath,'utf8')
    const records = csvParse(content, { columns: true, skip_empty_lines: true })
    const summary = summarizeRows(records)
    return { type: 'csv', rows: records, summary, rawText: content }
  }

  // plain text files
  if(mimeType === 'text/plain' || lower === 'txt'){
    const content = await fs.promises.readFile(filePath,'utf8')
    // try CSV-like parsing first
    try{
      const records = csvParse(content, { columns: true, skip_empty_lines: true })
      const summary = summarizeRows(records)
      return { type: 'txt', rows: records, summary }
    }catch(e){
      // fallback: produce rows by lines
      const lines = content.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
      const rows = lines.map(line=>({ line }))
      const summary = summarizeRows(rows)
      return { type: 'txt', rows, summary, rawText: content }
    }
  }

  // docx using mammoth
  if(mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lower === 'docx'){
    try{
      const result = await mammoth.extractRawText({ path: filePath })
      const text = result.value || ''
      const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
      const rows = lines.map(line=>{
        const parts = line.split(/\s{2,}|\t|,|;/)
        const obj = {}
        parts.forEach((p,i)=> obj[`c${i+1}`]=p)
        return obj
      }).filter(r=>Object.keys(r).length>0)
      const summary = summarizeRows(rows)
      return { type: 'docx', rows, summary, rawText: text }
    }catch(e){
      // give up and proceed to fallback below
    }
  }

  // xlsx (or xls bodies)
  if(mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || lower === 'xlsx' || mimeType === 'application/vnd.ms-excel' || lower==='xls'){
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const records = XLSX.utils.sheet_to_json(sheet, { defval: null })
    const summary = summarizeRows(records)
    return { type: 'xlsx', rows: records, summary }
  }

  // fallback: try csv parse
  try{
    const content = await fs.promises.readFile(filePath,'utf8')
    const records = csvParse(content, { columns: true, skip_empty_lines: true })
    const summary = summarizeRows(records)
    return { type: 'text', rows: records, summary, rawText: content }
  }catch(e){
    throw new Error('Unsupported or unreadable file format')
  }
}
