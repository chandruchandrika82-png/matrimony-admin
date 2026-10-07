import { FiDownload } from "react-icons/fi";
import { useMembers, DataNotice } from "../components/MemberData";
import { exportMembers } from "../services/export";
import { useLanguage } from "../Language";
export default function Reports() {
  const { t } = useLanguage();
  const { members, loading, error } = useMembers();
  const locations = Object.entries(members.reduce((acc, m) => { const key = m.district || "Not specified"; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  return <><div className="page-heading"><div><p className="eyebrow">{t("INSIGHTS")}</p><h1>{t("Reports")}</h1><p className="muted">{t("Membership distribution across your community.")}</p></div><button className="button primary" disabled={loading || !!error || !members.length} onClick={() => exportMembers(members)}><FiDownload />{t("Export members")}</button></div><DataNotice /><section className="panel"><div className="section-heading"><h2>{t("Members by district")}</h2><span className="badge neutral">{locations.length}{t("districts")}</span></div><div className="table-scroll"><table><thead><tr><th>{t("District")}</th><th>{t("Members")}</th><th>{t("Share of community")}</th></tr></thead><tbody>{locations.map(([district, count]) => <tr key={district}><td>{t(district)}</td><td>{count}</td><td><div className="report-share"><progress value={count} max={members.length || 1} /><span>{Math.round(count / members.length * 100)}%</span></div></td></tr>)}{!locations.length && <tr><td colSpan="3" className="empty-state">{loading ? t("Loading report...") : error ? t("Report data is unavailable.") : t("No member data available yet.")}</td></tr>}</tbody></table></div></section></>;
}
