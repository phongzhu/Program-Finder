import { useEffect, useMemo, useState } from 'react';
import {
  canApplicantApplyToProgram,
  getApplicantApplications,
  getApplicantSearchSurvey,
  getApplicantVisiblePrograms,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  isProgramIntakeEnded,
} from 'Services/Applicant/applicant-utils';

function Icon({ name, size = 16 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'bookmark':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M7.25 5h9.5v14l-4.75-2.9L7.25 19Z" />
        </svg>
      );
    case 'bookmark-filled':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M7.25 5h9.5v14l-4.75-2.9L7.25 19Z" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'office':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M4 9l8-5 8 5" />
        </svg>
      );
    case 'location':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
    case 'more':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.7">
          <circle cx="6" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="18" cy="12" r="1.8" />
        </svg>
      );
    case 'grid':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'list':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6h11M9 12h11M9 18h11" />
          <circle cx="5" cy="6" r="1" fill="currentColor" />
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="5" cy="18" r="1" fill="currentColor" />
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

function Panel({ children, className = '', style }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--pf-card, rgba(255,255,255,.95))',
        borderRadius: 12,
        border: '1px solid var(--pf-workspace-border, rgba(18,32,25,.12))',
        boxShadow: '0 8px 20px color-mix(in srgb, var(--pf-setting-primary, #1b355e) 8%, transparent)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Chip({ children, tone = 'neutral', icon = null }) {
  return (
    <span className={`bk-chip bk-chip-${tone}`}>
      {icon}
      {children}
    </span>
  );
}

