import { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useMembers, DataNotice } from '../components/MemberData';
import { Modal } from '../components/MemberEditor';
import MemberProfile from '../components/MemberProfile';
import { interestRows } from '../services/interests';
import { useLanguage } from '../Language';
import './Interests.css';
export default function Interests() {
  const { members, loading, error, refresh } = useMembers();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = interestRows(members).filter(row => (!status || row.status === status) && [row.sender.name, row.receiver.name, row.sender.currentCity, row.receiver.currentCity].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  return <><div className="page-heading"><div><h1>{t('Interest Requests')}</h1><p className="muted">{t('Current requests and accepted connections. Read-only view.')}</p></div><button className="button" disabled={loading} onClick={refresh}><FiRefreshCw />{t('Refresh members')}</button></div>
    <DataNotice />
    <p className="notice">{t('Rejected and withdrawn requests are not retained by the backend. Request dates are unavailable.')}</p>
    <section className="directory"><div className="toolbar"><input aria-label={t('Search interests')} placeholder={t('Search sender or receiver')} value={search} onChange={e => setSearch(e.target.value)} /><select aria-label={t('Interest status')} value={status} onChange={e => setStatus(e.target.value)}>{['', 'Pending', 'Accepted'].map(value => <option key={value} value={value}>{t(value || 'All statuses')}</option>)}</select></div>
    {!loading && !error && <div className="interest-list">{rows.length ? rows.map(row => <article className="interest-record" key={row.key}><div><span className="muted">{t('Sender')}</span><button className="button" onClick={() => setSelected(row.sender)}>{row.sender.name || t('Unnamed member')}</button></div><span aria-hidden="true">?</span><div><span className="muted">{t('Receiver')}</span><button className="button" onClick={() => setSelected(row.receiver)}>{row.receiver.name || t('Unnamed member')}</button></div><strong>{t(row.status)}</strong></article>) : <p>{t('No interest requests found.')}</p>}</div>}</section>
    {selected && <Modal title={selected.name || t('Member profile')} close={() => setSelected(null)} wide fixedHeader><MemberProfile member={selected} /></Modal>}
  </>;
}
