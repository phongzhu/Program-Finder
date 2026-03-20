import { useEffect, useMemo, useState } from 'react';
import {
  formatProgramDate,
  formatProgramWindow,
  getApplicantApplications,
  getProgramById,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  getProgramSurfaceLabel,
  getProgramVisualTheme,
} from './helpers';

function Icon({ name, size = 16 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'arrow-right':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'search':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.2-4.2" />
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
    case 'calendar':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 3v6M16 3v6M4 10h16" />
        </svg>
      );
    case 'document':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3.75h6.8L20 8.95V19a2 2 0 0 1-2 2H8A2 2 0 0 1 6 19V5.75a2 2 0 0 1 2-2Z" />
          <path d="M14 3.75V9h5.25" />
        </svg>
      );
    case 'user':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c1.8-3.4 4-5 7-5s5.2 1.6 7 5" />
        </svg>
      );
    case 'close':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 6 12 12M18 6 6 18" />
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

function Divider({ style }) {
  return <div style={{ height: 1, background: 'rgba(18,32,25,.07)', margin: '0 22px', ...style }} />;
}

function MetricCard({ label, value, detail }) {
  return (
    <article
      style={{
        display: 'grid',
        gap: 4,
        padding: 18,
        borderRadius: 22,
        background: 'rgba(255,255,255,.84)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <span style={{ color: '#4a6356', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <strong style={{ fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 34, lineHeight: 0.95 }}>
        {value}
      </strong>
      <span style={{ color: '#4a6356', fontSize: 13, lineHeight: 1.55 }}>{detail}</span>
    </article>
  );
}

function StatusChip({ status }) {
  const tones = {
    Submitted: { background: 'rgba(30,125,77,.12)', color: '#1e7d4d' },
    'For Review': { background: 'rgba(73,114,214,.12)', color: '#3756b6' },
    Incomplete: { background: 'rgba(229,163,60,.16)', color: '#a16207' },
    Approved: { background: 'rgba(30,125,77,.16)', color: '#16643d' },
    Rejected: { background: 'rgba(195,86,75,.12)', color: '#9b3b31' },
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

function SecondaryChip({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { background: 'rgba(18,32,25,.06)', color: '#4a6356' },
    accent: { background: 'rgba(30,125,77,.08)', color: '#1e7d4d' },
    final: { background: 'rgba(38,71,58,.08)', color: '#24473a' },
    warning: { background: 'rgba(229,163,60,.12)', color: '#a16207' },
  };
  const selected = tones[tone] || tones.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: 999,
        background: selected.background,
        color: selected.color,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function FileStatusChip({ status }) {
  const tones = {
    Verified: { background: 'rgba(30,125,77,.12)', color: '#1e7d4d' },
    'Pending Review': { background: 'rgba(73,114,214,.12)', color: '#3756b6' },
    Rejected: { background: 'rgba(195,86,75,.12)', color: '#9b3b31' },
  };
  const tone = tones[status] || { background: 'rgba(18,32,25,.06)', color: '#4a6356' };

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
      {status || 'Pending Review'}
    </span>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 42,
        padding: '10px 16px',
        borderRadius: 999,
        border: active ? '1px solid rgba(30,125,77,.16)' : '1px solid rgba(18,32,25,.08)',
        background: active ? '#1e7d4d' : 'rgba(255,255,255,.92)',
        color: active ? '#fff' : '#122019',
        fontWeight: 700,
        transition: 'all .2s ease',
      }}
    >
      {children}
    </button>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 40,
        padding: '9px 14px',
        borderRadius: 999,
        border: active ? '1px solid rgba(30,125,77,.16)' : '1px solid rgba(18,32,25,.08)',
        background: active ? 'rgba(30,125,77,.12)' : 'rgba(255,255,255,.92)',
        color: active ? '#1e7d4d' : '#4a6356',
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function DetailField({ label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        padding: '14px 15px',
        borderRadius: 18,
        background: 'rgba(255,255,255,.82)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <span style={{ color: '#4a6356', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <strong style={{ fontSize: 15, lineHeight: 1.45, color: '#122019' }}>{value}</strong>
    </div>
  );
}

function ProgramArtwork({ program, height = 154 }) {
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
        height,
        overflow: 'hidden',
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <img
        src={visualSource}
        alt={program?.title || 'Program'}
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
            {program?.municipality || 'Province-wide'}
          </span>
        </div>
        <div style={{ display: 'grid', gap: 3 }}>
          <strong style={{ color: '#fff', fontSize: 17, lineHeight: 1.2 }}>{program?.office || 'Program office'}</strong>
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

function calculateApplicantAge(birthDateValue, referenceDate = new Date()) {
  if (!birthDateValue) return null;
  const birthDate = new Date(`${birthDateValue}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function displayValue(value, fallback = 'Not provided') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function getReviewPhase(status) {
  const normalized = String(status || '').toLowerCase();
  return ['approved', 'rejected', 'cancelled', 'completed'].includes(normalized) ? 'Finalized' : 'Pending';
}

function getReviewPhaseTone(status) {
  return getReviewPhase(status) === 'Finalized' ? 'final' : 'accent';
}

function getApplicationHighlight(application) {
  return (
    application.rejectionReason ||
    application.reviewerNote ||
    application.followUpNote ||
    application.history?.[0]?.detail ||
    application.notes ||
    'No submission note was provided.'
  );
}

function buildFallbackSnapshot(profile, session) {
  const age = calculateApplicantAge(profile?.birthDate);
  return {
    fullName: displayValue(profile?.fullName || session?.name),
    age: age !== null ? `${age} years old` : 'Not provided',
    birthDate: profile?.birthDate ? formatProgramDate(profile.birthDate) : 'Not provided',
    civilStatus: displayValue(profile?.civilStatus),
    email: displayValue(profile?.email || session?.email),
    phone: displayValue(profile?.phone),
    municipality: displayValue(profile?.municipality || session?.municipality),
    barangay: displayValue(profile?.barangay),
    address: displayValue(profile?.address),
    school: displayValue(profile?.school),
    course: displayValue(profile?.course),
    householdIncome: displayValue(profile?.householdIncome),
    specialCategory: displayValue(profile?.specialCategory),
    profileCompleteness: `${Number(profile?.completeness) || 0}%`,
  };
}

function buildDisplaySnapshot(snapshot, fallbackSnapshot) {
  const derivedAge =
    snapshot?.age !== null && snapshot?.age !== undefined && snapshot?.age !== ''
      ? `${snapshot.age} years old`
      : fallbackSnapshot.age;
  return {
    fullName: displayValue(snapshot?.fullName, fallbackSnapshot.fullName),
    age: derivedAge,
    birthDate: displayValue(snapshot?.birthDate ? formatProgramDate(snapshot.birthDate) : '', fallbackSnapshot.birthDate),
    civilStatus: displayValue(snapshot?.civilStatus, fallbackSnapshot.civilStatus),
    email: displayValue(snapshot?.email, fallbackSnapshot.email),
    phone: displayValue(snapshot?.phone, fallbackSnapshot.phone),
    municipality: displayValue(snapshot?.municipality, fallbackSnapshot.municipality),
    barangay: displayValue(snapshot?.barangay, fallbackSnapshot.barangay),
    address: displayValue(snapshot?.address, fallbackSnapshot.address),
    school: displayValue(snapshot?.school, fallbackSnapshot.school),
    course: displayValue(snapshot?.course, fallbackSnapshot.course),
    householdIncome: displayValue(snapshot?.householdIncome, fallbackSnapshot.householdIncome),
    specialCategory: displayValue(snapshot?.specialCategory, fallbackSnapshot.specialCategory),
    profileCompleteness:
      snapshot?.profileCompleteness !== null && snapshot?.profileCompleteness !== undefined && snapshot?.profileCompleteness !== ''
        ? `${snapshot.profileCompleteness}%`
        : fallbackSnapshot.profileCompleteness,
  };
}

export default function ManageApplicationsScreen({ session, data, actions, navigate }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [detailTab, setDetailTab] = useState('submission');

  const applications = useMemo(
    () =>
      [...getApplicantApplications(data, session)].sort((left, right) =>
        String(right.submittedAt || '').localeCompare(String(left.submittedAt || ''))
      ),
    [data, session]
  );

  const fallbackSnapshot = useMemo(() => buildFallbackSnapshot(data.applicantProfile || {}, session), [data.applicantProfile, session]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const program = getProgramById(data.programs, application.programId);
      const phase = getReviewPhase(application.status).toLowerCase();
      const haystack = [application.status, application.notes, application.office, program?.title, program?.category, program?.municipality].join(' ').toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === 'all' || phase === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, data.programs, search, statusFilter]);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) || null,
    [applications, selectedApplicationId]
  );

  const selectedProgram = selectedApplication ? getProgramById(data.programs, selectedApplication.programId) : null;
  const selectedSnapshot = useMemo(
    () => buildDisplaySnapshot(selectedApplication?.applicantSnapshot, fallbackSnapshot),
    [selectedApplication?.applicantSnapshot, fallbackSnapshot]
  );

  const pendingCount = applications.filter((application) => getReviewPhase(application.status) === 'Pending').length;
  const finalizedCount = applications.filter((application) => getReviewPhase(application.status) === 'Finalized').length;
  const approvedCount = applications.filter((application) => application.status === 'Approved').length;

  useEffect(() => {
    if (selectedApplicationId && !applications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(null);
    }
  }, [applications, selectedApplicationId]);

  useEffect(() => {
    if (!selectedApplication) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedApplicationId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedApplication]);

  return (
    <>
      <style>{`
        .ma-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          display: grid;
          gap: 20px;
          padding: 8px 0 12px;
          color: #122019;
        }
        .ma-metrics,
        .ma-grid,
        .ma-filter-grid,
        .ma-modal-grid,
        .ma-submission-grid,
        .ma-files-grid,
        .ma-profile-grid {
          display: grid;
          gap: 16px;
        }
        .ma-metrics {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .ma-filter-grid {
          grid-template-columns: minmax(0, 1.4fr) auto;
          align-items: end;
        }
        .ma-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .ma-card {
          display: flex;
          flex-direction: column;
          min-height: 446px;
          border-radius: 22px;
          overflow: hidden;
          background: rgba(255,255,255,.98);
          border: 1px solid rgba(18,32,25,.08);
          box-shadow: 0 12px 34px rgba(18,32,25,.08);
        }
        .ma-modal-shell {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .ma-modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(8,16,11,.52);
          backdrop-filter: blur(8px);
        }
        .ma-modal-dialog {
          position: relative;
          width: min(1120px, 100%);
          max-height: calc(100vh - 48px);
          overflow: auto;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(250,252,248,.99) 0%, rgba(239,244,238,.97) 100%);
          border: 1px solid rgba(255,255,255,.22);
          box-shadow: 0 24px 80px rgba(8,16,11,.24);
        }
        .ma-modal-grid {
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
        }
        .ma-submission-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ma-files-grid,
        .ma-profile-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ma-search-field::placeholder {
          color: rgba(74,99,86,.45);
        }
        @media (max-width: 1120px) {
          .ma-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .ma-modal-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 860px) {
          .ma-metrics,
          .ma-submission-grid,
          .ma-files-grid,
          .ma-profile-grid {
            grid-template-columns: 1fr;
          }
          .ma-filter-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .ma-grid {
            grid-template-columns: 1fr;
          }
          .ma-card {
            min-height: auto;
          }
          .ma-modal-shell {
            padding: 14px;
          }
          .ma-modal-dialog {
            max-height: calc(100vh - 28px);
          }
        }
      `}</style>

      <div className="ma-root">
        <Panel>
          <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                Application tracker
              </span>
              <h1 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 0.97, letterSpacing: '-.04em', color: '#122019' }}>
                Manage submissions
              </h1>
              <p style={{ margin: 0, maxWidth: 760, color: '#4a6356', fontSize: 14, lineHeight: 1.72 }}>
                Review every program you submitted to, see whether it is still pending or already finalized, and open a full details view for your files, answers, and timeline.
              </p>
            </div>

            <div className="ma-metrics">
              <MetricCard label="My applications" value={applications.length} detail="All tracked submissions in your applicant workspace." />
              <MetricCard label="Pending review" value={pendingCount} detail="Applications still moving through office review." />
              <MetricCard label="Finalized" value={finalizedCount} detail={`${approvedCount} approved and the rest resolved.`} />
            </div>
          </div>
        </Panel>

        <Panel>
          <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong style={{ fontSize: 15 }}>Submission cards</strong>
                <span style={{ color: '#4a6356', fontSize: 13, lineHeight: 1.6 }}>
                  Filter by review phase and open details without leaving the page.
                </span>
              </div>
              <SecondaryChip tone="accent">{filteredApplications.length} shown</SecondaryChip>
            </div>

            <div className="ma-filter-grid">
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#4a6356' }}>
                  Search submissions
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(74,99,86,.45)', pointerEvents: 'none' }}>
                    <Icon name="search" size={14} />
                  </span>
                  <input
                    className="ma-search-field"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by program, office, note, or status"
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '11px 14px 11px 38px',
                      borderRadius: 16,
                      border: '1px solid rgba(18,32,25,.1)',
                      background: 'rgba(255,255,255,.92)',
                      color: '#122019',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                  All
                </FilterButton>
                <FilterButton active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}>
                  Pending
                </FilterButton>
                <FilterButton active={statusFilter === 'finalized'} onClick={() => setStatusFilter('finalized')}>
                  Finalized
                </FilterButton>
              </div>
            </div>
          </div>

          <Divider />

          <div style={{ padding: '18px 22px 22px' }}>
            {filteredApplications.length ? (
              <div className="ma-grid">
                {filteredApplications.map((application) => {
                  const program = getProgramById(data.programs, application.programId);
                  const phase = getReviewPhase(application.status);
                  const fileCount = application.requirementFiles?.length || 0;

                  return (
                    <article className="ma-card" key={application.id}>
                      <ProgramArtwork program={program || { title: 'Program', office: application.office, municipality: session.municipality }} />

                      <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <StatusChip status={application.status} />
                          <SecondaryChip tone={getReviewPhaseTone(application.status)}>{phase}</SecondaryChip>
                          <SecondaryChip tone={application.completeness === 100 ? 'accent' : 'warning'}>
                            {application.completeness || 0}% ready
                          </SecondaryChip>
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
                            {program?.title || 'Program'}
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              color: '#4a6356',
                              fontSize: 13.5,
                              lineHeight: 1.68,
                              ...clampThreeLines,
                            }}
                          >
                            {program?.summary || application.notes || 'Submission details available in the full view.'}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gap: 7 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4a6356', fontSize: 12.5 }}>
                            <Icon name="office" size={13} />
                            {application.office || program?.office || 'Program office'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4a6356', fontSize: 12.5 }}>
                            <Icon name="calendar" size={13} />
                            Submitted {formatProgramDate(application.submittedAt)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4a6356', fontSize: 12.5 }}>
                            <Icon name="document" size={13} />
                            {fileCount} file{fileCount === 1 ? '' : 's'} attached
                          </span>
                        </div>

                        <div
                          style={{
                            padding: '13px 14px',
                            borderRadius: 18,
                            background: 'rgba(248,250,247,.9)',
                            border: '1px solid rgba(18,32,25,.08)',
                          }}
                        >
                          <div style={{ color: '#4a6356', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                            Latest update
                          </div>
                          <div style={{ color: '#122019', fontSize: 13.5, lineHeight: 1.65, ...clampThreeLines }}>
                            {getApplicationHighlight(application)}
                          </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
                          <button
                            type="button"
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
                            onClick={() => {
                              setSelectedApplicationId(application.id);
                              setDetailTab('submission');
                            }}
                          >
                            View Details
                            <Icon name="arrow-right" size={14} />
                          </button>

                          <button
                            type="button"
                            style={{
                              minHeight: 42,
                              borderRadius: 999,
                              border: '1px solid rgba(18,32,25,.1)',
                              background: 'rgba(255,255,255,.96)',
                              color: '#122019',
                              fontWeight: 700,
                            }}
                            onClick={() => actions.openProgramDetails(application.programId)}
                          >
                            View Program
                          </button>
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
                  No applications matched
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
                  Adjust the search or filter, or submit to a program first.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/applicant/search-programs')}
                  style={{
                    minHeight: 42,
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: '1px solid rgba(30,125,77,.16)',
                    background: '#1e7d4d',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  Browse Search Programs
                </button>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {selectedApplication && selectedProgram ? (
        <div className="ma-modal-shell" role="dialog" aria-modal="true" aria-label="Application details">
          <div className="ma-modal-backdrop" onClick={() => setSelectedApplicationId(null)} />
          <div className="ma-modal-dialog">
            <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StatusChip status={selectedApplication.status} />
                    <SecondaryChip tone={getReviewPhaseTone(selectedApplication.status)}>
                      {getReviewPhase(selectedApplication.status)}
                    </SecondaryChip>
                  </div>
                  <div style={{ display: 'grid', gap: 5 }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 'clamp(1.75rem, 4vw, 2.7rem)', lineHeight: 0.98, letterSpacing: '-.04em', color: '#122019' }}>
                      {selectedProgram.title}
                    </h2>
                    <p style={{ margin: 0, maxWidth: 760, color: '#4a6356', lineHeight: 1.7 }}>
                      Full submission view for your applicant answers, uploaded files, and review timeline.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApplicationId(null)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    border: '1px solid rgba(18,32,25,.08)',
                    background: 'rgba(255,255,255,.88)',
                    color: '#122019',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                  aria-label="Close application details"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>

              <div className="ma-modal-grid">
                <div style={{ display: 'grid', gap: 16 }}>
                  <div className="ma-submission-grid">
                    <DetailField label="Submitted" value={formatProgramDate(selectedApplication.submittedAt)} />
                    <DetailField label="Application window" value={formatProgramWindow(selectedProgram)} />
                    <DetailField label="Office" value={selectedApplication.office || selectedProgram.office} />
                    <DetailField label="Files uploaded" value={`${selectedApplication.requirementFiles?.length || 0} attached`} />
                  </div>

                  <Panel style={{ borderRadius: 22 }}>
                    <div style={{ padding: '16px 18px 18px', display: 'grid', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <TabButton active={detailTab === 'submission'} onClick={() => setDetailTab('submission')}>
                          Submission
                        </TabButton>
                        <TabButton active={detailTab === 'files'} onClick={() => setDetailTab('files')}>
                          Files
                        </TabButton>
                        <TabButton active={detailTab === 'timeline'} onClick={() => setDetailTab('timeline')}>
                          Timeline
                        </TabButton>
                      </div>

                      {detailTab === 'submission' ? (
                        <div style={{ display: 'grid', gap: 16 }}>
                          <div
                            style={{
                              display: 'grid',
                              gap: 10,
                              padding: '16px',
                              borderRadius: 20,
                              background: 'rgba(255,255,255,.84)',
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
                                <Icon name="document" size={16} />
                              </span>
                              <strong style={{ fontSize: 17 }}>Submitted notes and answers</strong>
                            </div>
                            <p style={{ margin: 0, color: '#122019', lineHeight: 1.7 }}>
                              {selectedApplication.notes || 'No supporting note was provided during submission.'}
                            </p>
                            {selectedApplication.reviewerNote || selectedApplication.rejectionReason ? (
                              <div
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 16,
                                  background: 'rgba(248,250,247,.9)',
                                  border: '1px solid rgba(18,32,25,.08)',
                                  color: '#4a6356',
                                  lineHeight: 1.65,
                                }}
                              >
                                <strong style={{ display: 'block', color: '#122019', marginBottom: 6 }}>Office note</strong>
                                {selectedApplication.reviewerNote || selectedApplication.rejectionReason}
                              </div>
                            ) : null}
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gap: 12,
                              padding: '16px',
                              borderRadius: 20,
                              background: 'rgba(255,255,255,.84)',
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
                                <Icon name="user" size={16} />
                              </span>
                              <strong style={{ fontSize: 17 }}>Read-only applicant details</strong>
                            </div>

                            <div className="ma-profile-grid">
                              <DetailField label="Full name" value={selectedSnapshot.fullName} />
                              <DetailField label="Age" value={selectedSnapshot.age} />
                              <DetailField label="Birth date" value={selectedSnapshot.birthDate} />
                              <DetailField label="Civil status" value={selectedSnapshot.civilStatus} />
                              <DetailField label="Email" value={selectedSnapshot.email} />
                              <DetailField label="Phone" value={selectedSnapshot.phone} />
                              <DetailField label="Municipality" value={selectedSnapshot.municipality} />
                              <DetailField label="Barangay" value={selectedSnapshot.barangay} />
                              <DetailField label="Address" value={selectedSnapshot.address} />
                              <DetailField label="School" value={selectedSnapshot.school} />
                              <DetailField label="Course" value={selectedSnapshot.course} />
                              <DetailField label="Household income" value={selectedSnapshot.householdIncome} />
                              <DetailField label="Special category" value={selectedSnapshot.specialCategory} />
                              <DetailField label="Profile completion" value={selectedSnapshot.profileCompleteness} />
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {detailTab === 'files' ? (
                        <div className="ma-files-grid">
                          {(selectedApplication.requirementFiles || []).length ? (
                            selectedApplication.requirementFiles.map((file) => (
                              <article
                                key={`${selectedApplication.id}-${file.requirementName}`}
                                style={{
                                  display: 'grid',
                                  gap: 10,
                                  padding: '16px',
                                  borderRadius: 20,
                                  background: 'rgba(255,255,255,.84)',
                                  border: '1px solid rgba(18,32,25,.08)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: 16, lineHeight: 1.35 }}>{file.requirementName}</strong>
                                  <FileStatusChip status={file.status} />
                                </div>
                                <div style={{ color: '#4a6356', fontSize: 13.5, lineHeight: 1.65 }}>
                                  <div>{file.fileName || 'No file name'}</div>
                                  <div>{file.fileType || 'Unknown file type'}</div>
                                  <div>Uploaded {displayValue(file.uploadedAt, 'Date not provided')}</div>
                                </div>
                                {file.fileUrl ? (
                                  <a
                                    href={file.fileUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minHeight: 40,
                                      padding: '9px 14px',
                                      borderRadius: 999,
                                      background: 'rgba(30,125,77,.08)',
                                      color: '#1e7d4d',
                                      textDecoration: 'none',
                                      fontWeight: 700,
                                      border: '1px solid rgba(30,125,77,.12)',
                                    }}
                                  >
                                    View File
                                  </a>
                                ) : (
                                  <div
                                    style={{
                                      padding: '11px 12px',
                                      borderRadius: 16,
                                      background: 'rgba(248,250,247,.9)',
                                      border: '1px dashed rgba(18,32,25,.12)',
                                      color: '#4a6356',
                                      fontSize: 13,
                                    }}
                                  >
                                    No file link available.
                                  </div>
                                )}
                              </article>
                            ))
                          ) : (
                            <div
                              style={{
                                gridColumn: '1 / -1',
                                padding: '26px 18px',
                                borderRadius: 20,
                                background: 'rgba(255,255,255,.78)',
                                border: '1px dashed rgba(18,32,25,.12)',
                                color: '#4a6356',
                                textAlign: 'center',
                              }}
                            >
                              No files were attached to this submission.
                            </div>
                          )}
                        </div>
                      ) : null}

                      {detailTab === 'timeline' ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                          {(selectedApplication.history || []).length ? (
                            selectedApplication.history.map((entry) => (
                              <article
                                key={`${selectedApplication.id}-${entry.time}-${entry.status}`}
                                style={{
                                  display: 'grid',
                                  gap: 6,
                                  padding: '16px',
                                  borderRadius: 20,
                                  background: 'rgba(255,255,255,.84)',
                                  border: '1px solid rgba(18,32,25,.08)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: 16 }}>{entry.status}</strong>
                                  <span style={{ color: '#4a6356', fontSize: 12.5 }}>{entry.time}</span>
                                </div>
                                <p style={{ margin: 0, color: '#4a6356', lineHeight: 1.65 }}>
                                  {entry.detail}
                                </p>
                              </article>
                            ))
                          ) : (
                            <div
                              style={{
                                padding: '26px 18px',
                                borderRadius: 20,
                                background: 'rgba(255,255,255,.78)',
                                border: '1px dashed rgba(18,32,25,.12)',
                                color: '#4a6356',
                                textAlign: 'center',
                              }}
                            >
                              No timeline entries are available yet.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Panel>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  <ProgramArtwork program={selectedProgram} height={214} />

                  <div
                    style={{
                      display: 'grid',
                      gap: 12,
                      padding: '16px',
                      borderRadius: 22,
                      background: 'rgba(255,255,255,.84)',
                      border: '1px solid rgba(18,32,25,.08)',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 4 }}>
                      <span style={{ color: '#4a6356', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Submission status
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <StatusChip status={selectedApplication.status} />
                        <SecondaryChip tone={getReviewPhaseTone(selectedApplication.status)}>
                          {getReviewPhase(selectedApplication.status)}
                        </SecondaryChip>
                      </div>
                    </div>

                    <DetailField label="Program office" value={selectedProgram.office} />
                    <DetailField label="Municipality" value={selectedProgram.municipality} />
                    <DetailField label="Deadline" value={formatProgramDate(selectedProgram.deadline)} />
                    <DetailField label="Requirements" value={`${selectedProgram.requirements?.length || 0} listed`} />

                    <button
                      type="button"
                      style={{
                        minHeight: 44,
                        borderRadius: 999,
                        border: 'none',
                        background: '#1e7d4d',
                        color: '#fff',
                        fontWeight: 700,
                        boxShadow: '0 12px 24px rgba(30,125,77,.18)',
                      }}
                      onClick={() => actions.openProgramDetails(selectedProgram.id)}
                    >
                      View Program
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
