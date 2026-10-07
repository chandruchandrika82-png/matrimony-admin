import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiArrowRight, FiLock } from "react-icons/fi";
import api from "../services/api";
import "./AdminLogin.css";
import { useLanguage, LanguageSelect } from "../Language";
export default function AdminLogin() {
  const { t } = useLanguage();
  const navigate = useNavigate(); const location = useLocation();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  if (localStorage.getItem("adminToken")) return <Navigate to="/" replace />;
  async function login(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email: email.trim(), password });
      if (!data.token) throw new Error("Missing session token");
      localStorage.setItem("adminUser", JSON.stringify(data.user || {})); localStorage.setItem("adminToken", data.token);
      const from = location.state?.from; navigate(["/", "/members", "/premium", "/reports", "/settings"].includes(from) ? from : "/", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setError(status === 404 ? "The admin login endpoint is unavailable on this backend."
        : !err.response ? "Cannot reach the backend. Check that the server is running and try again."
        : err.response?.data?.error || err.response?.data?.message || "Unable to sign in. Check your credentials and try again.");
    }
    finally { setLoading(false); }
  }
  return <main className="admin-login-page"><div className="login-language"><LanguageSelect /></div><div className="login-brand"><img className="brand-image" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Namakkal Matrimony logo" /><span>{t("Namakkal Matrimony")}</span></div><section className="admin-login-card"><div className="login-lock"><FiLock /></div><p className="eyebrow">{t("ADMINISTRATION")}</p><h1>{t("Welcome back")}</h1><p className="muted">{t("Sign in to your Namakkal Matrimony workspace.")}</p><form onSubmit={login}>{error && <div className="notice error" role="alert">{t(error)}</div>}<label className="field">{t("Email address")}<input type="email" autoComplete="username" placeholder={t("admin@example.com")} required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field">{t("Password")}<div className="password-input"><input type={show ? "text" : "password"} autoComplete="current-password" placeholder={t("Enter your password")} required value={password} onChange={e => setPassword(e.target.value)} /><button type="button" className="icon-button" title={show ? t("Hide password") : t("Show password")} aria-label={show ? t("Hide password") : t("Show password")} onClick={() => setShow(!show)}>{show ? <FiEyeOff /> : <FiEye />}</button></div></label><button className="button primary login-submit" disabled={loading}>{loading ? t("Signing in...") : t("Sign in")}<FiArrowRight /></button></form></section><p className="login-footer">{t("Namakkal Matrimony Administration")}</p></main>;
}
