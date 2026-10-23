import { FiSearch, FiX } from "react-icons/fi";
import { useLanguage } from "../Language";
import "./MemberSearch.css";

export default function MemberSearch({ value, onChange, label = "Search members" }) {
  const { t } = useLanguage();
  return <div className="member-search-field"><label><span className="member-search-label">{t(label)}</span><span className="search-input"><FiSearch aria-hidden="true" /><input type="text" aria-label={t(label)} placeholder={t("Search name, email, district or age")} value={value} onChange={event => onChange(event.target.value)} /></span></label>{value && <button type="button" className="member-search-clear" title={t("Clear search")} aria-label={t("Clear search")} onClick={() => onChange("")}><FiX aria-hidden="true" /></button>}</div>;
}
