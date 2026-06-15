import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Each nav entry declares which roles may see it. The bar is filtered by the
// signed-in user's role so guides don't see tourist/admin areas and vice versa.
// "korisnik" (any user, incl. admin) features vs. role-specific ones.
const USER = ["guide", "tourist", "admin"];
const NAV = [
  { to: "/blogs", label: "Blogs", roles: USER },
  { to: "/tours/guide", label: "My tours", roles: ["guide"] },
  { to: "/tours/tourist", label: "Explore tours", roles: ["tourist"] },
  { to: "/simulator", label: "Simulator", roles: ["tourist"] },
  { to: "/execution", label: "Active tour", roles: ["tourist"] },
  { to: "/purchase", label: "Purchases", roles: ["tourist"] },
  { to: "/followers", label: "Following", roles: USER },
  { to: "/profile", label: "Profile", roles: USER },
  { to: "/admin", label: "Admin", roles: ["admin"] },
];

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = isAuthenticated ? NAV.filter((n) => n.roles.includes(user.role)) : [];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">SOA Platform</div>
        <div className="session">
          {isAuthenticated ? (
            <>
              <span className="session-info">
                {user.email} · <b>{user.role}</b>
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <span className="session-info">Not signed in</span>
          )}
        </div>
      </header>

      {isAuthenticated && (
        <nav className="nav">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/blogs"}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
