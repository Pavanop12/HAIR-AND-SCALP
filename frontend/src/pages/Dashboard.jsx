import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { attachScanImageUrls } from '../lib/scanImages'

const SEVERITY_COLOR = (s) => s <= 30 ? '#10b981' : s <= 60 ? '#f59e0b' : '#ef4444'
const SEVERITY_LABEL = (s) => s <= 30 ? 'Mild' : s <= 60 ? 'Moderate' : 'Severe'

export default function Dashboard() {
  const { user } = useAuth()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchScans() }, [user])

  const fetchScans = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('scans')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const enriched = await attachScanImageUrls(data || [], user.id)
    setScans(enriched || [])
    setLoading(false)
  }

  const deleteScan = async (id) => {
    if (!confirm('Delete this scan?')) return
    setDeleting(id)
    await supabase.from('scans').delete().eq('id', id)
    setScans(prev => prev.filter(s => s.id !== id))
    setDeleting(null)
  }

  // Stats
  const totalScans = scans.length
  const avgSeverity = totalScans ? (scans.reduce((a, s) => a + s.severity_score, 0) / totalScans).toFixed(1) : '—'
  const latest = scans[0]?.severity_score ?? 0
  const first = scans[scans.length - 1]?.severity_score ?? 0
  const improvement = totalScans > 1 ? Math.max(0, ((first - latest) / first * 100)).toFixed(0) : '—'

  return (
    <div className="page">
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80, position: 'relative', zIndex: 1 }}>

        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
              📋 Scan <span className="grad-text">History</span>
            </h1>
            <p style={{ color: 'var(--text2)' }}>Your complete scalp analysis timeline</p>
          </div>
          <Link to="/upload" className="btn btn-primary">+ New Scan</Link>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 40 }}>
          {[
            { icon: '🔬', label: 'Total Scans', value: totalScans, color: 'var(--purple-l)' },
            { icon: '📊', label: 'Avg Severity', value: avgSeverity, color: avgSeverity !== '—' ? SEVERITY_COLOR(avgSeverity) : 'var(--text2)' },
            { icon: '📈', label: 'Recovery', value: improvement === '—' ? '—' : `${improvement}%`, color: 'var(--success)' },
          ].map((s, i) => (
            <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Scan list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : scans.length === 0 ? (
          <div className="glass" style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔬</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>No scans yet</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 28 }}>Upload your first scalp image to start tracking your health journey.</p>
            <Link to="/upload" className="btn btn-primary btn-lg">Start First Scan →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {scans.map((scan, i) => (
              <motion.div key={scan.id} className="glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                {/* Image thumbnail */}
                <div style={{
                  width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {scan.image_url
                    ? <img src={scan.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 28 }}>🖼️</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{scan.disease}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: `${SEVERITY_COLOR(scan.severity_score)}20`,
                      color: SEVERITY_COLOR(scan.severity_score),
                      border: `1px solid ${SEVERITY_COLOR(scan.severity_score)}40`,
                    }}>{SEVERITY_LABEL(scan.severity_score)}</span>
                    {i === 0 && <span className="badge badge-purple">Latest</span>}
                    {i === scans.length - 1 && scans.length > 1 && <span className="badge badge-cyan">First</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {new Date(scan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} ·
                    Confidence: {scan.confidence.toFixed(1)}%
                  </p>
                </div>

                {/* Severity score */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: SEVERITY_COLOR(scan.severity_score) }}>
                    {scan.severity_score.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>Severity</div>
                </div>

                {/* Delete */}
                <button id={`delete-scan-${scan.id}`} className="btn btn-danger btn-sm" onClick={() => deleteScan(scan.id)}
                  disabled={deleting === scan.id}>
                  {deleting === scan.id ? '...' : '🗑️'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
