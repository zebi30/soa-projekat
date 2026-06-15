import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { formatDate } from "../lib/format";
import Badge from "../components/Badge";
import Avatar from "../components/Avatar";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockingId, setBlockingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await api("GET", "/auth/users");
    setLoading(false);
    if (res.ok) {
      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } else {
      setError((res.data && res.data.message) || `Failed to load users (HTTP ${res.status}).`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const block = async (user) => {
    if (!window.confirm(`Block ${user.username}? They will no longer be able to sign in.`)) return;
    setBlockingId(user.id);
    const res = await api("PATCH", `/auth/users/${user.id}/block`);
    setBlockingId(null);
    if (res.ok) {
      setUsers((list) =>
        list.map((u) => (u.id === user.id ? { ...u, is_blocked: true } : u))
      );
    } else {
      alert((res.data && res.data.message) || `Failed to block (HTTP ${res.status}).`);
    }
  };

  const roleTone = (role) =>
    role === "admin" ? "accent" : role === "guide" ? "info" : "neutral";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>User accounts</h1>
          <p className="hint">All registered users. Passwords are never exposed.</p>
        </div>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card no-pad">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="empty">No users found.</td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <Avatar src={u.profile_image_url} name={u.username} size={32} />
                    <div>
                      <div className="strong">{u.username}</div>
                      <div className="muted small">id {u.id}</div>
                    </div>
                  </div>
                </td>
                <td>{u.email}</td>
                <td><Badge tone={roleTone(u.role)}>{u.role}</Badge></td>
                <td>
                  {u.is_blocked ? (
                    <Badge tone="danger">blocked</Badge>
                  ) : (
                    <Badge tone="success">active</Badge>
                  )}
                </td>
                <td className="muted">{formatDate(u.created_at)}</td>
                <td className="right">
                  {u.role !== "admin" && !u.is_blocked && (
                    <button
                      className="btn-danger small"
                      disabled={blockingId === u.id}
                      onClick={() => block(u)}
                    >
                      {blockingId === u.id ? "Blocking…" : "Block"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
