import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import logo from'../logo.png';

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState(null)
  const [loading,setLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const nav = useNavigate()

  const submit = async e =>{
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try{
      await login(email,password)
      nav('/dashboard')
    }catch(error){
      setErr(error?.response?.data?.message || error?.message || 'Login failed')
    }finally{
      setLoading(false)
    }
  }

  const goSignup = () => {
    nav('/signup')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <div className="auth-logo"><img 
  src={logo} 
  alt="logout logo" 
  style={{ width: "100px", height: "100px" }} 
/></div>
          {/* <h1 className="auth-title">Finarth</h1> */}
          <br></br>
          <p className="auth-subtitle">Your Personal finance Tracker</p>
        </div>

        <div>
          <h2 className="auth-heading">Welcome back</h2>
          <p className="auth-subtitle mt-1">Sign in to continue to your dashboard</p>
        </div>

        {err && <div className="auth-error">{err}</div>}

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">Email</label>
          <input
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            required
            className="auth-input"
            autoComplete="email"
          />

          <label className="auth-label">Password</label>
          <input
            value={password}
            onChange={e=>setPassword(e.target.value)}
            type="password"
            placeholder="Your password"
            required
            className="auth-input"
            autoComplete="current-password"
          />

          <button type="submit" disabled={loading} className="btn btn-primary auth-cta">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-help">
          <div>Don't have an account?</div>
          <button onClick={goSignup} className="auth-link btn btn-ghost">Create an account</button>
        </div>
      </div>
    </div>
  )
}
