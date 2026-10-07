import { useState } from "react";
import { FiSave } from "react-icons/fi";
import { useLanguage, LanguageSelect } from "../Language";
export default function Settings() {
  const { t } = useLanguage();
  const [name, setName] = useState(localStorage.getItem("adminDisplayName") || "Administrator"); const [saved, setSaved] = useState("");
  function save(e) { e.preventDefault(); if (!name.trim()) return; try { localStorage.setItem("adminDisplayName", name.trim()); setSaved("Preferences saved in this browser."); } catch { setSaved("Unable to save preferences in this browser."); } }
  return <><div className="page-heading"><div><p className="eyebrow">{t("WORKSPACE")}</p><h1>{t("Settings")}</h1><p className="muted">{t("Manage your local administration preferences.")}</p></div></div><section className="panel settings-panel"><h2>{t("Administrator preferences")}</h2><form onSubmit={save}><label className="field">{t("Language")}<LanguageSelect /></label><label className="field">{t("Display name")}<input required maxLength="60" value={name} onChange={e => { setName(e.target.value); setSaved(""); }} /></label><button className="button primary" type="submit"><FiSave />{t("Save preferences")}</button>{saved && <p role="status" className="muted">{t(saved)}</p>}</form></section><section className="panel settings-panel"><h2>{t("Backend connection")}</h2><label className="field">{t("API endpoint")}<input value="" readOnly /></label><p className="muted">{t("This connection is configured for the application deployment.")}</p></section></>;
}
