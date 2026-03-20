import { useEffect, useMemo, useState } from 'react';
import {
  getApplicantApplications,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  getProgramSurfaceLabel,
  getProgramVisualTheme,
} from './helpers';

function Icon({ name, size = 16 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'bookmark':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M7.25 5h9.5v14l-4.75-2.9L7.25 19Z" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'office':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M4 9l8-5 8 5" />
        </svg>
      );
    case 'location':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s6-5.75 6-11.2A6 6 0 0 0 6 8.8C6 14.25 12 20 12 20Z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      );
    case 'check':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    default:
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(250,252,248,.98) 0%, rgba(239,244,238,.95) 100%)',
        borderRadius: 24,
        border: '1px solid rgba(18,32,25,.08)',
        boxShadow: '0 18px 48px rgba(18,32,25,.07)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusChip({ status }) {
  const tones = {
    Open: { background: 'rgba(30,125,77,.13)', color: '#1e7d4d' },
    Upcoming: { background: 'rgba(229,163,60,.15)', color: '#a16207' },
    Closed: { background: 'rgba(195,86,75,.12)', color: '#9b3b31' },
  };
  const tone = tones[status] || { background: 'rgba(18,32,25,.08)', color: '#4a6356' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

function SavedChip({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { background: 'rgba(18,32,25,.06)', color: '#4a6356' },
    accent: { background: 'rgba(30,125,77,.08)', color: '#1e7d4d' },
  };
  const styleTone = tones[tone] || tones.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: 999,
        background: styleTone.background,
        color: styleTone.color,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function ProgramArtwork({ program }) {
  const photoSource = getProgramPhotoSource(program);
  const illustrationSource = getProgramIllustrationSource(program);
  const [useIllustration, setUseIllustration] = useState(!photoSource);
  const theme = getProgramVisualTheme(program);

  useEffect(() => {
    setUseIllustration(!photoSource);
  }, [photoSource, program?.id]);

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
      <img
        src={visualSource}
        alt={program.title}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setUseIllustration(true)}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: useIllustration
            ? 'linear-gradient(180deg, rgba(8,16,11,.08) 0%, rgba(8,16,11,.22) 100%)'
            : 'linear-gradient(180deg, rgba(8,16,11,.06) 0%, rgba(8,16,11,.56) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '14px 15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '5px 11px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.16)',
              color: theme.text,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(10px)',
            }}
          >
            {getProgramSurfaceLabel(program)}
          </span>
          <span
            style={{
              display: 'inline-flex',
              padding: '5px 11px',
              borderRadius: 999,
              background: 'rgba(8,16,11,.24)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
            }}
          >
            {program.municipality}
          </span>
        </div>

        <div style={{ display: 'grid', gap: 3 }}>
          <strong style={{ color: '#fff', fontSize: 17, lineHeight: 1.2 }}>{program.office}</strong>
          <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 1.55 }}>
            Saved from your search workspace.
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article
      style={{
        display: 'grid',
        gap: 4,
        padding: '18px',
        borderRadius: 22,
        background: 'rgba(255,255,255,.84)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <span style={{ color: '#4a6356', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <strong style={{ fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 34, lineHeight: .95 }}>
        {value}
      </strong>
      <span style={{ color: '#4a6356', fontSize: 13, lineHeight: 1.55 }}>{detail}</span>
    </article>
  );
}

const clampTwoLines = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
};

