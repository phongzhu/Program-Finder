import { useMemo, useState } from 'react';
import {
  getApplicantApplications,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  getProgramSurfaceLabel,
  getProgramVisualTheme,
} from './helpers';

function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'bookmark-off':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" />
        </svg>
      );
    case 'bookmark-on':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" />
        </svg>
      );
    case 'search':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case 'location':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.31-2.69-6-6-6Z" />
          <circle cx="12" cy="8" r="2" />
        </svg>
      );
    case 'office':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="9" width="18" height="12" rx="2" />
          <path d="M3 9l9-6 9 6" />
        </svg>
      );
    case 'star':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 4.75 2.1 4.27 4.72.69-3.4 3.32.8 4.69L12 15.5l-4.22 2.22.8-4.69-3.4-3.32 4.72-.69Z" />
        </svg>
      );
    case 'check':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'filter':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
      );
    default:
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

function StatusChip({ status }) {
  const map = {
    Open: { bg: 'rgba(30,125,77,.13)', color: '#1e7d4d' },
    Upcoming: { bg: 'rgba(229,163,60,.15)', color: '#a16207' },
    Closed: { bg: 'rgba(195,86,75,.12)', color: '#9b3b31' },
  };
  const tone = map[status] || { bg: 'rgba(18,32,25,.08)', color: '#4a6356' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: tone.bg,
        color: tone.color,
        letterSpacing: '.03em',
      }}
    >
      {status}
    </span>
  );
}

function Chip({ children, green, accent }) {
  let bg = 'rgba(18,32,25,.07)';
  let color = '#4a6356';

  if (green) {
    bg = 'rgba(30,125,77,.12)';
    color = '#1e7d4d';
  }

  if (accent) {
    bg = 'rgba(30,125,77,.88)';
    color = '#fff';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.03em',
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        background:
          'linear-gradient(180deg, rgba(250,252,248,.98) 0%, rgba(239,244,238,.95) 100%)',
        borderRadius: 24,
        border: '1px solid rgba(18,32,25,.08)',
        boxShadow: '0 18px 48px rgba(18,32,25,.07)',
        overflow: 'visible',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardBody({ children, style }) {
  return <div style={{ padding: '20px 22px', ...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(18,32,25,.07)', margin: '0 22px' }} />;
}

function ProgramArtwork({ program }) {
  const photoSource = getProgramPhotoSource(program);
  const illustrationSource = getProgramIllustrationSource(program);
  const [useIllustration, setUseIllustration] = useState(!photoSource);
  const theme = getProgramVisualTheme(program);
  const surfaceLabel = getProgramSurfaceLabel(program);
  const visualSource = useIllustration ? illustrationSource : photoSource;

  return (
    <div
      style={{
        position: 'relative',
        height: 156,
        overflow: 'hidden',
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {visualSource ? (
        <img
          src={visualSource}
          alt={program.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setUseIllustration(true)}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: useIllustration
            ? 'linear-gradient(180deg, rgba(8,16,11,.08) 0%, rgba(8,16,11,.22) 100%)'
            : 'linear-gradient(180deg, rgba(8,16,11,.06) 0%, rgba(8,16,11,.55) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              maxWidth: '65%',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.18)',
              color: theme.text,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(10px)',
            }}
          >
            {surfaceLabel}
          </span>
          <span
            style={{
              display: 'inline-flex',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(8,16,11,.26)',
              color: '#fff',
              fontSize: 10.5,
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
            }}
          >
            {program.municipality}
          </span>
        </div>

        <div style={{ display: 'grid', gap: 5 }}>
          <span style={{ color: theme.mutedText, fontSize: 11.5, fontWeight: 600 }}>
            {program.office}
          </span>
        </div>
      </div>
    </div>
  );
}

const clampTwoLines = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
};

const clampThreeLines = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 3,
  overflow: 'hidden',
};

function ProgramCard({
  program,
  isBookmarked,
  hasExisting,
  isRecommended,
  onView,
  onBookmark,
}) {
  const eligibility = program.eligibility || [];

  return (
    <div className="sp-program-card">
      <ProgramArtwork program={program} />

      <div className="sp-program-card__body">
        <div className="sp-program-card__top">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
            <Chip>{program.category}</Chip>
            <StatusChip status={program.status} />
            {isRecommended ? <Chip accent>{program.fitScore}% match</Chip> : null}
            {hasExisting ? <Chip green>Applied</Chip> : null}
          </div>

          <button
            type="button"
            onClick={onBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isBookmarked ? 'rgba(30,125,77,.12)' : 'rgba(18,32,25,.05)',
              border: '1px solid',
              borderColor: isBookmarked ? 'rgba(30,125,77,.22)' : 'rgba(18,32,25,.08)',
              color: isBookmarked ? '#1e7d4d' : 'rgba(18,32,25,.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={15} />
          </button>
        </div>

        <div className="sp-program-card__copy">
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#122019',
              lineHeight: 1.28,
              ...clampTwoLines,
            }}
          >
            {program.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: '#4a6356',
              lineHeight: 1.7,
              ...clampThreeLines,
            }}
          >
            {program.summary}
          </p>
        </div>

        <div className="sp-program-card__meta">
          <span
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 7,
              fontSize: 12.5,
              color: '#4a6356',
              minWidth: 0,
              lineHeight: 1.55,
            }}
          >
            <Icon name="office" size={12} />
            <span style={{ minWidth: 0 }}>{program.office}</span>
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              color: '#4a6356',
              lineHeight: 1.55,
            }}
          >
            <Icon name="location" size={12} />
            <span>{program.municipality}</span>
          </span>
        </div>

        <div className="sp-program-card__eligibility">
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.09em',
              textTransform: 'uppercase',
              color: '#1e7d4d',
            }}
          >
            Eligibility
          </div>
          <div className="sp-program-card__eligibility-rail">
            {eligibility.map((item) => (
              <span
                key={item}
                className="sp-program-card__eligibility-chip"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(30,125,77,.08)',
                  border: '1px solid rgba(30,125,77,.13)',
                  fontSize: 10.5,
                  color: '#2a6040',
                }}
              >
                <Icon name="check" size={10} />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="sp-program-card__footer">
          <button
            type="button"
            onClick={onView}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              background: '#1e7d4d',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: '0 12px 24px rgba(30,125,77,.18)',
            }}
          >
            View Program
            <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeFilterText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isProvinceWideLocation(value) {
  const normalized = normalizeFilterText(value);

  return normalized === 'province wide' || normalized === 'bulacan province';
}

