import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../stores/adminAuth'

export default function AdminLogin(){
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAdminAuth(s => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event){
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = login({ email: email.trim(), password })
    setLoading(false)
    if (result.success) {
      const next = location.state?.from || '/admin'
      navigate(next, { replace: true })
    } else {
      setError(result.message || 'Unable to sign in')
    }
  }

  return (
    <section className="section">
      <div className="container" style={{display:'grid', placeItems:'center'}}>
        <form onSubmit={onSubmit} className="card" style={{width:'100%', maxWidth:420, display:'grid', gap:16}}>
          <div style={{display:'grid', gap:8}}>
            <span className="eyebrow">Admin access</span>
            <h2>Sign in to dashboard</h2>
            <p className="text-soft">Enter the admin email and password to manage storefront data.</p>
          </div>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Email</span>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="shadow@me"
              required
            />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Password</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="shadow2002@"
              required
            />
          </label>
          {error && (
            <div className="badge" style={{background:'rgba(255,23,68,0.12)', borderColor:'rgba(255,23,68,0.35)', color:'var(--danger)'}}>
              {error}
            </div>
          )}
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}
