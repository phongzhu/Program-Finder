import { useMemo, useState } from 'react';
import { FormField, SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getApplicantApplications } from './helpers';

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'bookmark-off':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z"/></svg>;
    case 'bookmark-on':
      return <svg style={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z"/></svg>;
    case 'search':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.35-4.35"/></svg>;
    case 'location':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.31-2.69-6-6-6Z"/><circle cx="12" cy="8" r="2"/></svg>;
    case 'office':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9l9-6 9 6"/></svg>;
    case 'star':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m12 4.75 2.1 4.27 4.72.69-3.4 3.32.8 4.69L12 15.5l-4.22 2.22.8-4.69-3.4-3.32 4.72-.69Z"/></svg>;
    case 'check':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>;
    case 'arrow-right':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'filter':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="7"/></svg>;
  }
}

/* ─── Status color helper ────────────────────────────────────────────────── */
function statusChip(status) {
  const map = {
    Open:     { bg: 'rgba(30,125,77,.12)', color: '#1e7d4d', label: 'Open' },
    Upcoming: { bg: 'rgba(229,163,60,.15)', color: '#a16207', label: 'Upcoming' },
    Closed:   { bg: 'rgba(195,86,75,.12)', color: '#9b3b31', label: 'Closed' },
  };
  const s = map[status] || { bg: 'rgba(18,32,25,.08)', color: '#4a6356', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, letterSpacing: '.03em' }}>
      {s.label}
    </span>
  );
}

/* ─── Chip ───────────────────────────────────────────────────────────────── */
function Chip({ children, green, accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 9px',
      borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '.03em',
      background: green ? 'rgba(30,125,77,.12)' : accent ? 'rgba(30,125,77,.85)' : 'rgba(18,32,25,.07)',
      color: green ? '#1e7d4d' : accent ? '#fff' : '#4a6356',
    }}>{children}</span>
  );
}

/* ─── Card / layout primitives ───────────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(250,252,248,.98) 0%, rgba(239,244,238,.95) 100%)',
      borderRadius: 20, border: '1px solid rgba(18,32,25,.09)',
      boxShadow: '0 1px 4px rgba(18,32,25,.05)', overflow: 'hidden', ...style,
    }}>{children}</div>
  );
}
function CardBody({ children, style }) {
  return <div style={{ padding: '18px 22px', ...style }}>{children}</div>;
}
function Divider() {
  return <div style={{ height: 1, background: 'rgba(18,32,25,.07)', margin: '0 22px' }} />;
}

/* ─── Recommended card ───────────────────────────────────────────────────── */
function RecommendedCard({ program, isBookmarked, onView, onBookmark }) {
  const eligibility = program.eligibility || [];
  return (
    <div style={{
      background: 'radial-gradient(circle at top right, rgba(143,225,185,.15), transparent 40%), linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(232,239,231,.93) 100%)',
      border: '1px solid rgba(18,32,25,.1)', borderRadius: 18,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 1px 4px rgba(18,32,25,.05)', position: 'relative',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip green>{program.category}</Chip>
          <Chip accent>{program.fitScore}% match</Chip>
        </div>
        <button
          onClick={onBookmark}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isBookmarked ? '#1e7d4d' : 'rgba(18,32,25,.3)', padding: 4, display: 'flex', alignItems: 'center' }}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={17} />
        </button>
      </div>

      {/* Title + summary */}
      <div>
        <h3 style={{ margin: '0 0 5px', fontSize: 14.5, fontWeight: 700, color: 'var(--pf-ink, #122019)', lineHeight: 1.35 }}>{program.title}</h3>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--pf-ink-muted, #4a6356)', lineHeight: 1.55 }}>{program.summary}</p>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4a6356' }}>
          <Icon name="office" size={12} />{program.office}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4a6356' }}>
          <Icon name="location" size={12} />{program.municipality}
        </span>
      </div>

      {/* Eligibility */}
      {eligibility.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#1e7d4d', marginBottom: 6 }}>Eligibility</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {eligibility.slice(0, 3).map((req, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#4a6356' }}>
                <span style={{ color: '#1e7d4d', marginTop: 1, flexShrink: 0 }}><Icon name="check" size={12} /></span>
                {req}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={onView}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: '#1e7d4d', color: '#fff', border: 'none', borderRadius: 10,
          padding: '9px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(30,125,77,.25)', transition: 'opacity .15s',
          marginTop: 2,
        }}
      >
        View Program <Icon name="arrow-right" size={13} />
      </button>
    </div>
  );
}

