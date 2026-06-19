import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { addMyBlogId } from "../../lib/myBlogs";
import Markdown from "../../components/Markdown";

export default function CreateBlogPage() {
  const { myId } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([""]);
  const [tab, setTab] = useState("write");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setImage = (i, v) => setImages((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  const addImage = () => setImages((arr) => [...arr, ""]);
  const removeImage = (i) => setImages((arr) => arr.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setBusy(true);
    const cleanImages = images.map((s) => s.trim()).filter(Boolean);
    const res = await api("POST", "/api/blogs", {
      title: title.trim(),
      description,
      authorId: myId,
      status: "published",
      images: cleanImages,
    });
    setBusy(false);
    if (res.ok && res.data?.id) {
      addMyBlogId(myId, res.data.id);
      navigate(`/blogs/${res.data.id}`);
    } else if (res.ok) {
      navigate("/blogs");
    } else {
      setError((res.data && res.data.message) || `Failed to publish (HTTP ${res.status}).`);
    }
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>New blog</h1>
        <Link to="/blogs" className="btn-ghost">Cancel</Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={submit}>
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A catchy title" />
        </label>

        <div className="field">
          <div className="editor-tabs">
            <span>Description (markdown)</span>
            <div className="tab-buttons">
              <button type="button" className={tab === "write" ? "active" : ""} onClick={() => setTab("write")}>Write</button>
              <button type="button" className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>Preview</button>
            </div>
          </div>
          {tab === "write" ? (
            <textarea
              className="md-editor"
              rows={12}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={"# Heading\n\nWrite **markdown** here — _lists_, `code`, [links](https://example.com)…"}
            />
          ) : (
            <div className="md-preview">
              <Markdown>{description || "_Nothing to preview yet._"}</Markdown>
            </div>
          )}
        </div>

        <div className="field">
          <span>Images (optional URLs)</span>
          {images.map((img, i) => (
            <div className="image-row" key={i}>
              <input value={img} onChange={(e) => setImage(i, e.target.value)} placeholder="https://…" />
              {images.length > 1 && (
                <button type="button" className="btn-ghost small" onClick={() => removeImage(i)}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" className="btn-ghost small" onClick={addImage}>+ Add image</button>
        </div>

        <div className="actions">
          <button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish blog"}</button>
        </div>
      </form>
    </div>
  );
}
