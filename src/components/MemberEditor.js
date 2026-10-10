import { useEffect, useRef, useState } from "react";
import { FiSave, FiX, FiTrash2, FiExternalLink } from "react-icons/fi";
import api from "../services/api";
import { useLanguage } from "../Language";
import { memberGroups, memberUploads, initialMemberForm } from "./MemberFields";
export function Modal({ title, close, busy, children, wide = false, fixedHeader = false }) {
  const ref = useRef(null); const { t } = useLanguage();
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={ref} className={`profile-dialog ${wide ? "member-editor" : ""} ${fixedHeader ? "fixed-header-dialog" : ""}`} aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) close(); }}><div className="section-heading"><h2>{title}</h2><button type="button" className="icon-button" disabled={busy} title={t("Close")} aria-label={t("Close")} onClick={close}><FiX /></button></div>{fixedHeader ? <div className="dialog-scroll-body">{children}</div> : children}</dialog>;
}
export default function MemberEditor({ member, close, complete }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => initialMemberForm(member));
  const [files, setFiles] = useState({});
  const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  function change(key, value) { setForm(current => ({ ...current, [key]: value })); }
  async function save(e) {
    e.preventDefault(); if (busy) return;
    if (member && changePassword && password !== confirmPassword) { setError("Passwords do not match"); return; }
    setBusy(true); setError("");
    try {
      let data = { ...form, ...(!member || changePassword ? { password } : {}) };
      if (Object.values(files).some(list => list.length)) {
        const multipart = new FormData();
        Object.entries(data).forEach(([key, value]) => multipart.append(key, value));
        Object.entries(files).forEach(([key, list]) => list.forEach(file => multipart.append(key, file)));
        data = multipart;
      }
      if (member) await api.put(`/admin/members/${member._id}`, data);
      else await api.post("/admin/members", data);
      complete(member ? "Member updated." : "Member added.");
    } catch (err) { setError(typeof err.response?.data?.error === "string" ? err.response.data.error : "Unable to save member. Please try again."); }
    finally { setBusy(false); }
  }
  return <Modal title={t(member ? "Edit member" : "Add member")} close={close} busy={busy} wide fixedHeader><form onSubmit={save}>{error && <p className="notice error" role="alert">{t(error)}</p>}<fieldset disabled={busy} className="editor-fields">
    {memberGroups.map(([title, fields]) => <section className="editor-section" key={title}><h3>{t(title)}</h3><div className="editor-grid">{fields.map(([key, label, type = "text", required]) => {
      if (key.startsWith("job") && !["Job", "Both", "Private Job", "Government Job", "Professional", "Self Employed"].includes(form.occupationType)) return null;
      const ageField = ["age", "preferredAgeFrom", "preferredAgeTo"].includes(key);
      return <label key={key} className={type === "checkbox" ? "check-field" : `field ${type === "textarea" ? "full-width" : ""}`}>{type !== "checkbox" && t(label)}
        {Array.isArray(type) ? <select value={form[key]} onChange={e => change(key, e.target.value)}><option value="">{t("Select")}</option>{!type.includes(form[key]) && form[key] && <option value={form[key]}>{form[key]}</option>}{type.map(value => <option key={value} value={value}>{t(value)}</option>)}</select>
          : type === "checkbox" ? <><input type="checkbox" checked={!!form[key]} onChange={e => change(key, e.target.checked)} />{t(label)}</>
          : type === "textarea" ? <textarea rows="3" value={form[key]} onChange={e => change(key, e.target.value)} />
          : <input step={key === "jobExperience" ? "any" : undefined} type={type} required={required} min={type === "number" ? ageField ? 18 : 0 : undefined} max={type === "number" && ageField ? 100 : undefined} maxLength={type !== "number" ? 500 : undefined} value={form[key]} onChange={e => change(key, e.target.value)} />}
      </label>;
    })}</div></section>)}
    <section className="editor-section"><h3>{t("Photos and documents")}</h3><div className="editor-grid">{memberUploads.map(([key, label, multiple]) => <div className="upload-field" key={key}><label className="field">{t(label)}<input type="file" multiple={multiple} accept={key === "horoscopeFile" ? ".pdf,.jpg,.jpeg,.png,.webp" : ".jpg,.jpeg,.png,.webp"} onChange={e => {
      const chosen = Array.from(e.target.files || []);
      if (chosen.length > (multiple ? 10 : 1) || chosen.some(file => file.size > 10 * 1024 * 1024)) {
        setError("Each file must be 10 MB or smaller, with at most 10 photos per category."); setFiles(current => ({ ...current, [key]: [] })); e.target.value = ""; return;
      }
      setError(""); setFiles(current => ({ ...current, [key]: chosen }));
    }} /></label>{member?.[key] && <div className="existing-uploads">{(Array.isArray(member[key]) ? member[key] : [member[key]]).filter(url => /^https?:\/\//i.test(url)).map((url, index) => <a key={url + index} href={url} target="_blank" rel="noopener noreferrer" title={t(label)}>{key === "horoscopeFile" ? <><FiExternalLink />{t("Horoscope file")}</> : <img src={url} alt={`${t(label)} ${index + 1}`} />}</a>)}</div>}</div>)}</div></section>
    {!member && <label className="field">{t("Password")}<input type="password" autoComplete="new-password" required minLength="8" value={password} onChange={e => setPassword(e.target.value)} /></label>}
    {member && <section className="editor-section"><label className="check-field"><input type="checkbox" checked={changePassword} onChange={e => { setChangePassword(e.target.checked); setPassword(""); setConfirmPassword(""); setError(""); }} />{t("Change password")}</label>{changePassword && <div className="editor-grid password-change-fields"><label className="field">{t("New password")}<input type="password" autoComplete="new-password" required minLength="8" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="field">{t("Confirm password")}<input type="password" autoComplete="new-password" required minLength="8" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label></div>}</section>}
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
