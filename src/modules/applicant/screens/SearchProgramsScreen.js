import { useMemo, useState } from 'react';
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

/* ─── Stable placeholder image ───────────────────────────────────────────── */
// Derives a consistent numeric seed from the program id so each program
// always renders the same placeholder — no broken/random images.
function getProgramImage(program) {
  if (program.image && /^https?:\/\//.test(program.image)) return program.image;
  const seed = String(program.id)
    .split('')
    .reduce((n, c) => n + c.charCodeAt(0), 0) % 900;
  // picsum.photos is a reliable free service; seed keeps image stable per card
  return `https://picsum.photos/seed/prog${seed}/800/360`;
}

/* ─── Status chip ────────────────────────────────────────────────────────── */
function StatusChip({ status }) {
  const map = {
    Open:     { bg: 'rgba(30,125,77,.13)',  color: '#1e7d4d' },
    Upcoming: { bg: 'rgba(229,163,60,.15)', color: '#a16207' },
    Closed:   { bg: 'rgba(195,86,75,.12)',  color: '#9b3b31' },
  };
  const t = map[status] || { bg: 'rgba(18,32,25,.08)', color: '#4a6356' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: t.bg, color: t.color, letterSpacing: '.03em' }}>
      {status}
    </span>
  );
}

/* ─── Generic chip ───────────────────────────────────────────────────────── */
function Chip({ children, green, accent }) {
  let bg = 'rgba(18,32,25,.07)', color = '#4a6356';
  if (green)  { bg = 'rgba(30,125,77,.12)'; color = '#1e7d4d'; }
  if (accent) { bg = 'rgba(30,125,77,.82)'; color = '#fff'; }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '.03em', background: bg, color }}>
      {children}
    </span>
  );
}

