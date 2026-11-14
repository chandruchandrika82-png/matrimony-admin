import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiPrinter, FiX } from "react-icons/fi";
import { memberMediaUrl } from "../services/media";
import { useLanguage } from "../Language";
import "./MemberPrint.css";
import { getCompanySettings } from "../services/companySettings";

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
function HoroscopeChart({ title, member, navamsa = false }) {
  const { t } = useLanguage();
  const cells = navamsa
    ? ["", member.rashi || "Rasi", "Sani", "Kethu", "Sukra", "Lagna", "", "Chandra", "Guru", "", "Rahu", "Surya"]
    : ["", member.rashi || "Rasi", "Kethu", "Guru", "Chandra", "Lagna", "", "Sukra", "Sani", "", "Rahu", "Surya"];
  return <section className="member-print-chart"><h4>{t(title)}</h4><div className="member-print-chart-grid">{cells.map((cell, index) => <span key={`${title}-${index}`}>{cell ? t(String(cell)) : ""}</span>)}<strong>{t(String(member.rashi || "Rasi"))}</strong></div></section>;
}
function valueOf(member, keys) {
  if (keys.some(key => ["annualIncome", "personalIncome"].includes(key)) && hidden(member.hideIncome)) return "";
  if (keys.includes("companyName") && hidden(member.hideCompany)) return "";
  for (const key of keys) {
    if (key.startsWith("_") || member?.[key] === undefined || member?.[key] === null) continue;
    if (String(member[key]).trim()) return member[key];
  }
  if (keys.includes("_heightWeight")) return [member.height, member.weight].filter(Boolean).join(" / ");
  if (keys.includes("_siblings")) return `Male: ${member.brothersCount || 0} (${member.brothersMarried || 0} married); Female: ${member.sistersCount || 0} (${member.sistersMarried || 0} married)`;
  if (keys.includes("_property")) return [member.landAcres && `Land: ${member.landAcres}`, member.house, member.vehicle, member.otherAssets].filter(Boolean).join(", ");
  return "";
}
export default function MemberPrint({ member, close }) {
  const { t } = useLanguage();
  const company = getCompanySettings();
  const ref = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const [preparing, setPreparing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [applyingDate, setApplyingDate] = useState(member.applyingDate || today);
  const [expiryDate, setExpiryDate] = useState(member.reportExpiryDate || `${new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)}`);
  const profileNumber = String([...String(member._id || member.id || member.email || member.name || "profile")].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 100000, 0)).padStart(5, "0");
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
  function section(title, fields) {
    return <section className="member-print-section" key={title}><h3>{t(title)}</h3><dl>
      {fields.map(([label, keys]) => <div className="member-print-field" key={label}><dt>{t(label)}</dt><dd>{valueOf(member, keys) ? t(String(valueOf(member, keys))) : t("Not provided")}</dd></div>)}
    </dl></section>;
  }
  if (!localStorage.getItem("adminToken")) return null;
  return createPortal(<dialog ref={ref} className="member-print-dialog" aria-label={t("Print profile")}
    onCancel={event => { event.preventDefault(); close(); }}>
    <div className="member-print-toolbar"><div className="member-print-date-controls"><label>{t("Applying date")}<input type="date" value={applyingDate} onChange={event => setApplyingDate(event.target.value)} /></label><label>{t("Report expiry date")}<input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} /></label></div><button className="button primary" onClick={print} disabled={preparing}><FiPrinter />{t(preparing ? "Preparing print..." : "Print / Save as PDF")}</button>
      <button className="button" onClick={close}><FiX />{t("Close")}</button></div>
    <article className="member-print-document" aria-label={t("Member profile")}>
      <header className="member-print-brand"><img src={company.logo || `${process.env.PUBLIC_URL || ""}/logo.png`} alt={`${company.name} logo`} />
        <div className="member-print-company"><h1>{company.name}</h1><p>{company.address}</p><p>Phone: {company.phone}</p><p>{company.website}</p><p className="member-print-document-label">{t("Member profile")}</p></div></header>
      <div className="member-print-meta"><span>{t("Profile ID")}: NM-{profileNumber}</span><span>{t("Applying date")}: {applyingDate}</span><span>{t("Report expiry date")}: {expiryDate}</span></div>
      <div className="member-print-intro"><div><h2>{member.name || t("Unnamed member")}</h2>
        <p>{[member.age !== null && member.age !== undefined && member.age !== "" ? `${member.age} ${t("years")}` : null, member.gender ? t(member.gender) : null, member.currentCity || member.district].filter(Boolean).join(" · ") || t("Not provided")}</p></div>
        {photos.length ? <PrintPhoto src={photos[0]} label={t("Main photo")} /> : <p className="print-photo-fallback">{t(permitted ? "No photo" : "Private")}</p>}</div>
      <div className="member-print-page"><div className="member-print-columns member-print-first-page-columns">
        <div className="member-print-column" data-print-column="personal-family">
          {section("Profile details", [["Name", ["name"]], ["Gender", ["gender"]], ["Age", ["age"]], ["Birth date", ["dob"]], ["Birth time", ["birthTime"]], ["Birth place", ["birthPlace"]], ["Height & weight", ["_heightWeight"]], ["Colour", ["colour", "color", "complexion"]], ["Blood group", ["bloodGroup"]], ["Personal income", ["personalIncome", "annualIncome"]]])}
          {section("Family details", [["Degree", ["education"]], ["Business / work", ["occupationType", "companyName"]], ["Father name", ["fatherName"]], ["Father business", ["fatherOccupation"]], ["Father native", ["fatherNative"]], ["Mother name", ["motherName"]], ["Mother business", ["motherOccupation"]], ["Mother native", ["motherNative"]], ["Family income", ["familyIncome"]], ["Siblings", ["_siblings"]], ["Property details", ["_property"]], ["Expectations", ["expectations"]]])}
        </div>
        <div className="member-print-column" data-print-column="career-religion">
          {section("Kulam details", [["Kulam", ["kulam", "caste", "subCaste"]], ["Kulam God", ["kulamGod", "kuladeivam"]]])}
          {section("Horoscope", [["Lagna", ["lagnam"]], ["Rasi", ["rashi", "zodiac"]], ["Nakshatra", ["star"]], ["Tamil date", ["tamilDate"]]])}
        </div>
      </div></div>
      <section className="horoscope-section"><div className="member-print-section member-print-box"><h3>{t("Jathagam")}</h3></div><div className="rasi-navamsa-section"><div className="member-print-charts"><HoroscopeChart title="Rasi chart" member={member} /><HoroscopeChart title="Navamsa chart" member={member} navamsa /></div></div></section>
    </article>
  </dialog>, document.body);
}

