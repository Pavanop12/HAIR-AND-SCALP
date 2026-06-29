import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import RecoveryGraph from '../components/RecoveryGraph'
import ComparisonView from '../components/ComparisonView'
import { attachScanImageUrls } from '../lib/scanImages'

export default function Progress() {
  const { user } = useAuth()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('graph') // 'graph' | 'compare'

  useEffect(() => { fetchScans() }, [user])

  const fetchScans = async () => {
    if (!user) return
    const { data } = await supabase.from('scans')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    const enriched = await attachScanImageUrls(data || [], user.id)
    setScans(enriched || [])
    setLoading(false)
  }

  const sorted = [...scans].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const first = sorted[0]
  const latest = sorted[sorted.length - 1]
  const hasEnough = scans.length >= 2
  const isHealthyScan = (scan) => (scan?.disease || '').trim().toLowerCase() === 'healthy scalp'
  const diseaseOnlyScans = sorted.filter(scan => !isHealthyScan(scan))

  const scansByDisease = diseaseOnlyScans.reduce((acc, scan) => {
    const key = (scan?.disease || 'Unknown').trim()
    if (!acc[key]) acc[key] = []
    acc[key].push(scan)
    return acc
  }, {})

  const diseaseEntries = Object.entries(scansByDisease)
    .map(([disease, ds]) => ({
      disease,
      scans: ds,
      latestAt: ds[ds.length - 1]?.created_at ? new Date(ds[ds.length - 1].created_at).getTime() : 0,
    }))
    .sort((a, b) => b.latestAt - a.latestAt)

  const comparableDiseaseEntries = diseaseEntries
    .map(({ disease, scans: ds }) => ({
      disease,
      first: ds[0],
      latest: ds[ds.length - 1],
      count: ds.length,
    }))
    .filter(d => d.count >= 2)

  // Stats
  const totalScans = scans.length
  const improvement = hasEnough ? Math.max(0, first.severity_score - latest.severity_score).toFixed(1) : '—'
  const improvementPct = hasEnough ? Math.max(0, ((first.severity_score - latest.severity_score) / first.severity_score * 100)).toFixed(0) : '—'
  const currentSeverity = latest?.severity_score?.toFixed(1) ?? '—'

  return (
    <div className="page">
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            📈 Recovery <span className="grad-text">Progress</span>
          </h1>
          <p style={{ color: 'var(--text2)' }}>Track how your scalp health has improved over time</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : scans.length === 0 ? (
          <div className="glass" style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>No data yet</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 28 }}>
              Complete your first scan to start tracking your recovery journey.
            </p>
            <Link to="/upload" className="btn btn-primary btn-lg">Start First Scan →</Link>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom: 40 }}>
              {[
                { icon: '🔬', label: 'Total Scans', value: totalScans, color: 'var(--purple-l)' },
                { icon: '📊', label: 'Current Severity', value: currentSeverity, color: latest?.severity_score <= 30 ? '#10b981' : latest?.severity_score <= 60 ? '#f59e0b' : '#ef4444' },
                { icon: '⬇️', label: 'Points Improved', value: improvement, color: '#10b981' },
                { icon: '🏆', label: 'Recovery', value: improvementPct === '—' ? '—' : `${improvementPct}%`, color: '#10b981' },
              ].map((s, i) => (
                <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, marginBottom: 32, maxWidth: 360 }}>
              {[
                { key: 'graph', label: '📈 Recovery Graph' },
                { key: 'compare', label: '🔁 Side-by-Side' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                    background: activeTab === tab.key ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'transparent',
                    color: activeTab === tab.key ? '#fff' : 'var(--text2)',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {activeTab === 'graph' ? (
                diseaseEntries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {diseaseEntries.map(({ disease, scans: diseaseScans }) => (
                      <div key={disease} className="glass" style={{ padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <h2 style={{ fontSize: 20, fontWeight: 800 }}>
                              {disease} <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
                                · {diseaseScans.length} scan{diseaseScans.length !== 1 ? 's' : ''}
                              </span>
                            </h2>
                            <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
                              Severity over time for this condition
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 16 }}>
                            {[['#10b981', 'Mild (0–30)'], ['#f59e0b', 'Moderate (30–60)'], ['#ef4444', 'Severe (60+)']].map(([c, l]) => (
                              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{l}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <RecoveryGraph scans={diseaseScans} />

                        {diseaseScans.length < 2 && (
                          <div className="alert" style={{ marginTop: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--purple-l)' }}>
                            💡 Add one more scan for {disease} to see a trend line.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>No disease scans to chart</h3>
                    <p style={{ color: 'var(--text2)' }}>
                      Recovery graph is shown only for disease scans. Healthy scalp scans are excluded.
                    </p>
                  </div>
                )
              ) : (
                comparableDiseaseEntries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {comparableDiseaseEntries.map(({ disease, first: dFirst, latest: dLatest, count }) => (
                      <div key={disease} className="glass" style={{ padding: 20 }}>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 20, fontWeight: 800 }}>
                            {disease}
                          </h3>
                          <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                            Comparing first vs latest ({count} scan{count !== 1 ? 's' : ''})
                          </p>
                        </div>
                        <ComparisonView first={dFirst} latest={dLatest} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔁</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Need 2+ scans for a disease</h3>
                    <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
                      Side-by-side comparison is now disease-wise. Add at least one more scan for the same disease to unlock this view.
                    </p>
                    <Link to="/upload" className="btn btn-primary">+ Add Another Scan</Link>
                  </div>
                )
              )}
            </motion.div>

          </>
        )}
      </div>
    </div>
  )
}
