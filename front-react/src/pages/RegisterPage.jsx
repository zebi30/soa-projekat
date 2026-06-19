import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "tourist", label: "Tourist", desc: "Browse, buy and execute tours." },
  { value: "guide", label: "Guide", desc: "Create and publish tours and blogs." },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "tourist" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    setBusy(true);
    const res = await register(form.username, form.email, form.password, form.role);
    setBusy(false);
    if (res.ok) {
      setOk("Account created. Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 900);
    } else {
      setError((res.data && res.data.message) || `Registration failed (HTTP ${res.status}).`);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">SOA Platform</div>
        <h2>Create account</h2>
        <p className="hint">Admins are provisioned directly in the database.</p>
        {error && <div className="alert error">{error}</div>}
        {ok && <div className="alert success">{ok}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(e) => set("username")(e.target.value)} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={(e) => set("password")(e.target.value)} required />
          </label>

          <span className="field-label">Role</span>
          <div className="role-picker">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                className={"role-option" + (form.role === r.value ? " selected" : "")}
                onClick={() => set("role")(r.value)}
              >
                <strong>{r.label}</strong>
                <span>{r.desc}</span>
              </button>
            ))}
          </div>

          <button className="btn-block" disabled={busy} type="submit">
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="hint center">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
