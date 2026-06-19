import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Markdown from "./Markdown";
import { useAuthor } from "../hooks/useAuthor";
import { formatDate } from "../lib/format";

// Compact preview of a blog in the feed. Description is markdown; we show a
// trimmed preview and link to the full post.
export default function BlogCard({ blog }) {
  const author = useAuthor(blog.authorId);
  const preview =
    blog.description && blog.description.length > 280
      ? blog.description.slice(0, 280) + "…"
      : blog.description;

  return (
    <article className="card blog-card">
      <header className="blog-card-head">
        <Avatar src={author?.profile_image_url} name={author?.username || `user ${blog.authorId}`} size={36} />
        <div className="grow">
          <div className="strong">{author?.username || `user ${blog.authorId}`}</div>
          <div className="muted small">{formatDate(blog.createdAt)}</div>
        </div>
        {blog.status && <Badge tone={blog.status === "published" ? "success" : "neutral"}>{blog.status}</Badge>}
      </header>

      <Link to={`/blogs/${blog.id}`} className="blog-card-title">
        <h2>{blog.title}</h2>
      </Link>

      {Array.isArray(blog.images) && blog.images.length > 0 && (
        <img className="blog-card-image" src={blog.images[0]} alt="" />
      )}

      <div className="blog-card-preview">
        <Markdown>{preview}</Markdown>
      </div>

      <footer className="blog-card-foot">
        <span title="Likes">♥ {blog.voteCount ?? 0}</span>
        <Link to={`/blogs/${blog.id}`} className="read-more">Read more →</Link>
      </footer>
    </article>
  );
}