function parseDateValue(value, endOfDay = false) {
  if (!value) {
    return null;
  }
  const normalized = String(value).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T${endOfDay ? '23:59:59' : '12:00:00'}`)
    : new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getProgramDeadlineDate(program) {
  const candidates = [program?.applicationEndDate, program?.deadline]
    .map((value) => parseDateValue(value, true))
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime());
  return candidates[0] || null;
}

function getDaysRemaining(date) {
  if (!date) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateLabel(date) {
  if (!date) {
    return 'No deadline set';
  }
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(date);
}

function getBookmarkState(program, hasExistingApplication) {
  const intakeEnded = isProgramIntakeEnded(program);
  const canApplyNow = canApplicantApplyToProgram(program);
  const deadlineDate = getProgramDeadlineDate(program);
  const daysRemaining = getDaysRemaining(deadlineDate);
  const isClosingSoon = typeof daysRemaining === 'number' && daysRemaining >= 0 && daysRemaining <= 7;

  if (intakeEnded) {
    return {
      tone: 'ended',
      ctaLabel: 'Notify Next Cycle',
      ctaAction: 'notify',
      intakeEnded,
      canApplyNow,
      isClosingSoon,
      deadlineDate,
      daysRemaining,
    };
  }

  if (hasExistingApplication) {
    return {
      tone: 'applied',
      ctaLabel: 'View Application Status',
      ctaAction: 'status',
      intakeEnded,
      canApplyNow,
      isClosingSoon,
      deadlineDate,
      daysRemaining,
    };
  }

  if (canApplyNow) {
    return {
      tone: isClosingSoon ? 'urgent' : 'ready',
      ctaLabel: 'Apply Now',
      ctaAction: 'apply',
      intakeEnded,
      canApplyNow,
      isClosingSoon,
      deadlineDate,
      daysRemaining,
    };
  }

  return {
    tone: 'neutral',
    ctaLabel: 'View Program',
    ctaAction: 'view',
    intakeEnded,
    canApplyNow,
    isClosingSoon,
    deadlineDate,
    daysRemaining,
  };
}

function ProgramThumbnail({ program }) {
  const photoSource = getProgramPhotoSource(program);
  const illustrationSource = getProgramIllustrationSource(program);
  const [useIllustration, setUseIllustration] = useState(!photoSource);

  useEffect(() => {
    setUseIllustration(!photoSource);
  }, [photoSource, program?.id]);

  const source = useIllustration ? illustrationSource : photoSource;
  const label = String(program?.title || 'Program').slice(0, 2).toUpperCase();

  return (
    <div className="bk-thumb">
      {source ? (
        <img
          src={source}
          alt={program.title}
          loading="lazy"
          onError={() => setUseIllustration(true)}
        />
      ) : null}
      <span className="bk-thumb-fallback" aria-hidden={source ? 'true' : 'false'}>
        {label}
      </span>
    </div>
  );
}

function statusBadgeLabel(statusValue) {
  const normalized = String(statusValue || '').toLowerCase();
  if (normalized === 'open') {
    return 'Open';
  }
  if (normalized === 'upcoming') {
    return 'Upcoming';
  }
  return 'Intake ended';
}

function formatSearchMode(mode) {
  if (mode === 'open-now') return 'Open now';
  if (mode === 'my-area') return 'My area first';
  return 'Browse all programs';
}

export default function BookmarksScreen({ session, data, actions, navigate }) {
  const [filterKey, setFilterKey] = useState('all');
  const [sortKey, setSortKey] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');

  const applicantVisiblePrograms = useMemo(() => getApplicantVisiblePrograms(data), [data]);
  const applicantApplications = useMemo(() => getApplicantApplications(data, session), [data, session]);
  const existingIds = useMemo(
    () => new Set(applicantApplications.map((application) => application.programId)),
    [applicantApplications]
  );

  const bookmarkOrderMap = useMemo(() => {
    const map = new Map();
    (data.bookmarks || []).forEach((programId, index) => map.set(programId, index));
    return map;
  }, [data.bookmarks]);

  const bookmarkedPrograms = useMemo(
    () => applicantVisiblePrograms.filter((program) => data.bookmarks.includes(program.id)),
    [applicantVisiblePrograms, data.bookmarks]
  );

  const stats = useMemo(() => {
    const ready = bookmarkedPrograms.filter((program) => !existingIds.has(program.id) && canApplicantApplyToProgram(program)).length;
    const ended = bookmarkedPrograms.filter((program) => isProgramIntakeEnded(program)).length;
    const applied = bookmarkedPrograms.filter((program) => existingIds.has(program.id)).length;
    return { ready, ended, applied };
  }, [bookmarkedPrograms, existingIds]);

  const filteredAndSortedPrograms = useMemo(() => {
    const filtered = bookmarkedPrograms.filter((program) => {
      const hasExisting = existingIds.has(program.id);
      const intakeEnded = isProgramIntakeEnded(program);
      const canApplyNow = canApplicantApplyToProgram(program);

      if (filterKey === 'ready') return canApplyNow && !hasExisting && !intakeEnded;
      if (filterKey === 'applied') return hasExisting;
      if (filterKey === 'ended') return intakeEnded;
      return true;
    });

    const list = [...filtered];

    if (sortKey === 'deadline') {
      list.sort((left, right) => {
        const leftDate = getProgramDeadlineDate(left);
        const rightDate = getProgramDeadlineDate(right);
        const leftValue = leftDate ? leftDate.getTime() : Number.MAX_SAFE_INTEGER;
        const rightValue = rightDate ? rightDate.getTime() : Number.MAX_SAFE_INTEGER;
        if (leftValue !== rightValue) {
          return leftValue - rightValue;
        }
        return String(left.title || '').localeCompare(String(right.title || ''));
      });
      return list;
    }

    if (sortKey === 'alpha') {
      list.sort((left, right) => String(left.title || '').localeCompare(String(right.title || '')));
      return list;
    }

    list.sort((left, right) => {
      const leftIndex = bookmarkOrderMap.get(left.id);
      const rightIndex = bookmarkOrderMap.get(right.id);
      const safeLeft = Number.isFinite(leftIndex) ? leftIndex : Number.MAX_SAFE_INTEGER;
      const safeRight = Number.isFinite(rightIndex) ? rightIndex : Number.MAX_SAFE_INTEGER;
      return safeRight - safeLeft;
    });

    return list;
  }, [bookmarkedPrograms, existingIds, filterKey, sortKey, bookmarkOrderMap]);

  const nonBookmarkedSuggestions = useMemo(
    () => applicantVisiblePrograms.filter((program) => !data.bookmarks.includes(program.id)).slice(0, 5),
    [applicantVisiblePrograms, data.bookmarks]
  );

  const searchSurvey = getApplicantSearchSurvey(data?.applicantProfile || {});

  const handlePrimaryAction = (program, bookmarkState) => {
    if (bookmarkState.ctaAction === 'apply') {
      actions.startApplication(program.id);
      return;
    }

    if (bookmarkState.ctaAction === 'status') {
      if (typeof navigate === 'function') {
        navigate('/applicant/manage-applications');
      } else {
        actions.openProgramDetails(program.id);
      }
      return;
    }

    actions.openProgramDetails(program.id);
  };

  const headerSummary = `${stats.ready} ready to apply · ${stats.ended} intake ended · ${stats.applied} already applied`;

  return (
    <>
      <style>{`
        .bk-root {
          font-family: var(--pf-font-body, var(--font-body, 'Public Sans', system-ui, sans-serif));
          display: grid;
          gap: 12px;
          padding: 8px 0 12px;
          color: var(--pf-workspace-ink, var(--pf-setting-primary-text));
        }
        .bk-header-shell {
          background: transparent;
          border-bottom: 1px solid #d9e1ec;
          padding: 0 2px 10px;
        }
        .bk-header {
          padding: 8px 0 0;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .bk-header-title {
          display: grid;
          gap: 4px;
        }
        .bk-header-title h2 {
          margin: 0;
          font-size: 1.14rem;
          font-family: var(--pf-font-display, var(--font-body));
          color: var(--pf-workspace-ink, var(--pf-setting-primary-text));
        }
        .bk-header-title p {
          margin: 0;
          font-size: .82rem;
          color: var(--pf-workspace-muted, #5a6775);
          line-height: 1.45;
        }
        .bk-controls {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .bk-select {
          height: 34px;
          border-radius: 8px;
          border: 1px solid var(--pf-workspace-border, rgba(18,32,25,.14));
          background: #fff;
          color: var(--pf-workspace-ink, var(--pf-setting-primary-text));
          padding: 0 10px;
          font-size: .8rem;
          font-weight: 600;
        }
        .bk-view-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: 1px solid var(--pf-workspace-border, rgba(18,32,25,.14));
          background: #fff;
          border-radius: 10px;
          padding: 3px;
        }
        .bk-view-toggle button {
          height: 28px;
          min-width: 32px;
          border-radius: 7px;
          border: 0;
          background: transparent;
          color: #5e6e84;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .bk-view-toggle button.is-active {
          background: var(--pf-setting-primary, #153763);
          color: var(--pf-setting-tertiary-text, #fff);
        }
        .bk-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          align-items: start;
          gap: 14px;
        }
        .bk-main,
        .bk-side {
          display: grid;
          gap: 14px;
          min-width: 0;
        }
        .bk-programs {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 12px;
        }
        .bk-programs.view-list {
          grid-template-columns: 1fr;
        }
        .bk-card {
          border: 1px solid var(--pf-workspace-border, rgba(18,32,25,.12));
          border-radius: 12px;
          background: #fff;
          padding: 12px;
          display: grid;
          gap: 10px;
          min-height: 0;
          transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease;
        }
        .bk-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px color-mix(in srgb, var(--pf-setting-primary, #1a3763) 10%, transparent);
        }
        .bk-card[data-state='ready'] {
          border-left: 4px solid #2e8a5f;
        }
        .bk-card[data-state='applied'] {
          border-left: 4px solid var(--pf-setting-primary, #1a3763);
        }
        .bk-card[data-state='urgent'] {
          border-left: 4px solid #cd7a20;
        }
        .bk-card[data-state='ended'] {
          border-left: 4px solid #8d96a5;
          filter: saturate(.9);
        }
        .bk-card-top {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 8px;
        }
        .bk-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: .66rem;
          letter-spacing: .03em;
          font-weight: 700;
          white-space: nowrap;
        }
        .bk-chip-neutral {
          background: #eef2f7;
          color: #27496f;
        }
        .bk-chip-state-open {
          background: #e5f4ec;
          color: #1f734e;
        }
        .bk-chip-state-upcoming {
          background: #edf1fb;
          color: #2b4f83;
        }
        .bk-chip-state-ended {
          background: #eceef2;
          color: #5d6777;
        }
        .bk-chip-applied {
          background: #e7edf8;
          color: #23497d;
        }
        .bk-chip-urgent {
          background: #fff2e3;
          color: #99520f;
        }
        .bk-icon-btn {
          border: 1px solid var(--pf-workspace-border, rgba(18,32,25,.12));
          background: #fff;
          color: #42536a;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .bk-card-body {
          display: grid;
          gap: 10px;
        }
        .bk-card-info {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }
        .bk-thumb {
          width: 76px;
          height: 76px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #dbe4f0;
          background: linear-gradient(140deg, #dce6f4 0%, #f3f7fd 100%);
          position: relative;
        }
        .bk-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          position: relative;
          z-index: 2;
        }
        .bk-thumb-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: .85rem;
          font-weight: 800;
          letter-spacing: .04em;
          color: #23456d;
          z-index: 1;
        }
        .bk-card-title {
          margin: 0;
          font-size: 1rem;
          line-height: 1.3;
          color: var(--pf-workspace-ink, var(--pf-setting-primary-text));
        }
        .bk-meta {
          display: grid;
          gap: 6px;
        }
        .bk-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #5a6778;
          font-size: .79rem;
          line-height: 1.45;
        }
        .bk-status-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .bk-actions {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 8px;
          align-items: center;
        }
        .bk-primary-btn {
          min-height: 36px;
          border-radius: 9px;
          border: 0;
          background: var(--pf-setting-primary, #1a3763);
          color: var(--pf-setting-tertiary-text, #fff);
          font-size: .8rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }
        .bk-primary-btn.ended {
          background: #5f6b7e;
        }
        .bk-primary-btn.ready {
          background: #2e8a5f;
        }
        .bk-primary-btn.urgent {
          background: #b56a1e;
        }
        .bk-empty {
          padding: 40px 20px;
          border: 1px dashed var(--pf-workspace-border, rgba(18,32,25,.2));
          border-radius: 12px;
          background: #fff;
          display: grid;
          gap: 8px;
          justify-items: center;
          text-align: center;
        }
        .bk-empty-art {
          width: 62px;
          height: 62px;
          border-radius: 16px;
          background: linear-gradient(145deg, #dfe9f6 0%, #f4f8fe 100%);
          color: #28486e;
          display: grid;
          place-items: center;
        }
        .bk-empty h3 {
          margin: 0;
          font-size: 1.02rem;
          color: var(--pf-workspace-ink, var(--pf-setting-primary-text));
        }
        .bk-empty p {
          margin: 0;
          font-size: .83rem;
          color: var(--pf-workspace-muted, #5a6778);
          line-height: 1.5;
          max-width: 460px;
        }
        .bk-empty button {
          margin-top: 4px;
          border: 0;
          border-radius: 9px;
          background: var(--pf-setting-primary, #1a3763);
          color: var(--pf-setting-tertiary-text, #fff);
          min-height: 36px;
          padding: 0 12px;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .bk-side-card {
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .bk-side-card h3 {
          margin: 0;
          font-size: .9rem;
          color: #1e3f67;
        }
        .bk-side-card p {
          margin: 0;
          font-size: .77rem;
          line-height: 1.45;
          color: #5f6f84;
        }
        .bk-side-chip-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .bk-mini-list {
          display: grid;
          gap: 7px;
        }
        .bk-mini-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 9px;
          border-radius: 9px;
          border: 1px solid #dce5f0;
          background: #fff;
        }
        .bk-mini-item strong {
          display: block;
          font-size: .76rem;
          color: #2b4567;
          line-height: 1.35;
        }
        .bk-mini-item button {
          border: 1px solid var(--pf-workspace-border, rgba(18,32,25,.16));
          border-radius: 7px;
          background: #fff;
          color: #314b6d;
          height: 28px;
          padding: 0 9px;
          font-size: .72rem;
          font-weight: 700;
          cursor: pointer;
        }
        @media (max-width: 1180px) {
          .bk-layout {
            grid-template-columns: 1fr;
          }
          .bk-side {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 980px) {
          .bk-programs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .bk-header {
            padding: 6px 0 0;
          }
          .bk-header-title h2 {
            font-size: 1.03rem;
          }
          .bk-programs,
          .bk-side {
            grid-template-columns: 1fr;
          }
          .bk-card-info {
            grid-template-columns: 64px minmax(0, 1fr);
          }
          .bk-thumb {
            width: 64px;
            height: 64px;
          }
        }
      `}</style>

      <div className="bk-root">
        <div className="bk-header-shell">
          <div className="bk-header">
            <div className="bk-header-title">
              <h2>Bookmarks ({bookmarkedPrograms.length})</h2>
              <p>{headerSummary}</p>
            </div>

            <div className="bk-controls">
              <select className="bk-select" value={filterKey} onChange={(event) => setFilterKey(event.target.value)}>
                <option value="all">Filter: All</option>
                <option value="ready">Filter: Ready to apply</option>
                <option value="applied">Filter: Already applied</option>
                <option value="ended">Filter: Intake ended</option>
              </select>

              <select className="bk-select" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                <option value="recent">Sort: Recently saved</option>
                <option value="deadline">Sort: Deadline soonest</option>
                <option value="alpha">Sort: Alphabetical</option>
              </select>

              <div className="bk-view-toggle" role="group" aria-label="View toggle">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  aria-label="Grid view"
                  onClick={() => setViewMode('grid')}
                >
                  <Icon name="grid" size={14} />
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                >
                  <Icon name="list" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bk-layout">
          <div className="bk-main">
            {filteredAndSortedPrograms.length ? (
              <div className={`bk-programs ${viewMode === 'list' ? 'view-list' : ''}`}>
                {filteredAndSortedPrograms.map((program) => {
                  const hasExistingApplication = existingIds.has(program.id);
                  const bookmarkState = getBookmarkState(program, hasExistingApplication);
                  const statusTone = bookmarkState.intakeEnded
                    ? 'ended'
                    : String(program.status || '').toLowerCase() === 'upcoming'
                      ? 'upcoming'
                      : 'open';

                  return (
                    <article className="bk-card" data-state={bookmarkState.tone} key={program.id}>
                      <div className="bk-card-top">
                        <div className="bk-status-row">
                          <Chip>{program.category || 'General assistance'}</Chip>
                          <Chip tone={`state-${statusTone}`}>{statusBadgeLabel(program.status)}</Chip>
                          {hasExistingApplication ? (
                            <Chip tone="applied" icon={<Icon name="check" size={12} />}>Applied</Chip>
                          ) : (
                            <Chip tone="neutral">Not applied</Chip>
                          )}
                          {bookmarkState.isClosingSoon ? (
                            <Chip tone="urgent">Closes in {bookmarkState.daysRemaining} day{bookmarkState.daysRemaining === 1 ? '' : 's'}</Chip>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className="bk-icon-btn"
                          aria-label="Toggle bookmark"
                          onClick={() => actions.toggleBookmark(program.id)}
                        >
                          <Icon name="bookmark-filled" size={14} />
                        </button>
                      </div>

                      <div className="bk-card-body">
                        <div className="bk-card-info">
                          <ProgramThumbnail program={program} />

                          <div className="bk-meta">
                            <h3 className="bk-card-title">{program.title}</h3>
                            <span className="bk-meta-item">
                              <Icon name="office" size={13} />
                              {program.office}
                            </span>
                            <span className="bk-meta-item">
                              <Icon name="location" size={13} />
                              {program.municipality}
                            </span>
                            <span className="bk-meta-item">
                              Deadline: {formatDateLabel(bookmarkState.deadlineDate)}
                            </span>
                          </div>
                        </div>

                        <div className="bk-actions">
                          <button
                            type="button"
                            className={`bk-primary-btn ${bookmarkState.tone}`}
                            onClick={() => handlePrimaryAction(program, bookmarkState)}
                          >
                            {bookmarkState.ctaLabel}
                            <Icon name="arrow-right" size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Panel className="bk-empty">
                <div className="bk-empty-art" aria-hidden="true">
                  <Icon name="bookmark" size={24} />
                </div>
                <h3>No saved programs yet</h3>
                <p>Bookmark programs you are interested in so you can come back to them later.</p>
                <button type="button" onClick={() => navigate('/applicant/search-programs')}>
                  Browse Programs
                </button>
              </Panel>
            )}

          </div>

          <aside className="bk-side">
            <Panel className="bk-side-card">
              <h3>Saved searches</h3>
              <p>Your last search setup is available anytime in Search Programs.</p>
              <div className="bk-side-chip-row">
                <Chip tone="neutral">{searchSurvey.interestCategory || 'All categories'}</Chip>
                <Chip tone="neutral">{formatSearchMode(searchSurvey.discoveryMode)}</Chip>
                <Chip tone="neutral">{data?.applicantProfile?.municipality || 'Bulacan scope'}</Chip>
              </div>
              <button
                type="button"
                className="bk-primary-btn"
                onClick={() => navigate('/applicant/search-programs')}
              >
                Open Search Programs
              </button>
            </Panel>

            <Panel className="bk-side-card">
              <h3>You might also save</h3>
              <p>Programs you have not bookmarked yet.</p>
              <div className="bk-mini-list">
                {nonBookmarkedSuggestions.length ? nonBookmarkedSuggestions.map((program) => (
                  <div className="bk-mini-item" key={`suggest-${program.id}`}>
                    <strong>{program.title}</strong>
                    <button type="button" onClick={() => actions.toggleBookmark(program.id)}>Save</button>
                  </div>
                )) : (
                  <p>All visible programs are already in your bookmarks.</p>
                )}
              </div>
            </Panel>
          </aside>
        </div>

      </div>
    </>
  );
}
