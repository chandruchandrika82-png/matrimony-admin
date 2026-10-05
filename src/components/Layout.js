import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiShield } from "react-icons/fi";
import Sidebar from "./Sidebar";
import BackButton from "./BackButton";
import { MemberProvider } from "./MemberData";
function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  if (!localStorage.getItem("adminToken")) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  const page = { "/": "Overview", "/members": "Members", "/premium": "Premium", "/reports": "Reports", "/settings": "Settings" }[location.pathname] || "Admin";
  return <MemberProvider><div className={`admin-layout ${open ? "nav-open" : ""}`}>
    {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <Sidebar onNavigate={() => setOpen(false)} />
    <div className="workspace"><header className="topbar"><button className="icon-button menu-toggle" title="Toggle navigation" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <FiX /> : <FiMenu />}</button><div className="breadcrumb">Administration <span>/</span> <strong>{page}</strong></div><div className="admin-identity"><FiShield /><span>{localStorage.getItem("adminDisplayName") || "Administrator"}</span><div className="avatar">AD</div></div></header><main className="admin-content"><BackButton />{children}</main><footer className="footer">Namakkal Matrimony <span>Administration workspace</span></footer></div>
  </div></MemberProvider>;
}
export default Layout;
