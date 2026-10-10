import { useState } from "react";
import { FiEye, FiEdit2, FiTrash2, FiMapPin, FiUser } from "react-icons/fi";
import { useLanguage } from "../Language";
import { memberMediaUrl } from "../services/media";
function MemberCard({ member, onSelect, onEdit, onDelete }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(null);
  const photo = memberMediaUrl(member.image) || memberMediaUrl(member.profilePhotos?.[0]);
  const name = member.name || t("Unnamed member");
  return <article className="member-card" aria-label={name}>
    <div className="member-card-photo">{photo && photo !== failed ? <img src={photo} alt={name} loading="lazy" onError={() => setFailed(photo)} /> : <div className="member-card-placeholder"><FiUser /><span>{t("No photo")}</span></div>}<span className={`badge ${member.isPremium ? "gold" : "neutral"}`}>{t(member.isPremium ? "Premium" : "Standard")}</span></div>
    <div className="member-card-body"><div className="member-card-identity"><h2>{name}</h2><p className="member-card-demographics">{member.age ? `${member.age} ${t("years")}` : t("Not specified")}<span aria-hidden="true"> / </span>{t(member.gender || "Not specified")}</p><dl className="member-card-facts"><div><dt>{t("Email")}</dt><dd>{member.email || t("No email provided")}</dd></div></dl></div><div className="member-card-context"><p className="member-card-location"><FiMapPin aria-hidden="true" /><span>{member.district || member.currentCity || t("Not specified")}</span></p><dl className="member-card-facts"><div><dt>{t("Religion")}</dt><dd>{member.religion || t("Not provided")}</dd></div></dl></div></div>
    <div className="member-card-actions"><button className="button" aria-label={`${t("View")} ${member.name}`} onClick={() => onSelect(member)}><FiEye />{t("View")}</button><div className="row-actions">{member.role !== "admin" && <><button className="icon-button" title={t("Edit member")} aria-label={`${t("Edit member")} ${member.name}`} onClick={() => onEdit(member)}><FiEdit2 /></button><button className="icon-button danger-icon" title={t("Delete member")} aria-label={`${t("Delete member")} ${member.name}`} onClick={() => onDelete(member)}><FiTrash2 /></button></>}</div></div>
  </article>;
}
export default function MemberCards({ members, loading, error, onSelect, onEdit, onDelete }) {
  const { t } = useLanguage();
  if (!members.length) return <div className="empty-state" role="status">{t(loading ? "Loading profiles..." : error ? "Member records are unavailable." : "No members found.")}</div>;
  return <div className="member-card-grid">{members.map(member => <MemberCard key={member._id || member.id} member={member} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />)}</div>;
}
