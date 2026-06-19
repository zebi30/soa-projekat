import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Field, TextArea } from "../../components/Field";
import Badge from "../../components/Badge";

const statusTone = (s) => (s === "published" ? "success" : s === "archived" ? "neutral" : "info");

export default function ToursGuideListPage() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [tagsInput, setTagsInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await api("GET", "/api/tours/mine");
    setLoading(false);
    if (res.ok) setTours(Array.isArray(res.data?.tours) ? res.data.tours : []);
    else setError((res.data && res.data.message) || `Failed to load tours (HTTP ${res.status}).`);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const res = await api("POST", "/api/tours", { name, description, difficulty, tags });
    setBusy(false);
    if (res.ok && res.data?.tour?.id) {
      navigate(`/tours/guide/${res.data.tour.id}`);
    } else {
      setFormError((res.data && res.data.message) || `Failed to create tour (HTTP ${res.status}).`);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My tours</h1>
          <p className="hint">Create tours and manage their key points, transport times and lifecycle.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={create}>
          <h3>Create a tour</h3>
          {formError && <div className="alert error">{formError}</div>}
          <Field label="Name" value={name} onChange={setName} />
          <TextArea label="Description" value={description} onChange={setDescription} />
          <div className="row">
            <label className="field">
              <span>Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <Field label="Tags (comma separated)" value={tagsInput} onChange={setTagsInput} placeholder="city, history" />
          </div>
          <p className="hint">New tours start as <b>draft</b> with price 0. Add key points next.</p>
          <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create tour"}</button>
        </form>

        <div className="card">
          <h3>Your tours ({tours.length})</h3>
          {error && <div className="alert error">{error}</div>}
          {tours.length === 0 && !loading && <p className="hint">No tours yet.</p>}
          <div className="tour-grid">
            {tours.map((t) => (
              <Link key={t.id} to={`/tours/guide/${t.id}`} className="card tour-card">
                <div className="tour-meta">
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  <span>{t.difficulty}</span>
                </div>
                <h2>{t.name}</h2>
                <div className="tour-meta">
                  <span>{t.keyPoints?.length || 0} key points</span>
                  <span>· {t.lengthKm || 0} km</span>
                  <span>· €{t.price ?? 0}</span>
                </div>
                {t.tags?.length > 0 && (
                  <div className="tag-row">
                    {t.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
