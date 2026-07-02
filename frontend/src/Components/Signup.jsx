import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import logo from'../logo.png';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useContext(AuthContext);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await signup({ name, email, password });
      nav("/dashboard");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Signup failed, please try again";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => nav('/login');

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
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join Finarth to manage your finances</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="auth-input"
            autoComplete="name"
            required
          />

          <label className="auth-label">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="auth-input"
            autoComplete="email"
            required
          />

          <label className="auth-label">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Create a password"
            className="auth-input"
            autoComplete="new-password"
            required
          />

          <button
            disabled={loading}
            className="btn btn-primary auth-cta"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-help">
          <div>Already have an account?</div>
          <button onClick={goLogin} className="auth-link btn btn-ghost">Sign in</button>
        </div>
      </div>
    </div>
  );
}
