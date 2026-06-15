import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Markdown from "../components/Markdown";
import { Field, TextArea } from "../components/Field";

const EMPTY = {
  first_name: "",
  last_name: "",
  profile_image_url: "",
  biography: "",
  motto: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const res = await api("GET", "/auth/me/profile");
    if (res.ok && res.data?.profile) {
      setProfile(res.data.profile);
    } else {
      setError((res.data && res.data.message) || `Failed to load profile (HTTP ${res.status}).`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setForm({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      profile_image_url: profile.profile_image_url || "",
      biography: profile.biography || "",
      motto: profile.motto || "",
    });
    setOk("");
    setError("");
    setEditing(true);
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await api("PATCH", "/auth/me/profile", form);
    setBusy(false);
    if (res.ok && res.data?.profile) {
      setProfile(res.data.profile);
      setEditing(false);
      setOk("Profile updated.");
    } else {
      setError((res.data && res.data.message) || `Failed to save (HTTP ${res.status}).`);
    }
  };

  if (!profile) {
    return (
      <div className="page">
        {error ? <div className="alert error">{error}</div> : <p className="hint">Loading profile…</p>}
      </div>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return (
    <div className="page narrow">
      {ok && <div className="alert success">{ok}</div>}
      {error && <div className="alert error">{error}</div>}

      {!editing ? (
        <div className="card profile-card">
          <div className="profile-header">
            <Avatar src={profile.profile_image_url} name={fullName || profile.username} size={96} />
            <div className="profile-id">
              <h1>{fullName || profile.username}</h1>
              <div className="muted">@{profile.username} · {profile.email}</div>
              <div className="profile-badges">
                <Badge tone={profile.role === "guide" ? "info" : "neutral"}>{profile.role}</Badge>
                {profile.is_blocked && <Badge tone="danger">blocked</Badge>}
              </div>
            </div>
            <button onClick={startEdit}>Edit profile</button>
          </div>

          {profile.motto && <blockquote className="motto">“{profile.motto}”</blockquote>}

          <section>
            <h3>Biography</h3>
            {profile.biography ? (
              <Markdown>{profile.biography}</Markdown>
            ) : (
              <p className="hint">No biography yet.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="card">
          <h1>Edit profile</h1>
          <form onSubmit={save}>
            <div className="row">
              <Field label="First name" value={form.first_name} onChange={set("first_name")} />
              <Field label="Last name" value={form.last_name} onChange={set("last_name")} />
            </div>
            <Field
              label="Profile image URL"
              value={form.profile_image_url}
              onChange={set("profile_image_url")}
              placeholder="https://…"
            />
            <Field label="Motto" value={form.motto} onChange={set("motto")} placeholder="A short quote" />
            <TextArea
              label="Biography (markdown supported)"
              value={form.biography}
              onChange={set("biography")}
              rows={5}
            />
            <div className="actions">
              <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
