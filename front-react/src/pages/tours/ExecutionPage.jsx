import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Marker, Polyline, Popup, Circle } from "react-leaflet";
import { api } from "../../api/client";
import MapView from "../../components/map/MapView";
import { numberIcon } from "../../lib/leafletSetup";
import Badge from "../../components/Badge";
import { formatDateTime } from "../../lib/format";

const POLL_MS = 10000;

export default function ExecutionPage() {
  const [execution, setExecution] = useState(null);
  const [tour, setTour] = useState(null);
  const [simPos, setSimPos] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  const loadActive = useCallback(async () => {
    const res = await api("GET", "/api/executions/active");
    setLoaded(true);
    if (res.ok && res.data?.execution) {
      setExecution(res.data.execution);
      // Reveal the full route (purchased) so we can show + track key points.
      const full = await api("GET", `/api/purchases/${res.data.execution.tourId}/tour`);
      if (full.ok && full.data?.tour) setTour(full.data.tour);
    } else {
      setExecution(null);
    }
  }, []);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  // Every 10s: ask the Position simulator where the tourist is, then report it
  // so the backend can mark nearby key points completed.
  useEffect(() => {
    if (!execution || execution.status !== "active") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const tick = async () => {
      const posRes = await api("GET", "/api/positions/me");
      const pos = posRes.ok && posRes.data ? posRes.data.position : null;
      if (!pos) {
        setSimPos(null);
        return;
      }
      setSimPos(pos);
      const res = await api("POST", `/api/executions/${execution.id}/check-position`, {
        latitude: pos.latitude,
        longitude: pos.longitude,
      });
      if (res.ok && res.data?.execution) {
        setExecution(res.data.execution);
        if (res.data.newlyCompletedKeyPoints?.length) {
          setMsg(`Reached: ${res.data.newlyCompletedKeyPoints.map((k) => k.name).join(", ")}`);
        }
      }
    };
    tick();
    timerRef.current = setInterval(tick, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [execution?.id, execution?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (action) => async () => {
    setError("");
    const res = await api("PATCH", `/api/executions/${execution.id}/${action}`);
    if (res.ok && res.data?.execution) {
      setExecution(res.data.execution);
      setMsg(`Tour ${res.data.execution.status}.`);
    } else {
      setError((res.data && res.data.message) || `Action failed (HTTP ${res.status}).`);
    }
  };

  if (!loaded) return <div className="page"><p className="hint">Loading…</p></div>;

  if (!execution) {
    return (
      <div className="page">
        <h1>Active tour</h1>
        <div className="card empty-state">
          <p>You have no active tour.</p>
          <p className="hint">Buy a tour, then start it from its page.</p>
          <Link to="/tours/tourist" className="btn-link">Explore tours</Link>
        </div>
      </div>
    );
  }

  const keyPoints = tour?.keyPoints || [];
  const points = keyPoints.map((k) => [k.latitude, k.longitude]);
  const completedSet = new Set((execution.completedKeyPoints || []).map((c) => String(c.keyPointId)));
  const completedAt = new Map((execution.completedKeyPoints || []).map((c) => [String(c.keyPointId), c.completedAt]));
  const allVisited = keyPoints.length > 0 && keyPoints.every((k) => completedSet.has(String(k.id)));
  const center = simPos
    ? [simPos.latitude, simPos.longitude]
    : execution.startLocation
    ? [execution.startLocation.latitude, execution.startLocation.longitude]
    : points[0];

  const statusTone = execution.status === "completed" ? "success" : execution.status === "abandoned" ? "danger" : "info";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{tour?.name || "Active tour"}</h1>
          <div className="tour-meta">
            <Badge tone={statusTone}>{execution.status}</Badge>
            <span>{completedSet.size}/{keyPoints.length} key points</span>
            <span>· last activity {formatDateTime(execution.lastActivity)}</span>
          </div>
        </div>
        {execution.status === "active" && (
          <div className="actions" style={{ marginTop: 0 }}>
            <button
              onClick={finish("complete")}
              disabled={!allVisited}
              title={allVisited ? "" : "Visit all key points first"}
            >
              Complete
            </button>
            <button className="btn-danger" onClick={finish("abandon")}>Abandon</button>
          </div>
        )}
      </div>

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}
      {execution.status === "active" && (
        <p className="hint">
          Your position is read from the Simulator every 10s. Move your pin in the{" "}
          <Link to="/simulator">Simulator</Link> within 50 m of a key point to complete it.
          {!allVisited && <> You can complete the tour only after visiting all key points.</>}
          {simPos && <> Current: <span className="kp-coords">{simPos.latitude.toFixed(5)}, {simPos.longitude.toFixed(5)}</span></>}
        </p>
      )}

      <div className="card">
        <MapView height={420} center={center} zoom={14} fitPoints={points.length ? points : (simPos ? [[simPos.latitude, simPos.longitude]] : null)}>
          {points.length >= 2 && <Polyline positions={points} pathOptions={{ color: "#38bdf8" }} />}
          {keyPoints.map((k, i) => (
            <Marker key={k.id || i} position={[k.latitude, k.longitude]} icon={numberIcon(i + 1, completedSet.has(String(k.id)))}>
              <Popup>{i + 1}. {k.name}{completedSet.has(String(k.id)) ? " ✓" : ""}</Popup>
            </Marker>
          ))}
          {simPos && (
            <>
              <Marker position={[simPos.latitude, simPos.longitude]}>
                <Popup>You are here</Popup>
              </Marker>
              <Circle center={[simPos.latitude, simPos.longitude]} radius={50} pathOptions={{ color: "#38bdf8", fillOpacity: 0.08 }} />
            </>
          )}
        </MapView>
      </div>

      <div className="card">
        <h3>Key points</h3>
        <ul className="kp-list">
          {keyPoints.map((k, i) => {
            const done = completedSet.has(String(k.id));
            return (
              <li key={k.id || i} className="kp-item">
                <span className="kp-num" style={done ? { background: "#16a34a" } : undefined}>{i + 1}</span>
                <div className="grow">
                  <div className="strong">{k.name} {done && <span className="badge badge-success">reached</span>}</div>
                  <div className="muted small">{k.description}</div>
                  {done && <div className="muted small">at {formatDateTime(completedAt.get(String(k.id)))}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
