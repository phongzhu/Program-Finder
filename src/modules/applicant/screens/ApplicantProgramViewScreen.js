import { useEffect, useState } from 'react';
import {
  formatProgramDate,
  formatProgramWindow,
  getApplicantApplications,
  getProgramById,
  getProgramCapacity,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  getProgramSurfaceLabel,
  getProgramVisualTheme,
} from './helpers';

function Icon({ name, size = 16 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'arrow-left':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.25" />
          <path d="M7.5 3.75v3M16.5 3.75v3M3.75 9.5h16.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.25l2.75 1.75" />
        </svg>
      );
    case 'office':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M4 9l8-5 8 5M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
        </svg>
      );
    case 'location':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s6-5.75 6-11.2A6 6 0 0 0 6 8.8C6 14.25 12 20 12 20Z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      );
    case 'target':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 4.5V2.75M19.5 12h1.75M12 19.5v1.75M2.75 12H4.5" />
        </svg>
      );
    case 'star':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 4.75 2.1 4.27 4.72.69-3.4 3.32.8 4.69L12 15.5l-4.22 2.22.8-4.69-3.4-3.32 4.72-.69Z" />
        </svg>
      );
    case 'document':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3.75h6l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 20.25V5.25A1.5 1.5 0 0 1 8.5 3.75Z" />
          <path d="M14 3.75v4h4M10 12h4M10 15.5h4" />
        </svg>
      );
    case 'users':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8.5" r="2.75" />
          <circle cx="16.25" cy="8.25" r="2.1" />
          <path d="M4.5 18a4.9 4.9 0 0 1 9 0M14 17.5a3.5 3.5 0 0 1 5.25-3" />
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

function resolveStatusTone(status) {
  const normalized = String(status || '').toLowerCase();

  if (['open', 'approved', 'completed', 'verified', 'active'].includes(normalized)) {
    return { bg: 'rgba(30,125,77,.13)', color: '#1e7d4d' };
  }

  if (['upcoming', 'submitted', 'pending', 'pending review', 'for review', 'incomplete'].includes(normalized)) {
    return { bg: 'rgba(229,163,60,.15)', color: '#a16207' };
  }

  if (['closed', 'rejected', 'archived', 'inactive'].includes(normalized)) {
    return { bg: 'rgba(195,86,75,.12)', color: '#9b3b31' };
  }

  return { bg: 'rgba(18,32,25,.08)', color: '#4a6356' };
}

function StatusBadge({ status }) {
  const tone = resolveStatusTone(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 11px',
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '.04em',
      }}
    >
      {status}
    </span>
  );
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

function HeroArtwork({ program }) {
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
        minHeight: 320,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 24,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
    >
      <img
        src={visualSource}
        alt={program.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setUseIllustration(true)}
      />

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
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.16)',
              color: theme.text,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(10px)',
            }}
          >
            {getProgramSurfaceLabel(program)}
          </span>
          <span
            style={{
              display: 'inline-flex',
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(8,16,11,.26)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
            }}
          >
            {program.municipality}
          </span>
        </div>

        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
            {program.office}
          </strong>
          <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 1.6 }}>
            Program artwork stays aligned to the actual program category instead of a random seeded photo.
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ icon, label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
        padding: '16px 18px',
        borderRadius: 20,
        background: 'rgba(255,255,255,.75)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'rgba(30,125,77,.1)',
            color: '#1e7d4d',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name={icon} size={15} />
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: '#4a6356',
          }}
        >
          {label}
        </span>
      </div>
      <strong style={{ fontSize: 14, lineHeight: 1.5, color: '#122019' }}>{value}</strong>
    </div>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 42,
        padding: '10px 14px',
        borderRadius: 999,
        border: active ? '1px solid rgba(30,125,77,.18)' : '1px solid rgba(18,32,25,.08)',
        background: active ? 'rgba(30,125,77,.12)' : 'rgba(255,255,255,.8)',
        color: active ? '#1e7d4d' : '#4a6356',
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

