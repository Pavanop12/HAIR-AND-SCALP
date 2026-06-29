import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/upload')
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Account created! Please check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>

      <motion.div className="glass" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, padding: 40, margin: 24, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
          }}>🔬</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to your ScalpScan account' : 'Start your scalp health journey'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10,
          padding: 4, marginBottom: 28,
        }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                background: mode === m ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
              }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div className="alert alert-error" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div className="alert alert-success" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              ✅ {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="auth-email" className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="auth-password" className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button id="auth-submit" className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: 4 }}>
            {loading ? '⏳ Processing...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text2)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--purple-l)', cursor: 'pointer', fontWeight: 600 }}>
            {mode === 'login' ? 'Sign up free' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