/* ─── Layout primitives ──────────────────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg,rgba(250,252,248,.98) 0%,rgba(239,244,238,.95) 100%)',
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

/* ─── Program card — used in BOTH recommended strip and results grid ─────── */
function ProgramCard({ program, isBookmarked, hasExisting, isRecommended, onView, onBookmark }) {
  const eligibility = program.eligibility || [];

  return (
    <div style={{
      border: '1px solid rgba(18,32,25,.09)', borderRadius: 14,
      overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 5px rgba(18,32,25,.06)',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Cover image ── */}
      <div style={{ width: '100%', height: 116, background: '#d5e8d0', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
        <img
          src={getProgramImage(program)}
          alt=""
          role="presentation"
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '13px 14px 15px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>

        {/* Row 1: chips + bookmark button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
            <Chip>{program.category}</Chip>
            <StatusChip status={program.status} />
            {isRecommended && <Chip accent>{program.fitScore}% match</Chip>}
            {hasExisting    && <Chip green>Applied</Chip>}
          </div>
          <button
            onClick={onBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{
              flexShrink: 0, background: isBookmarked ? 'rgba(30,125,77,.1)' : 'rgba(18,32,25,.05)',
              border: '1px solid', borderColor: isBookmarked ? 'rgba(30,125,77,.22)' : 'rgba(18,32,25,.1)',
              borderRadius: 8, padding: '5px 6px', cursor: 'pointer',
              color: isBookmarked ? '#1e7d4d' : 'rgba(18,32,25,.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
          >
            <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={15} />
          </button>
        </div>

        {/* Row 2: title + summary */}
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 700, color: '#122019', lineHeight: 1.35 }}>
            {program.title}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#4a6356', lineHeight: 1.55 }}>
            {program.summary}
          </p>
        </div>

        {/* Row 3: meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#4a6356' }}>
            <Icon name="office" size={11} />{program.office}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#4a6356' }}>
            <Icon name="location" size={11} />{program.municipality}
          </span>
        </div>

        {/* Row 4: eligibility tags */}
        {eligibility.length > 0 && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d', marginBottom: 5 }}>
              Eligibility
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {eligibility.slice(0, 3).map((req, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(30,125,77,.07)', border: '1px solid rgba(30,125,77,.13)',
                  borderRadius: 6, padding: '3px 7px', fontSize: 11, color: '#2a6040',
                }}>
                  <Icon name="check" size={10} />{req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Row 5: CTA — always at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          <button
            onClick={onView}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#1e7d4d', color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(30,125,77,.22)', transition: 'opacity .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            View Program <Icon name="arrow-right" size={13} />
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Shared select / input style ────────────────────────────────────────── */
const inputBase = {
  width: '100%', padding: '9px 34px 9px 12px', borderRadius: 10, fontSize: 13,
  border: '1px solid rgba(18,32,25,.13)', background: 'rgba(255,255,255,.9)',
  color: '#122019', outline: 'none', fontFamily: 'inherit',
  appearance: 'none', boxSizing: 'border-box',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a6356' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};
const labelStyle = {
  display: 'block', marginBottom: 5,
  fontSize: 11, fontWeight: 700,
  color: '#4a6356', letterSpacing: '.06em', textTransform: 'uppercase',
};

/* ─── Screen ─────────────────────────────────────────────────────────────── */
export default function SearchProgramsScreen({ session, data, actions }) {
  const [search, setSearch]                       = useState('');
  const [category, setCategory]                   = useState('All');
  const [status, setStatus]                       = useState('All');
  const [municipalityScope, setMunicipalityScope] = useState('my-area');

  const applicantApplications = useMemo(
    () => getApplicantApplications(data, session),
    [data, session]
  );
  const existingIds = new Set(applicantApplications.map((a) => a.programId));

  const allCategories = ['All', ...new Set(data.programs.map((p) => p.category))];
  const allStatuses   = ['All', ...new Set(data.programs.map((p) => p.status))];

  const filteredPrograms = data.programs.filter((p) => {
    const q             = search.trim().toLowerCase();
    const matchSearch   = !q || p.title.toLowerCase().includes(q) || p.office.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
    const matchCategory = category === 'All' || p.category === category;
    const matchStatus   = status   === 'All' || p.status   === status;
    const inArea        = p.municipality === 'Province-wide' || p.municipality === data.applicantProfile.municipality || p.municipality === session.municipality;
    const matchScope    = municipalityScope === 'all' ? true : municipalityScope === 'existing' ? existingIds.has(p.id) : inArea;
    return matchSearch && matchCategory && matchStatus && matchScope;
  });

  const recommendedPrograms = [...data.programs]
    .filter((p) => !existingIds.has(p.id))
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  return (
    <>
      <style>{`
        .sp-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #f2f5f0;
          min-height: 100vh;
          padding: 28px 32px 60px;
          box-sizing: border-box;
          color: #122019;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        @media (max-width: 900px) { .sp-root { padding: 16px 16px 48px; } }

        /* Same 3-col grid used in BOTH recommended and results */
        .sp-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1080px) { .sp-card-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px)  { .sp-card-grid { grid-template-columns: 1fr; } }

        .sp-filter-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.6fr;
          gap: 14px;
          align-items: end;
        }
        @media (max-width: 1000px) { .sp-filter-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px)  { .sp-filter-grid { grid-template-columns: 1fr; } }

        .sp-section-eyebrow {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: #1e7d4d;
        }
      `}</style>

      <div className="sp-root">

        {/* ── Page header ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#1e7d4d', marginBottom: 4 }}>
            Program directory
          </div>
          <div style={{ fontFamily: 'var(--pf-font-display, DM Serif Display, Georgia, serif)', fontSize: 26, fontWeight: 400, color: '#122019', letterSpacing: '-.01em' }}>
            Search Programs
          </div>
          <div style={{ fontSize: 13, color: '#4a6356', marginTop: 4, maxWidth: 520, lineHeight: 1.55 }}>
            Browse open listings, filter by your area, and review each program's eligibility before reaching out to apply.
          </div>
        </div>

        {/* ── Recommended for you ── */}
        {recommendedPrograms.length > 0 && (
          <Card>
            <div style={{ padding: '15px 22px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(30,125,77,.1)', color: '#1e7d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="star" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Recommended for You</div>
                <div style={{ fontSize: 12, color: '#4a6356', marginTop: 1 }}>Top-matching programs based on your profile and eligibility.</div>
              </div>
            </div>
            <Divider />
            <CardBody>
              <div className="sp-card-grid">
                {recommendedPrograms.map((p) => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    isBookmarked={data.bookmarks.includes(p.id)}
                    hasExisting={existingIds.has(p.id)}
                    isRecommended={true}
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
          {/* Filter bar */}
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
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(74,99,86,.45)', pointerEvents: 'none' }}>
                    <Icon name="search" size={14} />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Title, office, or keyword…"
                    style={{ ...inputBase, paddingLeft: 30, cursor: 'text' }}
                  />
                </div>
              </div>
              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>
                  {allCategories.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Status */}
              <div>
                <label style={labelStyle}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>
                  {allStatuses.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Scope */}
              <div>
                <label style={labelStyle}>Location scope</label>
                <select value={municipalityScope} onChange={(e) => setMunicipalityScope(e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>
                  <option value="my-area">My municipality &amp; province-wide</option>
                  <option value="existing">Programs I've applied to</option>
                  <option value="all">All municipalities</option>
                </select>
              </div>
            </div>
          </CardBody>

          <Divider />

          {/* Results */}
          <CardBody>
            <div style={{ marginBottom: 14 }}>
              <span className="sp-section-eyebrow">
                {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {filteredPrograms.length ? (
              <div className="sp-card-grid">
                {filteredPrograms.map((p) => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    isBookmarked={data.bookmarks.includes(p.id)}
                    hasExisting={existingIds.has(p.id)}
                    isRecommended={false}
                    onView={() => actions.openProgramDetails(p.id)}
                    onBookmark={() => actions.toggleBookmark(p.id)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '52px 20px', color: '#4a6356' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 6 }}>No programs matched your search</div>
                <div style={{ fontSize: 13, lineHeight: 1.55 }}>Try adjusting your location scope, status, or category filter.</div>
              </div>
            )}
          </CardBody>
        </Card>

      </div>
    </>
  );
}