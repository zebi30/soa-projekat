import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { getMyBlogIds } from "../../lib/myBlogs";
import BlogCard from "../../components/BlogCard";

export default function BlogsFeedPage() {
  const { myId } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await api("GET", "/api/blogs");
    if (res.ok) {
      setBlogs(Array.isArray(res.data) ? res.data : []);
    } else {
      setError((res.data && res.data.message) || `Failed to load feed (HTTP ${res.status}).`);
    }

    // Load this user's own posts (tracked locally) so they have normal access
    // to them even though they don't appear in the follow-based feed.
    const ids = getMyBlogIds(myId);
    const fetched = await Promise.all(
      ids.map((id) => api("GET", "/api/blogs/" + id))
    );
    setMyPosts(fetched.filter((r) => r.ok && r.data).map((r) => r.data));
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Blog feed</h1>
          <p className="hint">Posts from people you follow.</p>
        </div>
        <Link to="/blogs/new" className="btn-link">+ New blog</Link>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading && <p className="hint">Loading…</p>}

      {myPosts.length > 0 && (
        <section className="feed-section">
          <h3>My posts</h3>
          <div className="blog-feed">
            {myPosts.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        </section>
      )}

      <section className="feed-section">
        <h3>From people you follow</h3>
        {!loading && blogs.length === 0 && !error ? (
          <div className="card empty-state">
            <p>Your feed is empty.</p>
            <p className="hint">Follow other users to see their posts here, or write your own.</p>
            <Link to="/blogs/new" className="btn-link">Write a blog</Link>
          </div>
        ) : (
          <div className="blog-feed">
            {blogs.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
