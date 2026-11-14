import { useState } from "react";
import { FiSave } from "react-icons/fi";
import { useLanguage, LanguageSelect } from "../Language";
import { getCompanySettings, saveCompanySettings } from "../services/companySettings";
import "./Settings.css";

export default function Settings() {
  const { t } = useLanguage();
  const [name, setName] = useState(localStorage.getItem("adminDisplayName") || "Administrator");
  const [company, setCompany] = useState(getCompanySettings);
  const [saved, setSaved] = useState("");
  function save(e) { e.preventDefault(); try { localStorage.setItem("adminDisplayName", name.trim() || "Administrator"); saveCompanySettings(company); setSaved("Preferences saved in this browser."); } catch { setSaved("Unable to save preferences in this browser."); } }
  function changeCompany(key, value) { setCompany(current => ({ ...current, [key]: value })); setSaved(""); }
  function chooseLogo(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => changeCompany("logo", reader.result); reader.readAsDataURL(file); }
  return <><div className="page-heading"><div><p className="eyebrow">{t("WORKSPACE")}</p><h1>{t("Settings")}</h1><p className="muted">{t("Manage your local administration preferences.")}</p></div></div><section className="panel settings-panel"><h2>{t("Administrator preferences")}</h2><form onSubmit={save}><label className="field">{t("Language")}<LanguageSelect /></label><label className="field">{t("Display name")}<input required maxLength="60" value={name} onChange={e => { setName(e.target.value); setSaved(""); }} /></label><h2 className="settings-subheading">Company print details</h2><div className="settings-company-grid"><label className="field">Company name<input maxLength="120" value={company.name} onChange={e => changeCompany("name", e.target.value)} /></label><label className="field">Address<input maxLength="160" value={company.address} onChange={e => changeCompany("address", e.target.value)} /></label><label className="field">Phone number<input maxLength="30" value={company.phone} onChange={e => changeCompany("phone", e.target.value)} /></label><label className="field">Website<input maxLength="120" value={company.website} onChange={e => changeCompany("website", e.target.value)} /></label><label className="field">Company logo<input type="file" accept="image/*" onChange={chooseLogo} />{company.logo && <img className="settings-logo-preview" src={company.logo} alt="Company logo preview" />}</label></div><button className="button primary" type="submit"><FiSave />{t("Save preferences")}</button>{saved && <p role="status" className="muted">{t(saved)}</p>}</form></section></>;
}
