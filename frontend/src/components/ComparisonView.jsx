import { motion } from 'framer-motion'

const SEVERITY_COLOR = (s) => s <= 30 ? '#10b981' : s <= 60 ? '#f59e0b' : '#ef4444'
const SEVERITY_LABEL = (s) => s <= 30 ? 'Mild' : s <= 60 ? 'Moderate' : 'Severe'

function ScanCard({ scan, label, color }) {
  return (
    <div className="glass" style={{ overflow: 'hidden', background: `${color}08`, border: `1px solid ${color}30` }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', background: `${color}15`, borderBottom: `1px solid ${color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
          {new Date(scan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Image */}
      <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {scan.image_url
          ? <img
              src={scan.image_url}
              alt="Scalp scan"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.parentElement?.querySelector('[data-image-fallback="true"]')
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          : null}
        <div style={{
          display: scan.image_url ? 'none' : 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, width: '100%', height: '100%',
          background: `${color}08`,
        }}
          data-image-fallback="true">
          <div style={{ fontSize: 48, opacity: 0.4 }}>🔬</div>
          <span style={{ fontSize: 12, color: 'var(--text2)', opacity: 0.6 }}>No image available</span>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{scan.disease}</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Severity</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: SEVERITY_COLOR(scan.severity_score) }}>
              {scan.severity_score.toFixed(1)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: SEVERITY_COLOR(scan.severity_score) }}>
              {SEVERITY_LABEL(scan.severity_score)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Confidence</p>
            <p style={{ fontSize: 16, fontWeight: 700 }}>{scan.confidence.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonView({ first, latest }) {
  const improved = latest.severity_score < first.severity_score
  const diff = (first.severity_score - latest.severity_score).toFixed(1)
  const pct = ((first.severity_score - latest.severity_score) / first.severity_score * 100).toFixed(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Improvement banner */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: '20px 28px', borderRadius: 16, textAlign: 'center',
          background: improved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${improved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{improved ? '🎉' : '💪'}</div>
        {improved ? (
          <>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>
              You've improved by {diff} points ({pct}%)!
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              Keep going — your scalp is healing. Consistency is key.
            </p>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>
              Severity increased by {Math.abs(diff)} points
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              Don't give up! Review your treatment plan and consult a dermatologist.
            </p>
          </>
        )}
      </motion.div>

      {/* Side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
        <ScanCard scan={first} label="📅 First Scan" color="#06b6d4" />
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--grad)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, margin: '0 auto',
          }}>→</div>
          <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>vs</p>
        </div>
        <ScanCard scan={latest} label="🆕 Latest Scan" color="#7c3aed" />
      </div>

      {/* Change indicator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>SEVERITY CHANGE</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: improved ? '#10b981' : '#ef4444' }}>
            {improved ? '↓' : '↑'} {Math.abs(diff)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>points</p>
        </div>
        <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>RECOVERY RATE</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: improved ? '#10b981' : '#ef4444' }}>
            {improved ? '+' : '-'}{Math.abs(pct)}%
          </p>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>from baseline</p>
        </div>
      </div>
    </div>
  )
}
