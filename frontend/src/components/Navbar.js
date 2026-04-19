import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav className="navbar">
      <div className="navbar-brand">CINE<span>BOOK</span></div>
      <div className="navbar-user">
        <Link to="/my-bookings" className="my-bookings-link">My Bookings</Link>
        <div className="user-avatar">{initials}</div>
        <span className="user-name">{user?.name || "Guest"}</span>
        <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
      </div>
    </nav>
  );
};

export default Navbar;