function getProgramSearchText(program) {
  return normalizeFilterText(
    [
      program.title,
      program.office,
      program.summary,
      program.description,
      program.category,
      program.sector,
      program.programType,
      program.status,
      program.municipality,
      program.objective,
      program.benefits,
      program.coverageNotes,
      program.submissionInstructions,
      program.additionalNotes,
      ...(program.eligibility || []),
      ...(program.requirements || []),
      ...(program.attachments || []),
    ]
      .filter(Boolean)
      .join(' ')
  );
}

const fieldBase = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 14,
  fontSize: 13,
  border: '1px solid rgba(18,32,25,.12)',
  background: 'rgba(255,255,255,.94)',
  color: '#122019',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const selectBase = {
  ...fieldBase,
  paddingRight: 34,
  appearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a6356' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 700,
  color: '#4a6356',
  letterSpacing: '.07em',
  textTransform: 'uppercase',
};

export default function SearchProgramsScreen({ session, data, actions }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [municipalityScope, setMunicipalityScope] = useState('my-area');

  const applicantApplications = useMemo(
    () => getApplicantApplications(data, session),
    [data, session]
  );
  const existingIds = useMemo(
    () => new Set(applicantApplications.map((application) => application.programId)),
    [applicantApplications]
  );
  const bookmarkedIds = useMemo(() => new Set(data.bookmarks), [data.bookmarks]);

  const allCategories = ['All', ...new Set(data.programs.map((program) => program.category))];
  const allStatuses = ['All', ...new Set(data.programs.map((program) => program.status))];

  const filteredPrograms = useMemo(() => {
    const query = normalizeFilterText(search);
    const scopedMunicipalities = new Set(
      [data.applicantProfile?.municipality, session?.municipality]
        .map(normalizeFilterText)
        .filter(Boolean)
    );

    return data.programs.filter((program) => {
      const matchSearch = !query || getProgramSearchText(program).includes(query);
      const matchCategory = category === 'All' || program.category === category;
      const matchStatus = status === 'All' || program.status === status;
      const inArea =
        isProvinceWideLocation(program.municipality) ||
        scopedMunicipalities.has(normalizeFilterText(program.municipality));
      const matchScope =
        municipalityScope === 'all'
          ? true
          : municipalityScope === 'existing'
            ? existingIds.has(program.id)
            : inArea;

      return matchSearch && matchCategory && matchStatus && matchScope;
    });
  }, [
    search,
    category,
    status,
    municipalityScope,
    data.programs,
    data.applicantProfile?.municipality,
    session?.municipality,
    existingIds,
  ]);

  const recommendedPrograms = [...data.programs]
    .filter((program) => !existingIds.has(program.id))
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, 5);

  return (
    <>
      <style>{`
        .sp-root {
          --sp-card-height: 520px;
          font-family: 'DM Sans', system-ui, sans-serif;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          min-height: 100vh;
          display: grid;
          gap: 22px;
          padding: 18px clamp(12px, 1.4vw, 20px) 8px 0;
          color: #122019;
          overflow-x: hidden;
        }
        .sp-root > * {
          min-width: 0;
        }
        .sp-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .sp-recommended-rail {
          display: grid;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          grid-auto-flow: column;
          grid-auto-columns: clamp(300px, 22vw, 340px);
          gap: 16px;
          align-items: stretch;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 2px 12px;
          scroll-snap-type: x proximity;
          scrollbar-gutter: stable both-edges;
        }
        .sp-recommended-rail > * {
          scroll-snap-align: start;
        }
        .sp-filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          align-items: end;
        }
        .sp-filter-search {
          grid-column: 1 / -1;
        }
        .sp-results-scroller {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          max-height: none;
          overflow: visible;
          padding-right: 0;
        }
        .sp-results-grid {
          display: grid;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          align-items: stretch;
        }
        .sp-program-card {
          display: flex;
          flex-direction: column;
          height: var(--sp-card-height);
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255,255,255,.98);
          border: 1px solid rgba(18,32,25,.08);
          box-shadow: 0 16px 40px rgba(18,32,25,.09);
        }
        .sp-program-card__body {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 12px;
          min-height: 0;
          padding: 16px 16px 18px;
        }
        .sp-program-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          min-height: 34px;
        }
        .sp-program-card__copy {
          display: grid;
          gap: 8px;
          min-height: 72px;
          align-content: start;
        }
        .sp-program-card__meta {
          display: grid;
          gap: 8px;
          min-height: 40px;
          align-content: start;
        }
        .sp-program-card__eligibility {
          display: grid;
          gap: 8px;
          min-height: 64px;
          height: 64px;
          align-content: start;
        }
        .sp-program-card__eligibility-rail {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 4px;
          scroll-snap-type: x proximity;
        }
        .sp-program-card__eligibility-chip {
          flex: 0 0 auto;
          scroll-snap-align: start;
        }
        .sp-program-card__footer {
          display: flex;
          justify-content: center;
          margin-top: auto;
          padding-top: 8px;
        }
        .sp-program-card__eligibility-rail::-webkit-scrollbar,
        .sp-results-scroller::-webkit-scrollbar,
        .sp-recommended-rail::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .sp-program-card__eligibility-rail::-webkit-scrollbar-thumb,
        .sp-results-scroller::-webkit-scrollbar-thumb,
        .sp-recommended-rail::-webkit-scrollbar-thumb {
          background: rgba(18,32,25,.12);
          border-radius: 999px;
        }
        .sp-program-card__eligibility-rail::-webkit-scrollbar-track,
        .sp-results-scroller::-webkit-scrollbar-track,
        .sp-recommended-rail::-webkit-scrollbar-track {
          background: rgba(18,32,25,.04);
          border-radius: 999px;
        }
        @media (max-width: 1120px) {
          .sp-results-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .sp-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 680px) {
          .sp-root {
            --sp-card-height: 500px;
            padding-top: 8px;
          }
          .sp-filter-grid,
          .sp-results-grid {
            grid-template-columns: 1fr;
          }
          .sp-recommended-rail {
            grid-auto-columns: minmax(82vw, 320px);
          }
          .sp-program-card {
            height: var(--sp-card-height);
          }
          .sp-program-card__eligibility {
            height: 64px;
          }
        }
      `}</style>

      <div className="sp-root">
        {recommendedPrograms.length ? (
          <Card>
            <div
              style={{
                padding: '18px 22px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: 'rgba(30,125,77,.1)',
                    color: '#1e7d4d',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="star" size={17} />
                </span>
                <div style={{ display: 'grid', gap: 2 }}>
                  <strong style={{ fontSize: 15, color: '#122019' }}>Recommended for You</strong>
                  <span style={{ fontSize: 12.5, color: '#4a6356' }}>
                    Horizontal picks based on fit score and programs you have not applied to yet.
                  </span>
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(18,32,25,.05)',
                  color: '#4a6356',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                Swipe or scroll sideways
              </span>
            </div>
            <Divider />
            <CardBody>
              <div className="sp-recommended-rail">
                {recommendedPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isBookmarked={bookmarkedIds.has(program.id)}
                    hasExisting={existingIds.has(program.id)}
                    isRecommended={true}
                    onView={() => actions.openProgramDetails(program.id)}
                    onBookmark={() => actions.toggleBookmark(program.id)}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardBody style={{ paddingBottom: 18 }}>
            <div className="sp-section-header" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 14,
                    background: 'rgba(30,125,77,.1)',
                    color: '#1e7d4d',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="filter" size={16} />
                </span>
                <div style={{ display: 'grid', gap: 2 }}>
                  <strong style={{ fontSize: 15, color: '#122019' }}>Filter Programs</strong>
                  <span style={{ fontSize: 12.5, color: '#4a6356' }}>
                    Filter the list below and scroll vertically through the matching program cards.
                  </span>
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(30,125,77,.08)',
                  color: '#1e7d4d',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {filteredPrograms.length} found
              </span>
            </div>

            <div className="sp-filter-grid">
              <div className="sp-filter-search">
                <label style={labelStyle}>Search</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(74,99,86,.45)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Icon name="search" size={14} />
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, office, or keyword"
                    style={{ ...fieldBase, paddingLeft: 35 }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  style={selectBase}
                >
                  {allCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  style={selectBase}
                >
                  {allStatuses.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Location scope</label>
                <select
                  value={municipalityScope}
                  onChange={(event) => setMunicipalityScope(event.target.value)}
                  style={selectBase}
                >
                  <option value="my-area">My municipality and province-wide</option>
                  <option value="existing">Programs I&apos;ve applied to</option>
                  <option value="all">All municipalities</option>
                </select>
              </div>
            </div>
          </CardBody>

          <Divider />

          <CardBody style={{ paddingTop: 18 }}>
            {filteredPrograms.length ? (
              <div className="sp-results-scroller">
                <div className="sp-results-grid">
                  {filteredPrograms.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      isBookmarked={bookmarkedIds.has(program.id)}
                      hasExisting={existingIds.has(program.id)}
                      isRecommended={false}
                      onView={() => actions.openProgramDetails(program.id)}
                      onBookmark={() => actions.toggleBookmark(program.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '54px 20px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,.7)',
                  border: '1px dashed rgba(18,32,25,.12)',
                  color: '#4a6356',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#122019', marginBottom: 7 }}>
                  No programs matched your search
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Adjust the search text, location scope, category, or status filter and try again.
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
