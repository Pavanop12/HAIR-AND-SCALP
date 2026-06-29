import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const DISEASES = [
  'Alopecia Areata','Contact Dermatitis','Folliculitis','Head Lice',
  'Lichen Planus','Male Pattern Baldness','Psoriasis',
  'Seborrheic Dermatitis','Telogen Effluvium','Tinea Capitis'
]

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } })
}

export default function Landing() {
  return (
    <div className="page" style={{ position: 'relative' }}>
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Hero */}
      <section style={{ padding: '100px 0 80px', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <span className="badge badge-purple" style={{ marginBottom: 24 }}>
              🔬 CNN-Powered Scalp Analysis
            </span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
            style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 24 }}>
            Detect. Track.<br />
            <span className="grad-text">Recover.</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
            style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Upload a scalp image. Get an AI diagnosis. Watch your severity score drop over time.
            The first app that turns hair disease detection into a <strong style={{ color: 'var(--text)' }}>recovery journey</strong>.
          </motion.p>

          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn btn-primary btn-lg">Start Free Analysis →</Link>
            <Link to="/how-it-works" className="btn btn-ghost btn-lg">See How It Works</Link>
          </motion.div>

          {/* Disease pills */}
          <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
            style={{ marginTop: 64, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {DISEASES.map(d => (
              <span key={d} className="badge badge-cyan">{d}</span>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  )
}
