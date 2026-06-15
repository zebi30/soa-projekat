import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders user-provided markdown (blog descriptions, etc.). GFM enables tables,
// strikethrough, task lists and autolinks. react-markdown does not render raw
// HTML by default, which keeps this safe from injected markup.
export default function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ""}</ReactMarkdown>
    </div>
  );
}
