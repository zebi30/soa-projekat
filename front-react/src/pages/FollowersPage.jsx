import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { getUser } from "../api/users";
import UserCard from "../components/UserCard";

export default function FollowersPage() {
  const [following, setFollowing] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [followRes, recRes] = await Promise.all([
      api("GET", "/me/following"),
      api("GET", "/me/recommendations"),
    ]);

    if (followRes.ok && Array.isArray(followRes.data)) {
      const users = await Promise.all(followRes.data.map((u) => getUser(u.id)));
      setFollowing(users.map((u, i) => u || { id: followRes.data[i].id }));
    } else {
      setError((followRes.data && followRes.data.message) || "Failed to load following list.");
    }

    if (recRes.ok && Array.isArray(recRes.data)) {
      const users = await Promise.all(recRes.data.map((r) => getUser(r.id)));
      setRecommendations(
        recRes.data.map((r, i) => ({ ...(users[i] || { id: r.id }), mutualFollowCount: r.mutualFollowCount }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const follow = async (id) => {
    setBusyId(id);
    const res = await api("POST", "/follows", { followingId: Number(id) });
    setBusyId(null);
    if (res.ok) {
      load();
    } else {
      alert((res.data && res.data.message) || `Failed to follow (HTTP ${res.status}).`);
    }
  };

  const unfollow = async (id) => {
    setBusyId(id);
    const res = await api("DELETE", "/follows", { followingId: Number(id) });
    setBusyId(null);
    if (res.ok) load();
    else alert((res.data && res.data.message) || `Failed to unfollow (HTTP ${res.status}).`);
  };

  const followingIds = new Set(following.map((u) => Number(u.id)));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Following</h1>
          <p className="hint">People you follow, and suggestions based on your network.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* Recommendations */}
      <section className="card">
        <h3>Suggested to follow</h3>
        {recommendations.length === 0 ? (
          <p className="hint">
            No suggestions yet. Recommendations are built from people followed by those you
            already follow — once your network grows, suggestions appear here.
          </p>
        ) : (
          <div className="user-list">
            {recommendations.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                subtitle={
                  u.mutualFollowCount > 0
                    ? `${u.mutualFollowCount} mutual ${u.mutualFollowCount === 1 ? "follow" : "follows"}`
                    : "Suggested for you"
                }
                action={{
                  label: followingIds.has(Number(u.id)) ? "Following" : "Follow",
                  onClick: () => follow(u.id),
                  busy: busyId === u.id,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Current following */}
      <section className="card">
        <h3>People you follow ({following.length})</h3>
        {following.length === 0 ? (
          <p className="hint">You aren't following anyone yet.</p>
        ) : (
          <div className="user-list">
            {following.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                action={{ label: "Unfollow", tone: "ghost", onClick: () => unfollow(u.id), busy: busyId === u.id }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
