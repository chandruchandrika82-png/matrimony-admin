import { FiExternalLink } from "react-icons/fi";
import { memberGroups } from "./MemberFields";
import { useLanguage } from "../Language";
import { API_URL } from "../services/api";
function mediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, new URL(API_URL).origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
export default function MemberProfile({ member }) {
  const { t } = useLanguage();
  function display(value) {
    if (typeof value === "boolean") return t(value ? "Yes" : "No");
    return value === undefined || value === null || value === "" ? t("Not provided") : t(String(value));
  }
  const image = mediaUrl(member.image);
  const horoscope = mediaUrl(member.horoscopeFile);
  return <div className="member-profile-view">
    {image && <img className="member-main-photo" src={image} alt={member.name || t("Main photo")} />}
    {memberGroups.map(([title, fields]) => <section className="member-detail-section" key={title}><h3>{t(title)}</h3><dl className="member-detail-grid">{fields.map(([key, label]) => <div key={key}><dt>{t(label)}</dt><dd>{display(member[key])}</dd></div>)}</dl></section>)}
    <section className="member-detail-section"><h3>{t("Photos and documents")}</h3>{[["profilePhotos", "Profile photos"], ["familyPhotos", "Family photos"], ["officePhotos", "Office photos"]].map(([key, label]) => {
      const photos = (Array.isArray(member[key]) ? member[key] : []).map(mediaUrl).filter(Boolean);
      return <div className="member-photo-group" key={key}><h4>{t(label)}</h4>{photos.length ? <div className="member-photo-grid">{photos.map((url, index) => <a key={url + index} href={url} target="_blank" rel="noopener noreferrer" title={t(label)}><img src={url} alt={`${t(label)} ${index + 1}`} loading="lazy" /></a>)}</div> : <p className="muted">{t("Not provided")}</p>}</div>;
    })}<h4>{t("Horoscope file")}</h4>{horoscope ? <a className="text-link" href={horoscope} target="_blank" rel="noopener noreferrer"><FiExternalLink />{t("Horoscope file")}</a> : <p className="muted">{t("Not provided")}</p>}</section>
  </div>;
}
