import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Marker, Polyline, Popup } from "react-leaflet";
import { api } from "../../api/client";
import MapView from "../../components/map/MapView";
import { numberIcon } from "../../lib/leafletSetup";
import { Field, TextArea } from "../../components/Field";
import Badge from "../../components/Badge";

const EMPTY_KP = { name: "", description: "", imageUrl: "" };

export default function TourManagePage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // key point form / map selection
  const [form, setForm] = useState(EMPTY_KP);
  const [pos, setPos] = useState(null); // { lat, lng } selected on the map
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  // transport time form
  const [transport, setTransport] = useState("walking");
  const [minutes, setMinutes] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await api("GET", "/api/tours/" + id);
    if (res.ok && res.data?.tour) setTour(res.data.tour);
    else setError((res.data && res.data.message) || `Failed to load tour (HTTP ${res.status}).`);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const keyPoints = tour?.keyPoints || [];
  const setField = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(EMPTY_KP);
    setPos(null);
    setEditingId(null);
  };

  const onMapClick = (lat, lng) => setPos({ lat, lng });

  const startEdit = (kp) => {
    setEditingId(kp.id);
    setForm({ name: kp.name, description: kp.description, imageUrl: kp.imageUrl || "" });
    setPos({ lat: kp.latitude, lng: kp.longitude });
  };

  const submitKeyPoint = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!pos) {
      setError("Select a position on the map first.");
      return;
    }
    if (!form.name.trim() || !form.description.trim()) {
      setError("Name and description are required.");
      return;
    }
    setError("");
    setBusy(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      latitude: pos.lat,
      longitude: pos.lng,
      imageUrl: form.imageUrl.trim() || null,
    };
    const res = editingId
      ? await api("PUT", `/api/tours/${id}/keypoints/${editingId}`, body)
      : await api("POST", `/api/tours/${id}/keypoints`, body);
    setBusy(false);
    if (res.ok) {
      resetForm();
      setMsg(editingId ? "Key point updated." : "Key point added.");
      load();
    } else {
      setError((res.data && res.data.message) || `Failed to save key point (HTTP ${res.status}).`);
    }
  };

  const deleteKeyPoint = async (kp) => {
    if (!window.confirm(`Delete key point "${kp.name}"?`)) return;
    const res = await api("DELETE", `/api/tours/${id}/keypoints/${kp.id}`);
    if (res.ok) {
      if (editingId === kp.id) resetForm();
      load();
    } else alert((res.data && res.data.message) || `Failed to delete (HTTP ${res.status}).`);
  };

  const addTransport = async (e) => {
    e.preventDefault();
    const res = await api("POST", `/api/tours/${id}/transport-times`, {
      transport,
      minutes: Number(minutes),
    });
    if (res.ok) {
      setMinutes("");
      load();
    } else alert((res.data && res.data.message) || `Failed to add transport time (HTTP ${res.status}).`);
  };

  const lifecycle = (action) => async () => {
    setMsg("");
    const res = await api("POST", `/api/tours/${id}/${action}`);
    if (res.ok) {
      setMsg(res.data?.message || "Done.");
      load();
    } else {
      setError((res.data && res.data.message) || `Action failed (HTTP ${res.status}).`);
    }
  };

  if (error && !tour) {
    return (
      <div className="page">
        <div className="alert error">{error}</div>
        <Link to="/tours/guide" className="btn-ghost">← Back to my tours</Link>
      </div>
    );
  }
  if (!tour) return <div className="page"><p className="hint">Loading…</p></div>;

  const fitPoints = keyPoints.map((k) => [k.latitude, k.longitude]);
  const line = keyPoints.map((k) => [k.latitude, k.longitude]);

  return (
    <div className="page">
      <Link to="/tours/guide" className="btn-ghost back">← My tours</Link>

      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <div>
            <h1>{tour.name}</h1>
            <div className="tour-meta">
              <Badge tone={tour.status === "published" ? "success" : tour.status === "archived" ? "neutral" : "info"}>
                {tour.status}
              </Badge>
              <span>{tour.difficulty}</span>
              <span>· {tour.lengthKm || 0} km</span>
              <span>· {keyPoints.length} key points</span>
              <span>· €{tour.price ?? 0}</span>
            </div>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            {tour.status === "draft" && <button onClick={lifecycle("publish")}>Publish</button>}
            {tour.status === "published" && <button className="btn-ghost" onClick={lifecycle("archive")}>Archive</button>}
            {tour.status === "archived" && <button onClick={lifecycle("activate")}>Activate</button>}
          </div>
        </div>
        {tour.tags?.length > 0 && (
          <div className="tag-row">{tour.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
        )}
        <p className="hint" style={{ marginTop: 10 }}>{tour.description}</p>
        {tour.status === "draft" && (
          <p className="hint">To publish: at least 2 key points and 1 transport time are required.</p>
        )}
      </div>

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="grid-2">
        {/* Map + key point editor */}
        <div className="card">
          <h3>{editingId ? "Edit key point" : "Add key point"}</h3>
          <p className="map-hint">Click the map to set the position{pos ? ":" : "."} {pos && (
            <span className="kp-coords">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</span>
          )}</p>
          <MapView height={320} onMapClick={onMapClick} fitPoints={pos ? [...fitPoints, [pos.lat, pos.lng]] : fitPoints}>
            {line.length >= 2 && <Polyline positions={line} pathOptions={{ color: "#38bdf8" }} />}
            {keyPoints.map((k, i) => (
              <Marker key={k.id} position={[k.latitude, k.longitude]} icon={numberIcon(i + 1)}>
                <Popup>{i + 1}. {k.name}</Popup>
              </Marker>
            ))}
            {pos && <Marker position={[pos.lat, pos.lng]} />}
          </MapView>

          <form onSubmit={submitKeyPoint} style={{ marginTop: 12 }}>
            <Field label="Name" value={form.name} onChange={setField("name")} />
            <Field label="Description" value={form.description} onChange={setField("description")} />
            <Field label="Image URL (optional)" value={form.imageUrl} onChange={setField("imageUrl")} placeholder="https://…" />
            <div className="actions">
              <button type="submit" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Add key point"}
              </button>
              {editingId && <button type="button" className="btn-ghost" onClick={resetForm}>Cancel edit</button>}
            </div>
          </form>
        </div>

        {/* Key point list + transport */}
        <div className="card">
          <h3>Key points ({keyPoints.length})</h3>
          {keyPoints.length === 0 && <p className="hint">No key points yet. Click the map and add one.</p>}
          <ul className="kp-list">
            {keyPoints.map((k, i) => (
              <li key={k.id} className="kp-item">
                <span className="kp-num">{i + 1}</span>
                <div className="grow">
                  <div className="strong">{k.name}</div>
                  <div className="muted small">{k.description}</div>
                  <div className="kp-coords">{k.latitude.toFixed(5)}, {k.longitude.toFixed(5)}</div>
                </div>
                <div className="actions" style={{ marginTop: 0 }}>
                  <button className="btn-ghost small" onClick={() => startEdit(k)}>Edit</button>
                  <button className="btn-danger small" onClick={() => deleteKeyPoint(k)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          <h3>Transport times</h3>
          {(tour.transportTimes || []).length === 0 && <p className="hint">None yet.</p>}
          <ul className="kp-list">
            {(tour.transportTimes || []).map((tt) => (
              <li key={tt.id} className="kp-item">
                <div className="grow"><span className="strong">{tt.transport}</span> — {tt.minutes} min</div>
              </li>
            ))}
          </ul>
          <form className="row" onSubmit={addTransport} style={{ marginTop: 8, alignItems: "flex-end" }}>
            <label className="field">
              <span>Transport</span>
              <select value={transport} onChange={(e) => setTransport(e.target.value)}>
                <option value="walking">walking</option>
                <option value="bicycle">bicycle</option>
                <option value="car">car</option>
              </select>
            </label>
            <Field label="Minutes" value={minutes} onChange={setMinutes} type="number" />
            <button type="submit">Add</button>
          </form>
        </div>
      </div>
    </div>
  );
}
