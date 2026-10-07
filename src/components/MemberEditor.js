import { useEffect, useRef, useState } from "react";
import { FiSave, FiX, FiTrash2 } from "react-icons/fi";
import api from "../services/api";
import { useLanguage } from "../Language";
const groups = [
  ["Basic information", [["name", "Name", "text", true], ["email", "Email", "email", true], ["mobile", "Mobile", "tel"], ["age", "Age", "number"], ["gender", "Gender", "gender"], ["dob", "Date of birth", "date"]]],
  ["Location and contact", [["nativePlace", "Native place"], ["currentCity", "Current city"], ["district", "District"], ["state", "State"], ["country", "Country"], ["address", "Address", "textarea"]]],
  ["Personal details", [["height", "Height"], ["weight", "Weight"], ["maritalStatus", "Marital status"], ["religion", "Religion"], ["caste", "Caste"], ["subCaste", "Subcaste"], ["motherTongue", "Mother tongue"], ["star", "Star"], ["rashi", "Rashi"]]],
  ["Career and family", [["education", "Education"], ["occupationType", "Occupation"], ["companyName", "Company"], ["annualIncome", "Annual income"], ["fatherName", "Father name"], ["motherName", "Mother name"], ["expectations", "Expectations", "textarea"]]],
];
export function Modal({ title, close, busy, children, wide = false }) {
  const ref = useRef(null); const { t } = useLanguage();
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={ref} className={`profile-dialog ${wide ? "member-editor" : ""}`} aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) close(); }}><div className="section-heading"><h2>{title}</h2><button type="button" className="icon-button" disabled={busy} title={t("Close")} aria-label={t("Close")} onClick={close}><FiX /></button></div>{children}</dialog>;
}
export default function MemberEditor({ member, close, complete }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => Object.fromEntries(groups.flatMap(([, fields]) => fields.map(([key]) => [key, member?.[key] ?? ""]))));
  const [premium, setPremium] = useState(!!member?.isPremium); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  function change(key, value) { setForm(current => ({ ...current, [key]: value })); }
  async function save(e) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const data = { ...form, isPremium: premium };
      if (member) await api.put(`/admin/members/${member._id}`, data);
      else await api.post("/admin/members", { ...data, password });
      complete(member ? "Member updated." : "Member added.");
    } catch (err) { setError(typeof err.response?.data?.error === "string" ? err.response.data.error : "Unable to save member. Please try again."); }
    finally { setBusy(false); }
  }
  return <Modal title={t(member ? "Edit member" : "Add member")} close={close} busy={busy} wide><form onSubmit={save}>{error && <p className="notice error" role="alert">{t(error)}</p>}<fieldset disabled={busy} className="editor-fields">
    {groups.map(([title, fields]) => <section className="editor-section" key={title}><h3>{t(title)}</h3><div className="editor-grid">{fields.map(([key, label, type = "text", required]) => <label key={key} className={`field ${type === "textarea" ? "full-width" : ""}`}>{t(label)}{type === "gender" ? <select value={form[key]} onChange={e => change(key, e.target.value)}><option value="">{t("Select gender")}</option>{["Male", "Female", "Other"].map(value => <option key={value} value={value}>{t(value)}</option>)}</select> : type === "textarea" ? <textarea rows="3" value={form[key]} onChange={e => change(key, e.target.value)} /> : <input type={type} required={required} min={type === "number" ? 18 : undefined} max={type === "number" ? 100 : undefined} maxLength={type !== "number" ? 500 : undefined} value={form[key]} onChange={e => change(key, e.target.value)} />}</label>)}</div></section>)}
    {!member && <label className="field">{t("Password")}<input type="password" autoComplete="new-password" required minLength="8" value={password} onChange={e => setPassword(e.target.value)} /></label>}<label className="check-field"><input type="checkbox" checked={premium} onChange={e => setPremium(e.target.checked)} />{t("Premium membership")}</label>
    </fieldset><div className="dialog-actions"><button type="button" className="button" disabled={busy} onClick={close}>{t("Cancel")}</button><button className="button primary" disabled={busy}><FiSave />{t(busy ? "Saving..." : "Save member")}</button></div></form></Modal>;
}
export function DeleteMember({ member, close, complete }) {
  const { t } = useLanguage(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function remove() {
    if (busy) return; setBusy(true); setError("");
    try { await api.delete(`/admin/members/${member._id}`); complete("Member deleted."); }
    catch (err) { setError(typeof err.response?.data?.error === "string" ? err.response.data.error : "Unable to delete member. Please try again."); }
    finally { setBusy(false); }
  }
  return <Modal title={t("Delete member")} close={close} busy={busy}><strong>{member.name}</strong><p className="muted">{member.email}</p><p>{t("This permanently deletes the member account and its messages.")}</p>{error && <p className="notice error" role="alert">{t(error)}</p>}<div className="dialog-actions"><button className="button" autoFocus disabled={busy} onClick={close}>{t("Cancel")}</button><button className="button danger" disabled={busy} onClick={remove}><FiTrash2 />{t(busy ? "Deleting..." : "Delete member")}</button></div></Modal>;
}
