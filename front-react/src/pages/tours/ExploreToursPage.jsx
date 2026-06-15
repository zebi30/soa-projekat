import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import Badge from "../../components/Badge";

export default function ExploreToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await api("GET", "/api/tours/published");
    setLoading(false);
    if (res.ok) setTours(Array.isArray(res.data?.tours) ? res.data.tours : []);
    else setError((res.data && res.data.message) || `Failed to load tours (HTTP ${res.status}).`);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Explore tours</h1>
          <p className="hint">Published tours. You see the basics and the first key point until you buy.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">{loading ? "Loading…" : "Refresh"}</button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {!loading && tours.length === 0 && !error && (
        <div className="card empty-state"><p>No published tours yet.</p></div>
      )}

      <div className="tour-grid">
        {tours.map((t) => (
          <Link key={t.id} to={`/tours/tourist/${t.id}`} className="card tour-card">
            <div className="tour-meta">
              <Badge tone="info">{t.difficulty}</Badge>
              <span>{t.lengthKm || 0} km</span>
              <span>· €{t.price ?? 0}</span>
            </div>
            <h2>{t.name}</h2>
            <p className="hint" style={{ margin: 0 }}>
              {t.description?.length > 120 ? t.description.slice(0, 120) + "…" : t.description}
            </p>
            {t.firstKeyPoint && (
              <div className="muted small">Starts at: {t.firstKeyPoint.name}</div>
            )}
            {t.tags?.length > 0 && (
              <div className="tag-row">{t.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
