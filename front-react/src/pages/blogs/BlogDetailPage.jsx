import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useAuthor } from "../../hooks/useAuthor";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Markdown from "../../components/Markdown";
import { formatDateTime, wasEdited } from "../../lib/format";

export default function BlogDetailPage() {
  const { id } = useParams();
  const { myId } = useAuth();

  const [blog, setBlog] = useState(null);
  const [error, setError] = useState("");
  const [voteCount, setVoteCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [voting, setVoting] = useState(false);

  const loadBlog = useCallback(async () => {
    setError("");
    const res = await api("GET", "/api/blogs/" + id);
    if (res.ok && res.data) {
      setBlog(res.data);
      setVoteCount(res.data.voteCount ?? 0);
    } else {
      setError((res.data && res.data.message) || `Failed to load blog (HTTP ${res.status}).`);
    }
  }, [id]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  const toggleLike = async () => {
    setVoting(true);
    const res = await api("POST", `/api/blogs/${id}/votes`, { userId: myId });
    setVoting(false);
    if (res.ok && res.data) {
      setVoteCount(res.data.voteCount);
      setLiked((v) => !v);
    } else {
      alert((res.data && res.data.message) || `Failed to vote (HTTP ${res.status}).`);
    }
  };

  if (error) {
    return (
      <div className="page narrow">
        <div className="alert error">{error}</div>
        <Link to="/blogs" className="btn-ghost">← Back to feed</Link>
      </div>
    );
  }

  if (!blog) {
    return <div className="page narrow"><p className="hint">Loading…</p></div>;
  }

  return (
    <div className="page narrow">
      <Link to="/blogs" className="btn-ghost back">← Back to feed</Link>

      <article className="card blog-detail">
        <BlogAuthorLine blog={blog} />
        <h1>{blog.title}</h1>
        <div className="muted small">{formatDateTime(blog.createdAt)}</div>

        {Array.isArray(blog.images) && blog.images.length > 0 && (
          <div className="image-gallery">
            {blog.images.map((src, i) => (
              <img key={i} src={src} alt="" />
            ))}
          </div>
        )}

        <div className="blog-body">
          <Markdown>{blog.description}</Markdown>
        </div>

        <div className="blog-actions">
          <button className={"like-btn" + (liked ? " liked" : "")} onClick={toggleLike} disabled={voting}>
            ♥ {liked ? "Liked" : "Like"} · {voteCount}
          </button>
        </div>
      </article>

      <CommentsSection blogId={id} myId={myId} />
    </div>
  );
}

function BlogAuthorLine({ blog }) {
  const author = useAuthor(blog.authorId);
  return (
    <div className="blog-card-head">
      <Avatar src={author?.profile_image_url} name={author?.username || `user ${blog.authorId}`} size={40} />
      <div className="grow">
        <div className="strong">{author?.username || `user ${blog.authorId}`}</div>
      </div>
      {blog.status && <Badge tone={blog.status === "published" ? "success" : "neutral"}>{blog.status}</Badge>}
    </div>
  );
}

function CommentsSection({ blogId, myId }) {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await api("GET", `/api/blogs/${blogId}/comments`);
    if (res.ok) {
      setComments(Array.isArray(res.data) ? res.data : []);
    } else {
      setError((res.data && res.data.message) || `Failed to load comments (HTTP ${res.status}).`);
    }
  }, [blogId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const res = await api("POST", `/api/blogs/${blogId}/comments`, { authorId: myId, text: text.trim() });
    setBusy(false);
    if (res.ok) {
      setText("");
      load();
    } else {
      setError((res.data && res.data.message) || `Failed to comment (HTTP ${res.status}).`);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const saveEdit = async (c) => {
    const res = await api("PUT", `/api/blogs/${blogId}/comments/${c.id}`, { text: editText });
    if (res.ok) {
      setEditingId(null);
      load();
    } else {
      alert((res.data && res.data.message) || `Failed to update (HTTP ${res.status}).`);
    }
  };

  const remove = async (c) => {
    if (!window.confirm("Delete this comment?")) return;
    const res = await api("DELETE", `/api/blogs/${blogId}/comments/${c.id}`);
    if (res.ok) load();
    else alert((res.data && res.data.message) || `Failed to delete (HTTP ${res.status}).`);
  };

  return (
    <section className="card comments">
      <h3>Comments ({comments.length})</h3>

      <form className="comment-form" onSubmit={add}>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
        />
        <button type="submit" disabled={busy}>{busy ? "Posting…" : "Post"}</button>
      </form>
      <p className="hint small">You can comment only on blogs by users you follow.</p>

      {error && <div className="alert error">{error}</div>}

      <ul className="comment-list">
        {comments.length === 0 && <li className="hint">No comments yet.</li>}
        {comments.map((c) => {
          const mine = c.author && Number(c.author.id) === myId;
          return (
            <li key={c.id} className="comment">
              <Avatar src={c.author?.profile_image_url} name={c.author?.username || "user"} size={32} />
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="strong">{c.author?.username || `user ${c.authorId}`}</span>
                  <span className="muted small">{formatDateTime(c.createdAt)}</span>
                  {wasEdited(c.createdAt, c.updatedAt) && <span className="muted small">· edited</span>}
                </div>
                {editingId === c.id ? (
                  <div className="comment-edit">
                    <textarea rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="actions">
                      <button className="small" onClick={() => saveEdit(c)}>Save</button>
                      <button className="btn-ghost small" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-text">{c.text}</p>
                )}
                {mine && editingId !== c.id && (
                  <div className="comment-controls">
                    <button className="link-btn" onClick={() => startEdit(c)}>Edit</button>
                    <button className="link-btn danger" onClick={() => remove(c)}>Delete</button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
