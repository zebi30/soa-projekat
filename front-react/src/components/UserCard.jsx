import Avatar from "./Avatar";
import Badge from "./Badge";

// A person row used in follow lists / recommendations. `action` is an optional
// button descriptor: { label, onClick, tone, busy }.
export default function UserCard({ user, subtitle, action }) {
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || `user ${user?.id}`;

  return (
    <div className="user-card">
      <Avatar src={user?.profile_image_url} name={name} size={44} />
      <div className="grow">
        <div className="strong">{user?.username || `user ${user?.id}`}</div>
        {user?.role && <Badge tone={user.role === "guide" ? "info" : "neutral"}>{user.role}</Badge>}
        {subtitle && <div className="muted small">{subtitle}</div>}
      </div>
      {action && (
        <button
          className={action.tone === "ghost" ? "btn-ghost small" : "small"}
          onClick={action.onClick}
          disabled={action.busy}
        >
          {action.busy ? "…" : action.label}
        </button>
      )}
    </div>
  );
}