/* ─── Program list row ───────────────────────────────────────────────────── */
function ProgramRow({ program, isBookmarked, hasExisting, onView, onBookmark }) {
  const eligibility = program.eligibility || [];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 0,
      borderBottom: '1px solid rgba(18,32,25,.07)', padding: '16px 0',
    }}>
      {/* Left: content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 7 }}>
          <Chip>{program.category}</Chip>
          {statusChip(program.status)}
          {hasExisting && <Chip green>Applied</Chip>}
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 5px', fontSize: 14, fontWeight: 700, color: 'var(--pf-ink, #122019)', lineHeight: 1.3 }}>
          {program.title}
        </h3>

        {/* Summary */}
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#4a6356', lineHeight: 1.55 }}>
          {program.summary}
        </p>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: eligibility.length ? 10 : 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4a6356' }}>
            <Icon name="office" size={12} />{program.office}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4a6356' }}>
            <Icon name="location" size={12} />{program.municipality}
          </span>
        </div>

        {/* Eligibility */}
        {eligibility.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {eligibility.slice(0, 3).map((req, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4a6356', background: 'rgba(30,125,77,.07)', borderRadius: 6, padding: '2px 8px' }}>
                <span style={{ color: '#1e7d4d' }}><Icon name="check" size={11} /></span>
                {req}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingLeft: 20 }}>
        <button
          onClick={onView}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#1e7d4d', color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(30,125,77,.22)', whiteSpace: 'nowrap',
            transition: 'opacity .15s',
          }}
        >
          View Program
        </button>
        <button
          onClick={onBookmark}
          style={{
            background: isBookmarked ? 'rgba(30,125,77,.1)' : 'rgba(18,32,25,.05)',
            border: '1px solid',
            borderColor: isBookmarked ? 'rgba(30,125,77,.25)' : 'rgba(18,32,25,.1)',
            borderRadius: 10, cursor: 'pointer', padding: '7px 9px',
            color: isBookmarked ? '#1e7d4d' : 'rgba(18,32,25,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main screen ────────────────────────────────────────────────────────── */
export default function SearchProgramsScreen({ session, data, actions }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [municipalityScope, setMunicipalityScope] = useState('my-area');

  const applicantApplications = useMemo(() => getApplicantApplications(data, session), [data, session]);
  const existingIds = new Set(applicantApplications.map((a) => a.programId));

  const allCategories = ['All', ...new Set(data.programs.map((p) => p.category))];
  const allStatuses   = ['All', ...new Set(data.programs.map((p) => p.status))];

  const filteredPrograms = data.programs.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.office.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
    const matchesCategory = category === 'All' || p.category === category;
    const matchesStatus   = status === 'All'   || p.status === status;
    const inArea = p.municipality === 'Province-wide' || p.municipality === data.applicantProfile.municipality || p.municipality === session.municipality;
    const matchesScope = municipalityScope === 'all' ? true : municipalityScope === 'existing' ? existingIds.has(p.id) : inArea;
    return matchesSearch && matchesCategory && matchesStatus && matchesScope;
  });

  const recommendedPrograms = [...data.programs]
    .filter((p) => !existingIds.has(p.id))
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  const selectStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13,
    border: '1px solid rgba(18,32,25,.15)', background: 'rgba(255,255,255,.9)',
    color: 'var(--pf-ink, #122019)', cursor: 'pointer', outline: 'none',
    fontFamily: 'inherit', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a6356' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  };
  const labelStyle = { fontSize: 11.5, fontWeight: 700, color: '#4a6356', letterSpacing: '.04em', textTransform: 'uppercase', display: 'block', marginBottom: 5 };

  return (
    <>
      <style>{`
        .sp-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #f2f5f0;
          min-height: 100vh;
          padding: 28px 32px 60px;
          box-sizing: border-box;
          color: var(--pf-ink, #122019);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (max-width: 900px) { .sp-root { padding: 16px 16px 48px; } }
        .sp-rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .sp-filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 14px; align-items: end; }
        .sp-count { font-size: 12px; color: #4a6356; font-weight: 600; }
        @media (max-width: 1100px) { .sp-rec-grid { grid-template-columns: repeat(2, 1fr); } .sp-filter-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 680px)  { .sp-rec-grid { grid-template-columns: 1fr; } .sp-filter-grid { grid-template-columns: 1fr; } }
        .sp-prog-row-btn:hover { opacity: .85; }
      `}</style>

      <div className="sp-root">

        {/* ── Page header ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#1e7d4d', marginBottom: 4 }}>Program directory</div>
          <div style={{ fontFamily: 'var(--pf-font-display, DM Serif Display, Georgia, serif)', fontSize: 26, fontWeight: 400, color: '#122019', letterSpacing: '-.01em' }}>
            Search Programs
          </div>
          <div style={{ fontSize: 13, color: '#4a6356', marginTop: 4, maxWidth: 540, lineHeight: 1.55 }}>
            Browse open listings, filter by your area, and view each program's details and eligibility before reaching out.
          </div>
        </div>

        {/* ── Recommended ── */}
        {recommendedPrograms.length > 0 && (
          <Card>
            <div style={{ padding: '16px 22px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(30,125,77,.1)', color: '#1e7d4d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Recommended for You</div>
                <div style={{ fontSize: 12, color: '#4a6356', marginTop: 1 }}>Top-matching programs based on your profile and eligibility.</div>
              </div>
            </div>
            <Divider />
            <CardBody>
              <div className="sp-rec-grid">
                {recommendedPrograms.map((p) => (
                  <RecommendedCard
                    key={p.id}
                    program={p}
                    isBookmarked={data.bookmarks.includes(p.id)}
                    onView={() => actions.openProgramDetails(p.id)}
                    onBookmark={() => actions.toggleBookmark(p.id)}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Filter + results ── */}
        <Card>
          {/* Filters */}
          <CardBody style={{ paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: '#1e7d4d' }}><Icon name="filter" size={15} /></span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#122019' }}>Filter Programs</span>
            </div>
            <div className="sp-filter-grid">
              {/* Search */}
              <div>
                <label style={labelStyle}>Search</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(74,99,86,.5)', pointerEvents: 'none' }}>
                    <Icon name="search" size={14} />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Title, office, or keyword…"
                    style={{ ...selectStyle, paddingLeft: 32 }}
                  />
                </div>
              </div>
              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
                  {allCategories.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Status */}
              <div>
                <label style={labelStyle}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
                  {allStatuses.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Scope */}
              <div>
                <label style={labelStyle}>Location scope</label>
                <select value={municipalityScope} onChange={(e) => setMunicipalityScope(e.target.value)} style={selectStyle}>
                  <option value="my-area">My municipality &amp; province-wide</option>
                  <option value="existing">Programs with my applications</option>
                  <option value="all">All municipalities</option>
                </select>
              </div>
            </div>
          </CardBody>

          <Divider />

          {/* Results */}
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="sp-count">{filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''} found</span>
            </div>

            {filteredPrograms.length ? (
              <div>
                {filteredPrograms.map((p) => (
                  <ProgramRow
                    key={p.id}
                    program={p}
                    isBookmarked={data.bookmarks.includes(p.id)}
                    hasExisting={existingIds.has(p.id)}
                    onView={() => actions.openProgramDetails(p.id)}
                    onBookmark={() => actions.toggleBookmark(p.id)}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                color: '#4a6356',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#122019', marginBottom: 6 }}>No programs matched your search</div>
                <div style={{ fontSize: 13, lineHeight: 1.55 }}>Try adjusting your location scope, status, or category filter.</div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}