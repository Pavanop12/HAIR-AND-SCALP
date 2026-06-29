import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '🧠', title: 'AI-Powered Detection', desc: 'MobileNetV2 CNN trained on 10 scalp conditions with high accuracy' },
  { icon: '📊', title: 'Severity Scoring', desc: 'Each scan is converted into a numeric severity score for objective tracking' },
  { icon: '📈', title: 'Recovery Graph', desc: 'Visualize your severity score trending down as you heal over time' },
  { icon: '🔁', title: 'Side-by-Side Comparison', desc: 'See your first scan vs latest — the visual proof of your progress' },
  { icon: '🔒', title: 'Private & Secure', desc: 'Your scans are encrypted and only accessible to you via Supabase RLS' },
  { icon: '💡', title: 'Treatment Insights', desc: 'Each diagnosis comes with evidence-based treatment recommendations' },
]

const STEPS = [
  { num: '01', title: 'Upload a Scalp Image', desc: 'Take a photo or drag-and-drop an existing image of your scalp' },
  { num: '02', title: 'AI Analyzes It', desc: 'Our CNN model identifies the condition and calculates a severity score' },
  { num: '03', title: 'Save Your Scan', desc: 'Results are stored securely in your personal timeline' },
  { num: '04', title: 'Track Recovery', desc: 'Watch your severity drop as your scalp heals — shown in a recovery graph' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
}

export default function HowItWorks() {
  return (
    <div className="page" style={{ position: 'relative' }}>
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <section style={{ padding: '32px 0 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <Link to="/" className="btn btn-ghost">← Back to Home</Link>
        </div>
      </section>

      <section style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px' }}>
              How It <span className="grad-text">Works</span>
            </h2>
            <p style={{ color: 'var(--text2)', marginTop: 12, fontSize: 16 }}>Four steps from upload to recovery insight</p>
          </div>
          <div className="grid-2" style={{ gap: 24 }}>
            {STEPS.map((step, i) => (
              <motion.div key={i} className="glass" initial="hidden" whileInView="visible"
                viewport={{ once: true }} custom={i} variants={fadeUp}
                style={{ padding: 32, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: 'var(--purple-l)',
                  background: 'rgba(124,58,237,0.15)', padding: '6px 12px',
                  borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0,
                }}>{step.num}</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px' }}>
              Every Feature <span className="grad-text">You Need</span>
            </h2>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <motion.div key={i} className="glass" initial="hidden" whileInView="visible"
                viewport={{ once: true }} custom={i} variants={fadeUp}
                style={{ padding: 28 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 16 }}>{f.icon}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
