import { NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiUsers, FiStar, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
import "../styles/sidebar.css";
import { useLanguage } from "../Language";
export default function Sidebar({ onNavigate }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const links = [["/", "Overview", FiGrid], ["/members", "Members", FiUsers], ["/premium", "Premium", FiStar], ["/reports", "Reports", FiBarChart2], ["/settings", "Settings", FiSettings]];
  function logout() { ["adminToken", "adminUser", "admin"].forEach(key => localStorage.removeItem(key)); navigate("/login", { replace: true }); }
  return <aside className="admin-sidebar"><div className="sidebar-brand"><img className="brand-image" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Namakkal Matrimony logo" /><div><h2>{t("Namakkal Matrimony")}</h2><p>{t("ADMINISTRATION")}</p></div></div><p className="nav-label">{t("WORKSPACE")}</p><nav className="sidebar-nav" aria-label={t("Main navigation")}>{links.map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === "/"} onClick={onNavigate} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}><Icon /><span>{t(label)}</span></NavLink>)}</nav><div className="sidebar-bottom"><div className="brand-note">{t("Meaningful connections.")}<br />{t("Thoughtfully managed.")}</div><button className="sidebar-logout" onClick={logout}><FiLogOut /><span>{t("Sign out")}</span></button></div></aside>;
}