export default function BookmarksScreen({ session, data, actions }) {
  const bookmarkedPrograms = data.programs.filter((program) => data.bookmarks.includes(program.id));
  const applicantApplications = useMemo(
    () => getApplicantApplications(data, session),
    [data, session]
  );
  const existingIds = useMemo(
    () => new Set(applicantApplications.map((application) => application.programId)),
    [applicantApplications]
  );
  const openSavedCount = bookmarkedPrograms.filter((program) => program.status === 'Open').length;

  return (
    <>
      <style>{`
        .bk-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          display: grid;
          gap: 20px;
          padding: 8px 0 12px;
          color: #122019;
        }
        .bk-metrics,
        .bk-grid {
          display: grid;
          gap: 16px;
        }
        .bk-metrics {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .bk-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .bk-card {
          display: flex;
          flex-direction: column;
          min-height: 430px;
          border-radius: 22px;
          overflow: hidden;
          background: rgba(255,255,255,.98);
          border: 1px solid rgba(18,32,25,.08);
          box-shadow: 0 12px 34px rgba(18,32,25,.08);
        }
        @media (max-width: 1120px) {
          .bk-metrics,
          .bk-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .bk-metrics,
          .bk-grid {
            grid-template-columns: 1fr;
          }
          .bk-card {
            min-height: auto;
          }
        }
      `}</style>

      <div className="bk-root">
        <Panel>
          <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                Saved programs
              </span>
              <h1 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: .97, letterSpacing: '-.04em', color: '#122019' }}>
                Bookmark workspace
              </h1>
              <p style={{ margin: 0, maxWidth: 720, color: '#4a6356', fontSize: 14, lineHeight: 1.72 }}>
                Reopen the programs you saved from search, review their status, and continue to details or application from one place.
              </p>
            </div>

            <div className="bk-metrics">
              <MetricCard label="Saved programs" value={bookmarkedPrograms.length} detail="Programs kept visible for quick return." />
              <MetricCard label="Open now" value={openSavedCount} detail="Bookmarked listings that are currently accepting." />
              <MetricCard label="Already applied" value={bookmarkedPrograms.filter((program) => existingIds.has(program.id)).length} detail="Saved programs with an existing submission." />
            </div>
          </div>
        </Panel>

        <Panel>
          <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong style={{ fontSize: 15 }}>Saved cards</strong>
                <span style={{ color: '#4a6356', fontSize: 13, lineHeight: 1.6 }}>
                  Designed to match the newer Search Programs card language.
                </span>
              </div>
              <SavedChip tone="accent">{bookmarkedPrograms.length} saved</SavedChip>
            </div>

            {bookmarkedPrograms.length ? (
              <div className="bk-grid">
                {bookmarkedPrograms.map((program) => {
                  const hasExisting = existingIds.has(program.id);

                  return (
                    <article className="bk-card" key={program.id}>
                      <ProgramArtwork program={program} />

                      <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <SavedChip>{program.category}</SavedChip>
                          <StatusChip status={program.status} />
                          {hasExisting ? <SavedChip tone="accent">Applied</SavedChip> : null}
                        </div>

                        <div style={{ display: 'grid', gap: 7 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 19,
                              lineHeight: 1.22,
                              color: '#122019',
                              ...clampTwoLines,
                            }}
                          >
                            {program.title}
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              color: '#4a6356',
                              fontSize: 13.5,
                              lineHeight: 1.68,
                              ...clampTwoLines,
                            }}
                          >
                            {program.summary}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gap: 6 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4a6356', fontSize: 12.5 }}>
                            <Icon name="office" size={13} />
                            {program.office}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4a6356', fontSize: 12.5 }}>
                            <Icon name="location" size={13} />
                            {program.municipality}
                          </span>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
                          <button
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              width: '100%',
                              minHeight: 44,
                              border: 'none',
                              borderRadius: 999,
                              background: '#1e7d4d',
                              color: '#fff',
                              fontWeight: 700,
                              boxShadow: '0 12px 24px rgba(30,125,77,.18)',
                            }}
                            onClick={() => actions.openProgramDetails(program.id)}
                          >
                            View Program
                            <Icon name="arrow-right" size={14} />
                          </button>

                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }}>
                            {hasExisting ? (
                              <button
                                style={{
                                  minHeight: 42,
                                  borderRadius: 999,
                                  border: '1px solid rgba(18,32,25,.08)',
                                  background: 'rgba(18,32,25,.04)',
                                  color: '#4a6356',
                                  fontWeight: 700,
                                }}
                                disabled
                              >
                                Application Sent
                              </button>
                            ) : (
                              <button
                                style={{
                                  minHeight: 42,
                                  borderRadius: 999,
                                  border: '1px solid rgba(18,32,25,.1)',
                                  background: 'rgba(255,255,255,.96)',
                                  color: '#122019',
                                  fontWeight: 700,
                                }}
                                onClick={() => actions.startApplication(program.id)}
                              >
                                Apply Now
                              </button>
                            )}

                            <button
                              style={{
                                minWidth: 98,
                                minHeight: 42,
                                borderRadius: 999,
                                border: '1px solid rgba(18,32,25,.1)',
                                background: 'rgba(255,255,255,.96)',
                                color: '#122019',
                                fontWeight: 700,
                              }}
                              onClick={() => actions.toggleBookmark(program.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '54px 20px',
                  borderRadius: 22,
                  background: 'rgba(255,255,255,.78)',
                  border: '1px dashed rgba(18,32,25,.12)',
                  textAlign: 'center',
                  color: '#4a6356',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#122019', marginBottom: 6 }}>
                  No bookmarked programs
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65 }}>
                  Save programs from Search Programs to keep them visible here.
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
