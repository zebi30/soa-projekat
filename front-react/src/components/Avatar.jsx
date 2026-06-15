import { initials } from "../lib/format";

export default function Avatar({ src, name, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (src) {
    return <img className="avatar" style={style} src={src} alt={name || "avatar"} />;
  }
  return (
    <span className="avatar avatar-fallback" style={style}>
      {initials(name)}
    </span>
  );
}
