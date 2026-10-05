import { NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiUsers, FiStar, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
import "../styles/sidebar.css";
export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const links = [["/", "Overview", FiGrid], ["/members", "Members", FiUsers], ["/premium", "Premium", FiStar], ["/reports", "Reports", FiBarChart2], ["/settings", "Settings", FiSettings]];
  function logout() { ["adminToken", "adminUser", "admin"].forEach(key => localStorage.removeItem(key)); navigate("/login", { replace: true }); }
  return <aside className="admin-sidebar"><div className="sidebar-brand"><img className="brand-image" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Namakkal Matrimony logo" /><div><h2>Namakkal Matrimony</h2><p>ADMINISTRATION</p></div></div><p className="nav-label">WORKSPACE</p><nav className="sidebar-nav" aria-label="Main navigation">{links.map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === "/"} onClick={onNavigate} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}><Icon /><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><div className="brand-note">Meaningful connections.<br />Thoughtfully managed.</div><button className="sidebar-logout" onClick={logout}><FiLogOut /><span>Sign out</span></button></div></aside>;
}
