import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      height: 72, display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🔬</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="grad-text">ScalpScan</span>
            <span style={{ color: 'var(--text2)', fontWeight: 400 }}> AI</span>
          </span>
        </Link>

        {/* Nav links */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { path: '/upload', label: '🧬 Analyze' },
              { path: '/dashboard', label: '📋 History' },
              { path: '/progress', label: '📈 Progress' },
            ].map(({ path, label }) => (
              <Link key={path} to={path} style={{
                textDecoration: 'none', padding: '8px 16px', borderRadius: 8,
                fontSize: 14, fontWeight: 500,
                color: isActive(path) ? 'var(--text)' : 'var(--text2)',
                background: isActive(path) ? 'rgba(124,58,237,0.15)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                {user.email?.split('@')[0]}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">Get Started</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