function ContentCard({ eyebrow, title, children }) {
  return (
    <article
      style={{
        display: 'grid',
        gap: 12,
        padding: '18px 18px 20px',
        borderRadius: 22,
        background: 'rgba(255,255,255,.76)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <div style={{ display: 'grid', gap: 5 }}>
        {eyebrow ? (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#1e7d4d',
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--pf-font-display, 'Syne', sans-serif)",
            fontSize: 22,
            lineHeight: 1.08,
            color: '#122019',
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </article>
  );
}

function Checklist({ items, emptyText }) {
  if (!items.length) {
    return (
      <div
        style={{
          padding: '20px 16px',
          borderRadius: 18,
          border: '1px dashed rgba(18,32,25,.12)',
          color: '#4a6356',
          background: 'rgba(255,255,255,.7)',
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item) => (
        <div
          key={item}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1fr)',
            gap: 10,
            alignItems: 'start',
            padding: '12px 14px',
            borderRadius: 18,
            background: 'rgba(255,255,255,.72)',
            border: '1px solid rgba(18,32,25,.08)',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              background: 'rgba(30,125,77,.1)',
              color: '#1e7d4d',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="check" size={13} />
          </span>
          <p style={{ margin: 0, color: '#33453a', lineHeight: 1.6, fontSize: 13.5 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 44,
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: '#1e7d4d',
  color: '#fff',
  fontWeight: 700,
  boxShadow: '0 12px 24px rgba(30,125,77,.18)',
};

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 44,
  padding: '10px 18px',
  borderRadius: 999,
  border: '1px solid rgba(18,32,25,.1)',
  background: 'rgba(255,255,255,.9)',
  color: '#122019',
  fontWeight: 700,
};

function OverviewTab({ program }) {
  return (
    <div className="spv-tab-grid">
      <ContentCard eyebrow="Program overview" title="Why this listing exists">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(248,250,247,.9)', border: '1px solid rgba(18,32,25,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#1e7d4d' }}>
              <Icon name="target" size={15} />
              <strong style={{ fontSize: 13 }}>Objective</strong>
            </div>
            <p style={{ margin: 0, color: '#33453a', lineHeight: 1.72, fontSize: 13.5 }}>
              {program.objective || 'No objective provided.'}
            </p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(248,250,247,.9)', border: '1px solid rgba(18,32,25,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#1e7d4d' }}>
              <Icon name="star" size={15} />
              <strong style={{ fontSize: 13 }}>Benefits</strong>
            </div>
            <p style={{ margin: 0, color: '#33453a', lineHeight: 1.72, fontSize: 13.5 }}>
              {program.benefits || 'No benefit summary provided.'}
            </p>
          </div>
        </div>
      </ContentCard>

      <ContentCard eyebrow="Coverage" title="Where the support applies">
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, color: '#33453a', lineHeight: 1.72, fontSize: 13.5 }}>
            {program.coverageNotes || 'No coverage notes provided.'}
          </p>
          <div className="spv-mini-grid">
            <HeroMetric icon="office" label="Office" value={program.office} />
            <HeroMetric icon="location" label="Municipality" value={program.municipality} />
            <HeroMetric icon="users" label="Maximum beneficiaries" value={`${getProgramCapacity(program)} slots`} />
            <HeroMetric icon="star" label="Estimated fit" value={`${program.fitScore}% match`} />
          </div>
        </div>
      </ContentCard>
    </div>
  );
}

function PrepareTab({ program }) {
  const requirements = program.requirements || [];
  const attachments = program.attachments || [];

  return (
    <div className="spv-tab-grid">
      <ContentCard eyebrow="Submission guide" title="What to prepare before applying">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(248,250,247,.9)', border: '1px solid rgba(18,32,25,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#1e7d4d' }}>
              <Icon name="document" size={15} />
              <strong style={{ fontSize: 13 }}>Submission instructions</strong>
            </div>
            <p style={{ margin: 0, color: '#33453a', lineHeight: 1.72, fontSize: 13.5 }}>
              {program.submissionInstructions || 'No submission instructions provided.'}
            </p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(248,250,247,.9)', border: '1px solid rgba(18,32,25,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#1e7d4d' }}>
              <Icon name="clock" size={15} />
              <strong style={{ fontSize: 13 }}>Additional notes</strong>
            </div>
            <p style={{ margin: 0, color: '#33453a', lineHeight: 1.72, fontSize: 13.5 }}>
              {program.additionalNotes || 'No additional notes provided.'}
            </p>
          </div>
        </div>
      </ContentCard>

      <ContentCard eyebrow="Checklist" title="Documents and references">
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#122019', marginBottom: 8 }}>
              Required documents
            </div>
            <Checklist items={requirements} emptyText="No document requirements were provided for this program." />
          </div>

          {attachments.length ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#122019', marginBottom: 8 }}>
                Program attachments
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {attachments.map((item) => (
                  <span
                    key={item}
                    style={{
                      display: 'inline-flex',
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(18,32,25,.05)',
                      color: '#4a6356',
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ContentCard>
    </div>
  );
}

function EligibilityTab({ program }) {
  return (
    <div className="spv-tab-grid">
      <ContentCard eyebrow="Eligibility" title="Who can apply">
        <Checklist items={program.eligibility || []} emptyText="No eligibility criteria were provided for this program." />
      </ContentCard>

      <ContentCard eyebrow="Program facts" title="Quick decision details">
        <div className="spv-mini-grid">
          <HeroMetric icon="calendar" label="Application period" value={formatProgramWindow(program)} />
          <HeroMetric icon="clock" label="Deadline" value={formatProgramDate(program.deadline)} />
          <HeroMetric icon="office" label="Office" value={program.office} />
          <HeroMetric icon="location" label="Municipality" value={program.municipality} />
        </div>
      </ContentCard>
    </div>
  );
}

export default function ApplicantProgramViewScreen({ session, data, actions, navigate }) {
  const selectedProgram = getProgramById(data.programs, data.composer.programId);
  const applicantApplications = getApplicantApplications(data, session);
  const existingApplication = selectedProgram
    ? applicantApplications.find((application) => application.programId === selectedProgram.id)
    : null;
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setActiveTab('overview');
  }, [selectedProgram?.id]);

  if (!selectedProgram) {
    return (
      <div style={{ display: 'grid', gap: 18, padding: '8px 0' }}>
        <Panel>
          <div style={{ padding: '26px 24px', display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                Program details
              </span>
              <h2 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 30, lineHeight: 1.02, color: '#122019' }}>
                No program selected
              </h2>
              <p style={{ margin: 0, maxWidth: 520, color: '#4a6356', lineHeight: 1.65 }}>
                Open Search Programs and choose View Program from a card to review the full listing.
              </p>
            </div>
            <div>
              <button style={primaryButtonStyle} onClick={() => navigate('/applicant/search-programs')}>
                Back to Search Programs
              </button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .spv-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          display: grid;
          gap: 20px;
          padding: 8px 0 12px;
          color: #122019;
        }
        .spv-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.06fr) minmax(320px, .94fr);
          gap: 18px;
          padding: 22px;
        }
        .spv-hero-copy,
        .spv-hero-metrics,
        .spv-tab-grid,
        .spv-mini-grid {
          display: grid;
          gap: 16px;
        }
        .spv-hero-copy {
          align-content: start;
        }
        .spv-hero-metrics,
        .spv-mini-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .spv-tab-grid {
          grid-template-columns: minmax(0, 1.02fr) minmax(300px, .98fr);
        }
        .spv-tab-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          padding: 20px 22px 0;
        }
        .spv-tab-panel {
          padding: 18px 22px 22px;
        }
        @media (max-width: 1100px) {
          .spv-hero,
          .spv-tab-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .spv-hero-metrics,
          .spv-mini-grid {
            grid-template-columns: 1fr;
          }
          .spv-hero,
          .spv-tab-panel {
            padding: 18px;
          }
          .spv-tab-bar {
            padding: 18px 18px 0;
          }
        }
      `}</style>

      <div className="spv-root">
        <Panel>
          <div className="spv-hero">
            <div className="spv-hero-copy">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: 999, background: 'rgba(18,32,25,.06)', color: '#4a6356', fontSize: 11.5, fontWeight: 700 }}>
                  {selectedProgram.category}
                </span>
                <StatusBadge status={selectedProgram.status} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: 'rgba(30,125,77,.08)', color: '#1e7d4d', fontSize: 11.5, fontWeight: 700 }}>
                  <Icon name="star" size={12} />
                  {selectedProgram.fitScore}% fit
                </span>
                {existingApplication ? <StatusBadge status={existingApplication.status} /> : null}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "var(--pf-font-display, 'Syne', sans-serif)",
                    fontSize: 'clamp(2rem, 4vw, 3.15rem)',
                    lineHeight: .96,
                    letterSpacing: '-.04em',
                    color: '#122019',
                  }}
                >
                  {selectedProgram.title}
                </h1>
                <p style={{ margin: 0, color: '#4a6356', fontSize: 14, lineHeight: 1.72, maxWidth: 700 }}>
                  {selectedProgram.description || selectedProgram.summary}
                </p>
              </div>

              <div className="spv-hero-metrics">
                <HeroMetric icon="office" label="Office" value={selectedProgram.office} />
                <HeroMetric icon="location" label="Municipality" value={selectedProgram.municipality} />
                <HeroMetric icon="calendar" label="Application period" value={formatProgramWindow(selectedProgram)} />
                <HeroMetric icon="clock" label="Deadline" value={formatProgramDate(selectedProgram.deadline)} />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button style={secondaryButtonStyle} onClick={() => navigate('/applicant/search-programs')}>
                  <Icon name="arrow-left" size={14} />
                  Back to Search Programs
                </button>
                {existingApplication ? (
                  <button style={primaryButtonStyle} onClick={() => navigate('/applicant/manage-applications')}>
                    Go to Manage Applications
                    <Icon name="arrow-right" size={14} />
                  </button>
                ) : (
                  <button style={primaryButtonStyle} onClick={() => actions.startApplication(selectedProgram.id)}>
                    Apply for this Program
                    <Icon name="arrow-right" size={14} />
                  </button>
                )}
              </div>
            </div>

            <HeroArtwork program={selectedProgram} />
          </div>
        </Panel>

        {existingApplication ? (
          <Panel>
            <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong style={{ fontSize: 15, color: '#122019' }}>Existing application found</strong>
                <span style={{ fontSize: 13, color: '#4a6356', lineHeight: 1.6 }}>
                  You already have an application for this program. Continue from Manage Applications to track the latest progress.
                </span>
              </div>
              <StatusBadge status={existingApplication.status} />
            </div>
          </Panel>
        ) : null}

        <Panel>
          <div className="spv-tab-bar">
            <TabButton active={activeTab === 'overview'} label="Program Overview" onClick={() => setActiveTab('overview')} />
            <TabButton active={activeTab === 'prepare'} label="What to Prepare" onClick={() => setActiveTab('prepare')} />
            <TabButton active={activeTab === 'eligibility'} label="Who Can Apply" onClick={() => setActiveTab('eligibility')} />
          </div>

          <div className="spv-tab-panel">
            {activeTab === 'overview' ? <OverviewTab program={selectedProgram} /> : null}
            {activeTab === 'prepare' ? <PrepareTab program={selectedProgram} /> : null}
            {activeTab === 'eligibility' ? <EligibilityTab program={selectedProgram} /> : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
