import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) {
      navigate("/");
    } else {
      setError((res.data && res.data.message) || `Login failed (HTTP ${res.status}).`);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">SOA Platform</div>
        <h2>Welcome back</h2>
        <p className="hint">Sign in to continue.</p>
        {isAuthenticated && <div className="alert">You are already signed in.</div>}
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn-block" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="hint center">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
