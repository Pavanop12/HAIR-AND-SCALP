import { motion } from 'framer-motion'

const SEVERITY_COLORS = [
  { max: 30, color: '#10b981', label: 'Mild', bg: 'rgba(16,185,129,0.15)' },
  { max: 60, color: '#f59e0b', label: 'Moderate', bg: 'rgba(245,158,11,0.15)' },
  { max: 100, color: '#ef4444', label: 'Severe', bg: 'rgba(239,68,68,0.15)' },
]

function getSeverityInfo(score) {
  return SEVERITY_COLORS.find(s => score <= s.max) || SEVERITY_COLORS[2]
}

function ConfidenceRing({ value }) {
  const r = 54; const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <motion.circle cx="65" cy="65" r={r} fill="none"
        stroke="url(#grad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }}
        transform="rotate(-90 65 65)" />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <text x="65" y="60" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="Inter">
        {value.toFixed(1)}%
      </text>
      <text x="65" y="78" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter">
        Confidence
      </text>
    </svg>
  )
}

export default function ResultCard({ result, onSave, saving }) {
  const { disease, confidence, severity_score, info } = result
  const sev = getSeverityInfo(severity_score)

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Main result */}
      <div className="glass" style={{ padding: 28, background: 'var(--grad2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <ConfidenceRing value={confidence} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Detected Condition
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{disease}</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: sev.bg, color: sev.color,
                border: `1px solid ${sev.color}40`,
              }}>
                {sev.label} · Severity {severity_score.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Severity bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Severity Score</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: sev.color }}>{severity_score.toFixed(1)} / 100</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${severity_score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: sev.color, borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#10b981' }}>Mild</span>
            <span style={{ fontSize: 11, color: '#f59e0b' }}>Moderate</span>
            <span style={{ fontSize: 11, color: '#ef4444' }}>Severe</span>
          </div>
        </div>
      </div>

      {/* Treatment info */}
      {info?.description && (
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📋 About This Condition</h3>
          <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{info.description}</p>
          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--cyan-l)', fontWeight: 600 }}>💊 Recommended Treatment</p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{info.treatment}</p>
          </div>
        </div>
      )}

      {/* Save button */}
      <button id="save-scan-btn" className="btn btn-primary" onClick={onSave} disabled={saving}
        style={{ width: '100%', padding: 16, fontSize: 16 }}>
        {saving ? '⏳ Saving...' : '💾 Save Scan to History'}
      </button>
    </motion.div>
  )
}
