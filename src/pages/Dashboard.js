import { Link } from "react-router-dom";
import { useState } from "react";
import { FiUsers, FiStar, FiUserCheck, FiMapPin, FiArrowUpRight, FiRefreshCw, FiBarChart2, FiArrowRight } from "react-icons/fi";
import { useMembers, DataNotice } from "../components/MemberData";
import MemberTable from "../components/MemberTable";
import { useLanguage } from "../Language";
import "./Dashboard.css";
import MemberSearch from "../components/MemberSearch";
import { matchesMemberSearch } from "../services/memberSearch";

export default function Dashboard() {
  const { t } = useLanguage();
  const { members, loading, error, refresh } = useMembers();
  const [query, setQuery] = useState("");
  const unavailable = loading || Boolean(error);
  const premium = members.filter(member => member.isPremium).length;
  const percentage = members.length ? Math.round(premium / members.length * 100) : 0;
  const stats = [["Total members", members.length, FiUsers, "rose"], ["Premium members", premium, FiStar, "gold"], ["Standard members", members.length - premium, FiUserCheck, "green"], ["Districts represented", new Set(members.map(member => member.district).filter(Boolean)).size, FiMapPin, "blue"]];
  const matches = members.filter(member => matchesMemberSearch(member, query)).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  const latest = matches.slice(0, 5);
  return <div className="admin-overview">
    <header className="page-heading overview-heading"><div><p className="eyebrow">{t("NEW VARAN KONGU THIRUMANA MATRIMONY")}</p><h1>{t("Overview")}</h1><p className="muted">{t("Your community, at a glance.")}</p></div><div className="heading-actions"><button type="button" className="icon-button overview-refresh" disabled={loading} onClick={refresh} title={t("Refresh members")} aria-label={t("Refresh members")}><FiRefreshCw /></button><Link className="button primary" to="/members"><FiUsers />{t("View members")}</Link></div></header>
    <DataNotice />
    <div className="stats-grid overview-stats">{stats.map(([title, value, Icon, color]) => <article className={`stat overview-stat accent-${color}`} key={title}><div className={`stat-icon ${color}`}><Icon aria-hidden="true" /></div><span>{t(title)}</span><strong>{unavailable ? "--" : value.toLocaleString()}</strong><small>{t("Current member records")}</small></article>)}</div>
    <nav className="overview-shortcuts" aria-label={t("Workspace shortcuts")}><span>{t("Workspace shortcuts")}</span><Link to="/members"><FiUsers aria-hidden="true" />{t("Member directory")}<FiArrowRight aria-hidden="true" /></Link><Link to="/premium"><FiStar aria-hidden="true" />{t("Premium members")}<FiArrowRight aria-hidden="true" /></Link><Link to="/reports"><FiBarChart2 aria-hidden="true" />{t("Reports")}<FiArrowRight aria-hidden="true" /></Link></nav>
    <div className="overview-insights"><section className="overview-membership"><div className="section-heading"><div><p className="overview-section-label">{t("Membership")}</p><h2>{t("Membership mix")}</h2></div><FiStar aria-hidden="true" /></div><div className="overview-membership-content"><div className="overview-donut" role="img" aria-label={unavailable ? t("Member records are unavailable.") : `${t("Premium")}: ${percentage}%`} style={{ '--premium-share': `${unavailable ? 0 : percentage}%` }}><div><strong>{unavailable ? '--' : `${percentage}%`}</strong><span>{t("Premium")}</span></div></div><dl className="overview-mix-facts"><div><dt><i className="overview-dot premium" />{t("Premium")}</dt><dd>{unavailable ? '--' : premium}</dd></div><div><dt><i className="overview-dot standard" />{t("Standard")}</dt><dd>{unavailable ? '--' : members.length - premium}</dd></div><div className="overview-mix-total"><dt>{t("Total profiles")}</dt><dd>{unavailable ? '--' : members.length}</dd></div></dl></div></section>
      <section className="overview-community"><div className="section-heading"><div><p className="overview-section-label">{t("Community")}</p><h2>{t("Community breakdown")}</h2></div><FiUsers aria-hidden="true" /></div>{["Male", "Female", "Other"].map((gender, index) => { const count = members.filter(member => gender === "Other" ? !["male", "female"].includes(String(member.gender).toLowerCase()) : String(member.gender).toLowerCase() === gender.toLowerCase()).length; return <div className={`breakdown overview-breakdown group-${index}`} key={gender}><div><span>{t(gender === "Other" ? "Other / unspecified" : gender)}</span><strong>{unavailable ? '--' : count}<small>{unavailable ? '--' : `${members.length ? Math.round(count / members.length * 100) : 0}%`}</small></strong></div><progress aria-label={t(gender === "Other" ? "Other / unspecified" : gender)} max={members.length || 1} value={unavailable ? 0 : count} /></div>; })}</section>
    </div>
    <section className="overview-directory"><div className="section-heading"><div><p className="overview-section-label">{t("Member directory")}</p><h2>{t("Recent profiles")}</h2><p className="muted">{t("A snapshot of your community")}</p></div><Link className="text-link" to={query.trim() ? `/members?search=${encodeURIComponent(query.trim())}` : "/members"}>{t("View all")}<FiArrowUpRight aria-hidden="true" /></Link></div><div className="overview-search-toolbar"><MemberSearch label="Search recent profiles" value={query} onChange={setQuery} />{!unavailable && <p className="overview-search-count" role="status">{matches.length ? 1 : 0}-{latest.length} {t("of")} {matches.length} {t("members")}</p>}</div><MemberTable members={latest} loading={loading} error={error} /></section>
  </div>;
}
