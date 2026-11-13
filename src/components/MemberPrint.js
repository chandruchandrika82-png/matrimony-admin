import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiPrinter, FiX } from "react-icons/fi";
import { memberGroups } from "./MemberFields";
import { memberMediaUrl } from "../services/media";
import { useLanguage } from "../Language";
import "./MemberPrint.css";

const hidden = value => value === true || value === "true";
export function printValue(member, key, t) {
  if ((key === "mobile" && hidden(member.hideMobile)) ||
      (key === "companyName" && hidden(member.hideCompany)) ||
      (key === "annualIncome" && hidden(member.hideIncome))) return t("Private");
  const value = member[key];
  if (typeof value === "boolean") return t(value ? "Yes" : "No");
  return ["string", "number"].includes(typeof value) && String(value).trim()
    ? String(value) : t("Not provided");
}
function PrintPhoto({ src, label }) {
  const [failed, setFailed] = useState(false);
  return failed ? <p className="print-photo-fallback">{label}</p>
    : <img src={src} alt={label} onError={() => setFailed(true)} />;
}
export default function MemberPrint({ member, close }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const [preparing, setPreparing] = useState(false);
  const permitted = !hidden(member.hidePhotos);
  const photos = permitted ? [...new Set([member.image, ...["profilePhotos", "familyPhotos", "officePhotos"]
    .flatMap(key => Array.isArray(member[key]) ? member[key] : [])].map(memberMediaUrl).filter(Boolean))] : [];
  async function print() {
    if (!localStorage.getItem("adminToken") || busy.current) return;
    busy.current = true; setPreparing(true);
    // Print only after local fonts and permitted images settle; broken images
    // get their normal fallback. A bounded wait also handles an offline image.
    const images = [...(ref.current?.querySelectorAll("img") || [])];
    let timer;
    await Promise.race([
      Promise.all([document.fonts?.ready, ...images.map(image => image.complete ? Promise.resolve() :
        new Promise(resolve => { image.addEventListener("load", resolve, { once: true }); image.addEventListener("error", resolve, { once: true }); }))]),
      new Promise(resolve => { timer = setTimeout(resolve, 4000); }),
    ]);
    clearTimeout(timer);
    if (mounted.current && localStorage.getItem("adminToken")) window.print();
    if (mounted.current) setPreparing(false);
    busy.current = false;
  }
  useEffect(() => {
    if (!ref.current || !localStorage.getItem("adminToken")) return;
    mounted.current = true;
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    document.body.classList.add("member-print-active");
    return () => { mounted.current = false; document.body.classList.remove("member-print-active"); previous?.focus(); };
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("adminToken")) close();
  }, [close]);
  function section([title, fields]) {
    return <section className="member-print-section" key={title}><h3>{t(title)}</h3><dl>
      {fields.map(([key, label]) => <div className="member-print-field" key={key}><dt>{t(label)}</dt><dd>{printValue(member, key, t)}</dd></div>)}
    </dl></section>;
  }
  if (!localStorage.getItem("adminToken")) return null;
  return createPortal(<dialog ref={ref} className="member-print-dialog" aria-label={t("Print profile")}
    onCancel={event => { event.preventDefault(); close(); }}>
    <div className="member-print-toolbar"><button className="button primary" onClick={print} disabled={preparing}><FiPrinter />{t(preparing ? "Preparing print..." : "Print / Save as PDF")}</button>
      <button className="button" onClick={close}><FiX />{t("Close")}</button></div>
    <article className="member-print-document" aria-label={t("Member profile")}>
      <header className="member-print-brand"><img src={`${process.env.PUBLIC_URL || ""}/logo.png`} alt="New Varan Kongu Thirumana Matrimony logo" />
        <div className="member-print-company"><h1>New Varan Kongu Thirumana Matrimony</h1><p>Namakkal</p><p>Phone: 9344973982</p><p className="member-print-document-label">{t("Member profile")}</p></div></header>
      <div className="member-print-meta"><span>{t("Member profile")}</span><span>{t("Report date")}: {new Date().toLocaleDateString()}</span></div>
      <div className="member-print-intro"><div><h2>{member.name || t("Unnamed member")}</h2>
        <p>{[member.age !== null && member.age !== undefined && member.age !== "" ? `${member.age} ${t("years")}` : null, member.gender, member.currentCity || member.district].filter(Boolean).join(" · ") || t("Not provided")}</p></div>
        {photos.length ? <PrintPhoto src={photos[0]} label={t("Main photo")} /> : <p className="print-photo-fallback">{t(permitted ? "No photo" : "Private")}</p>}</div>
      {[memberGroups.slice(0, 5), memberGroups.slice(5)].map((groups, page) => <div className={`member-print-page ${page ? "member-print-page-two" : ""}`} key={page}>
        <div className={page === 0 ? "member-print-columns member-print-first-page-columns" : "member-print-columns"}>
          {page === 0 ? [[groups[0], groups[1], groups[3]], [groups[2], groups[4]]].map((column, index) =>
            <div className="member-print-column" data-print-column={index === 0 ? "personal-family" : "career-religion"} key={index}>{column.map(section)}</div>)
            : groups.map(section)}
        </div>
      </div>)}
      {photos.length > 1 && <section className="member-print-section"><h3>{t("Photos and documents")}</h3><div className="member-print-gallery">{photos.slice(1).map((url, index) => <PrintPhoto key={url} src={url} label={`${t("Profile")} ${index + 1}`} />)}</div></section>}
      {member.horoscopeFile && <section className="member-print-section"><h3>{t("Horoscope file")}</h3><p>{t("Available")}</p></section>}
    </article>
  </dialog>, document.body);
}

