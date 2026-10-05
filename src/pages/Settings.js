import { useState } from "react";
import { FiSave } from "react-icons/fi";
import { API_URL } from "../services/api";
export default function Settings() {
  const [name, setName] = useState(localStorage.getItem("adminDisplayName") || "Administrator"); const [saved, setSaved] = useState("");
  function save(e) { e.preventDefault(); if (!name.trim()) return; try { localStorage.setItem("adminDisplayName", name.trim()); setSaved("Preferences saved in this browser."); } catch { setSaved("Unable to save preferences in this browser."); } }
  return <><div className="page-heading"><div><p className="eyebrow">WORKSPACE</p><h1>Settings</h1><p className="muted">Manage your local administration preferences.</p></div></div><section className="panel settings-panel"><h2>Administrator preferences</h2><form onSubmit={save}><label className="field">Display name<input required maxLength="60" value={name} onChange={e => { setName(e.target.value); setSaved(""); }} /></label><button className="button primary" type="submit"><FiSave />Save preferences</button>{saved && <p role="status" className="muted">{saved}</p>}</form></section><section className="panel settings-panel"><h2>Backend connection</h2><label className="field">API endpoint<input value={API_URL} readOnly /></label><p className="muted">This connection is configured for the application deployment.</p></section></>;
}
