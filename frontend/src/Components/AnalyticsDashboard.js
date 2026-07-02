import React, { useEffect, useState } from 'react'
import * as api from '../utils/api'

function KpiCard({title, value}){
  return (
    <div style={{ flex: 1, padding: 12, background: 'var(--card-bg)', borderRadius: 8, boxShadow: 'var(--card-shadow)' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  )
}

function BarChart({labels = [], data = []}){
  const max = Math.max(...data, 1)
  return (
    <svg width="100%" height={160} viewBox="0 0 600 160" preserveAspectRatio="none">
      {data.map((v,i)=>{
        const w = 600 / labels.length * 0.6
        const gap = (600 / labels.length) * 0.4
        const h = (v / max) * 120
        const x = i * (w + gap) + gap/2
        const y = 140 - h
        return <g key={i}><rect x={x} y={y} width={w} height={h} fill="#4F46E5" rx={4} /></g>
      })}
    </svg>
  )
}

function LineChart({labels=[], data=[]}){
  const max = Math.max(...data,1)
  const points = data.map((v,i)=>{ const x = i*(600/labels.length)+20; const y = 140 - (v/max)*120; return `${x},${y}` }).join(' ')
  return (
    <svg width="100%" height={160} viewBox="0 0 600 160" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#0891B2" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function PieChart({items = []}){
  const total = items.reduce((s,i)=>s+(i.value||0),0) || 1
  let angle = -Math.PI/2
  const cx = 80, cy = 80, r = 60
  return (
    <svg width={200} height={160} viewBox="0 0 200 160">
      {items.map((it,idx)=>{
        const portion = (it.value||0)/total
        const a2 = angle + portion * Math.PI*2
        const x1 = cx + Math.cos(angle)*r
        const y1 = cy + Math.sin(angle)*r
        const x2 = cx + Math.cos(a2)*r
        const y2 = cy + Math.sin(a2)*r
        const large = portion > 0.5 ? 1 : 0
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
        angle = a2
        const colors = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#7c3aed','#ef3b9b']
        return <path key={idx} d={d} fill={colors[idx % colors.length]} />
      })}
    </svg>
  )
}

export default function AnalyticsDashboard(){
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    // Check for a locally prepared dashboard config (from recently uploaded file)
    const tmp = localStorage.getItem('tempDashboardConfig')
    if(tmp){
      try{
        const parsed = JSON.parse(tmp)
        setDashboard(parsed)
        // remove temp key so subsequent visits fetch server data
        localStorage.removeItem('tempDashboardConfig')
        if(mounted) setLoading(false)
        return
      }catch(e){ /* fallthrough to fetch */ }
    }

    api.fetchDashboardConfig().then(res=>{
      if(!mounted) return
      if(res && res.dashboard) setDashboard(res.dashboard)
      else setDashboard(null)
    }).catch(err=>{
      setError(err.message || 'Failed to load dashboard')
    }).finally(()=>{ if(mounted) setLoading(false) })
    return ()=>{ mounted = false }
  },[])

  if(loading) return <div style={{padding:20}}>Loading dashboard...</div>
  if(error) return <div style={{padding:20, color:'var(--danger-color)'}}>Error: {error}</div>
  if(!dashboard || !dashboard.summaryCards || dashboard.summaryCards.length===0) return <div style={{padding:20}}>No analyzed data available to generate dashboard.</div>

  const { summaryCards, charts } = dashboard

  return (
    <div style={{ padding: 20 }}>
      <h2>Analytics Dashboard</h2>
      <div style={{ display:'flex', gap:12, marginTop:12 }}>
        {summaryCards.map((c,idx)=> <KpiCard key={idx} title={c.title} value={typeof c.value==='number'?Number(c.value).toLocaleString():c.value} />)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <div style={{ padding: 12, background: 'var(--card-bg)', borderRadius:8 }}>
          <h4>Monthly Totals (Bar)</h4>
          <BarChart labels={charts.bar.labels} data={charts.bar.data} />
        </div>

        <div style={{ padding: 12, background: 'var(--card-bg)', borderRadius:8 }}>
          <h4>Monthly Trend (Line)</h4>
          <LineChart labels={charts.line.labels} data={charts.line.data} />
        </div>

        <div style={{ padding: 12, background: 'var(--card-bg)', borderRadius:8, gridColumn: '1 / span 2' }}>
          <h4>Category Breakdown (Pie)</h4>
          <div style={{ display:'flex', alignItems:'center', gap: 24 }}>
            <PieChart items={charts.pie} />
            <div>
              {charts.pie.map((p, i)=> (
                <div key={i} style={{ marginBottom: 6 }}><strong>{p.label}</strong>: {Number(p.value).toLocaleString()}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
