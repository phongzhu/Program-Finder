import React, { useMemo, useState } from 'react';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function asCleanList(values) {
  return (Array.isArray(values) ? values : [])
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}
function unique(values) {
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))];
}
function normalizeText(v) { return String(v || '').toLowerCase().trim(); }

function computeConfidence(program) {
  const matched = asCleanList(program?.matchedCriteria).length;
  const missing = asCleanList(program?.missingDetails).length;
  const total   = Math.max(1, matched + missing);
  const ratio   = matched / total;
  const percent = Math.round(ratio * 100);
  const level   = ratio >= 0.75 ? 'Best choice' : ratio >= 0.5 ? 'Good match' : 'Okay choice';
  return { matched, total, percent, level };
}

function calculateAge(birthDate) {
  const raw = String(birthDate || '').trim();
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function estimateIncome(value) {
  const n = Number(String(value || '').replace(/[^\d.]+/g, ''));
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n <= 12000) return 'Low-income household';
  if (n <= 30000) return 'Modest-income household';
  return 'Middle-income household';
}

function formatDeadline(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

function getProfileChips(p = {}) {
  const chips = [];
  if (p.municipality) chips.push(p.municipality);
  if (p.barangay)     chips.push(p.barangay);
  if (p.educationStatus) chips.push(p.educationStatus);
  const age = calculateAge(p.birthDate);
  if (typeof age === 'number') chips.push(`Age ${age}`);
  const income = estimateIncome(p.householdIncome);
  if (income) chips.push(income);
  return unique(chips).slice(0, 6);
}

function getMissingPrompts(p = {}) {
  const missing = [];
  if (!String(p.birthDate || '').trim())          missing.push('Your birth date');
  if (!String(p.municipality || '').trim())       missing.push('Your city or municipality');
  if (!String(p.barangay || '').trim())           missing.push('Your barangay');
  if (!String(p.educationStatus || '').trim())    missing.push('Your current education status');
  if (!String(p.householdIncome || '').trim())    missing.push('Your household income');
  if (!String(p.employmentStatus || '').trim())   missing.push('Your employment status');
  return missing;
}

function getUploadedNames(docs) {
  return (Array.isArray(docs) ? docs : [])
    .map((d) => (typeof d === 'string' ? d : d?.name || d?.requirementName || ''))
    .map((n) => String(n || '').trim())
    .filter(Boolean);
}

function isUploaded(docName, uploadedNames) {
  const target = normalizeText(docName);
  if (!target) return false;
  return uploadedNames.some((n) => {
    const s = normalizeText(n);
    return s === target || s.includes(target) || target.includes(s);
  });
}

/* ─── Score bar ─────────────────────────────────────────────────────────── */
function ScoreBar({ percent, color }) {
  return (
    <div style={{
      height: 5, borderRadius: 999,
      background: 'rgba(0,0,0,0.08)',
      overflow: 'hidden', width: '100%',
    }}>
      <div style={{
        height: '100%', width: `${Math.min(100, Math.max(0, percent))}%`,
        borderRadius: 999, background: color,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

/* ─── Loading skeleton ──────────────────────────────────────────────────── */
function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg,#e8ecf3 25%,#f2f5fa 50%,#e8ecf3 75%)',
      backgroundSize: '200% 100%',
      animation: 'ai-shimmer 1.5s infinite linear',
      flexShrink: 0,
      ...style,
    }} />
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export default function AiOverviewRecommendation({
  overview,
  isLoading,
  error,
  onOpenProgram,
  applicantProfile = {},
  uploadedDocuments = [],
  onCompleteProfile = null,
  resolveProgramByTitle = null,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const recommendedPrograms = useMemo(
    () => (Array.isArray(overview?.recommendedPrograms) ? overview.recommendedPrograms : []),
    [overview?.recommendedPrograms]
  );

  const scoredPrograms = useMemo(
    () => recommendedPrograms.map((p) => ({ ...p, confidence: computeConfidence(p) })),
    [recommendedPrograms]
  );

  const sortedPrograms = useMemo(
    () => [...scoredPrograms].sort((a, b) => b.confidence.percent - a.confidence.percent),
    [scoredPrograms]
  );

  const topMatch      = sortedPrograms[0] || null;
  const otherMatches  = sortedPrograms.slice(1);
  const bestCount     = topMatch ? 1 : 0;
  const okayCount     = otherMatches.length;

  const profileChips = useMemo(() => getProfileChips(applicantProfile), [applicantProfile]);
  const missingProfile = useMemo(() => getMissingPrompts(applicantProfile), [applicantProfile]);

  const allRequiredDocuments = useMemo(
    () => unique(sortedPrograms.flatMap((p) => asCleanList(p?.requiredDocuments))),
    [sortedPrograms]
  );
  const uploadedNames = useMemo(() => getUploadedNames(uploadedDocuments), [uploadedDocuments]);

  const topMatchData = useMemo(() => {
    if (!topMatch || typeof resolveProgramByTitle !== 'function') return null;
    return resolveProgramByTitle(topMatch.title);
  }, [topMatch, resolveProgramByTitle]);

  /* Collapsed bar label */
  const collapsedLabel = useMemo(() => {
    if (isLoading) return 'Analyzing your profile and finding the best matches…';
    if (error)     return 'AI recommendations unavailable right now.';
    if (!sortedPrograms.length) return 'No matches yet — try updating your filters or profile.';
    const dist = bestCount > 0
      ? `${sortedPrograms.length} program${sortedPrograms.length !== 1 ? 's' : ''} match your profile — ${bestCount} best choice, ${okayCount} okay choice${okayCount !== 1 ? 's' : ''}.`
      : `${sortedPrograms.length} program${sortedPrograms.length !== 1 ? 's' : ''} may match your profile.`;
    return dist;
  }, [isLoading, error, sortedPrograms.length, bestCount, okayCount]);

  if (!isLoading && !error && !overview) return null;

  return (
    <section aria-live="polite" className="ai-rec">
      <style>{`
        @keyframes ai-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Outer shell ──────────────────────────────────────────── */
        .ai-rec {
          --ai-accent: var(--pf-accent, #0f2f63);
          --ai-accent-ink: var(--pf-ink, #243143);
          --ai-accent-soft: color-mix(in srgb, var(--ai-accent) 10%, white);
          --ai-accent-border: color-mix(in srgb, var(--ai-accent) 26%, white);
          --ai-accent-muted: color-mix(in srgb, var(--ai-accent) 58%, #6f7f95);
          --ai-secondary: var(--warning, var(--pf-amber, #d69436));
          --ai-secondary-soft: color-mix(in srgb, var(--ai-secondary) 14%, white);
          --ai-secondary-border: color-mix(in srgb, var(--ai-secondary) 36%, white);
          --ai-secondary-strong: color-mix(in srgb, var(--ai-secondary) 72%, #4b2d06);
          border-radius: 16px;
          border: 1.5px solid var(--ai-accent-border);
          background: linear-gradient(160deg, var(--ai-accent-soft) 0%, #f8faff 100%);
          overflow: hidden;
          box-shadow: 0 2px 14px color-mix(in srgb, var(--ai-accent) 10%, transparent);
        }

        /* ── Collapsed header bar ─────────────────────────────────── */
        .ai-rec-bar {
          width: 100%;
          border: none;
          background: transparent;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-align: left;
          transition: background 0.14s;
        }
        .ai-rec-bar:hover { background: color-mix(in srgb, var(--ai-accent) 5%, transparent); }
        .ai-rec-bar-icon {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
        }
        .ai-rec-bar-text {
          flex: 1;
          min-width: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--ai-accent-ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ai-rec-bar-text.is-error  { color: #7a3830; }
        .ai-rec-toggle {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--ai-secondary) 16%, white);
          color: color-mix(in srgb, var(--ai-secondary) 82%, #2e1a05);
          font-size: 12.5px;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid var(--ai-secondary-border);
        }

        /* ── Body (expanded) ──────────────────────────────────────── */
        .ai-rec-body {
          padding: 0 18px 20px;
          display: grid;
          gap: 16px;
          border-top: 1px solid var(--ai-accent-border);
        }

        /* summary */
        .ai-rec-summary {
          padding-top: 16px;
          display: grid;
          gap: 6px;
        }
        .ai-rec-summary-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ai-accent-muted);
        }
        .ai-rec-summary-text {
          font-size: 14px;
          line-height: 1.65;
          color: var(--ai-accent-ink);
          margin: 0;
        }

        /* ── Top match card ───────────────────────────────────────── */
        .ai-rec-top {
          border-radius: 13px;
          border: 1.5px solid var(--ai-secondary-border);
          background: linear-gradient(135deg, var(--ai-secondary-soft) 0%, #fffdf8 100%);
          padding: 16px;
          display: grid;
          gap: 10px;
        }
        .ai-rec-top-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ai-rec-top-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--ai-secondary) 20%, white);
          color: var(--ai-secondary-strong);
          border: 1px solid var(--ai-secondary-border);
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
        }
        .ai-rec-top-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: var(--ai-accent-ink);
          line-height: 1.3;
        }
        .ai-rec-score-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ai-rec-score-label {
          font-size: 12.5px;
          font-weight: 700;
          white-space: nowrap;
        }
        .ai-rec-deadline {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          color: color-mix(in srgb, var(--ai-accent) 58%, #5d6e84);
          white-space: nowrap;
        }
        .ai-rec-top-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .ai-rec-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          border-radius: 9px;
          background: var(--ai-accent);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ai-rec-btn-primary:hover { background: color-mix(in srgb, var(--ai-accent) 88%, black); }

        /* ── Other matches ────────────────────────────────────────── */
        .ai-rec-others-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--ai-accent-ink);
          margin-bottom: 2px;
        }
        .ai-rec-other-card {
          border-radius: 11px;
          border: 1px solid var(--ai-accent-border);
          background: rgba(255,255,255,0.7);
          padding: 13px 14px;
          display: grid;
          gap: 8px;
        }
        .ai-rec-other-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ai-rec-other-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--ai-accent) 14%, white);
          color: var(--ai-accent-ink);
          border: 1px solid var(--ai-accent-border);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ai-rec-other-title {
          margin: 0;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--ai-accent-ink);
          line-height: 1.3;
          flex: 1;
          min-width: 0;
        }
        .ai-rec-other-reason {
          margin: 0;
          font-size: 13px;
          color: color-mix(in srgb, var(--ai-accent) 62%, #66798f);
          line-height: 1.55;
        }
        .ai-rec-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid var(--ai-accent-border);
          border-radius: 8px;
          background: #ffffff;
          color: var(--ai-accent-ink);
          font-size: 12.5px;
          font-weight: 700;
          padding: 6px 12px;
          cursor: pointer;
          transition: background 0.14s, border-color 0.14s;
        }
        .ai-rec-btn-ghost:hover {
          background: color-mix(in srgb, var(--ai-accent) 8%, white);
          border-color: color-mix(in srgb, var(--ai-accent) 32%, white);
        }

        /* ── Profile chips ────────────────────────────────────────── */
        .ai-rec-chips-section { display: grid; gap: 8px; }
        .ai-rec-chips-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--ai-accent-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-rec-chips-rail {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .ai-rec-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
        }
        .ai-rec-chip.matched {
          background: color-mix(in srgb, var(--ai-accent) 10%, white);
          color: var(--ai-accent-ink);
          border: 1px solid var(--ai-accent-border);
        }
        .ai-rec-chip.doc-ready {
          background: color-mix(in srgb, var(--ai-secondary) 18%, white);
          color: var(--ai-secondary-strong);
          border: 1px solid var(--ai-secondary-border);
        }
        .ai-rec-chip.doc-missing {
          background: color-mix(in srgb, var(--ai-accent) 8%, white);
          color: color-mix(in srgb, var(--ai-accent) 72%, #516277);
          border: 1px solid var(--ai-accent-border);
        }

        /* ── Improve matches warning ──────────────────────────────── */
        .ai-rec-warning {
          border-radius: 11px;
          border: 1px solid var(--ai-secondary-border);
          background: linear-gradient(135deg, color-mix(in srgb, var(--ai-secondary) 12%, white) 0%, color-mix(in srgb, var(--ai-secondary) 18%, white) 100%);
          padding: 14px 16px;
          display: grid;
          gap: 10px;
        }
        .ai-rec-warning-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          color: var(--ai-secondary-strong);
        }
        .ai-rec-warning ul {
          margin: 0;
          padding-left: 18px;
          color: color-mix(in srgb, var(--ai-secondary) 78%, #4d3112);
          font-size: 13px;
          line-height: 1.65;
        }
        .ai-rec-btn-warm {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--ai-secondary-border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--ai-secondary) 15%, white);
          color: var(--ai-secondary-strong);
          font-size: 12.5px;
          font-weight: 700;
          padding: 7px 12px;
          cursor: pointer;
          transition: background 0.14s;
        }
        .ai-rec-btn-warm:hover { background: color-mix(in srgb, var(--ai-secondary) 24%, white); }

        /* ── Loading state ────────────────────────────────────────── */
        .ai-rec-loading {
          padding: 18px 18px 22px;
          display: grid;
          gap: 14px;
          border-top: 1px solid #d5e0f5;
        }

        /* ── Error state ──────────────────────────────────────────── */
        .ai-rec-error {
          padding: 16px 18px;
          border-top: 1px solid #f0c8c5;
          font-size: 13.5px;
          color: #8c3830;
          line-height: 1.55;
        }

        @media (max-width: 620px) {
          .ai-rec-bar { padding: 12px 14px; }
          .ai-rec-body { padding: 0 14px 18px; }
          .ai-rec-top { padding: 13px; }
        }
      `}</style>

      {/* ── Collapsed header bar ──────────────────────────────────────────── */}
      <button
        type="button"
        className="ai-rec-bar"
        onClick={() => setIsExpanded((e) => !e)}
        aria-expanded={isExpanded}
      >
        <span className="ai-rec-bar-icon" aria-hidden="true">✨</span>
        <span className={`ai-rec-bar-text${error ? ' is-error' : ''}`}>
          {collapsedLabel}
        </span>
        {!isLoading && !error && overview && (
          <span className="ai-rec-toggle">
            {isExpanded
              ? <>Hide why <span aria-hidden="true">↑</span></>
              : <>See why <span aria-hidden="true">↓</span></>
            }
          </span>
        )}
      </button>

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="ai-rec-loading">
          <Skeleton width="70%" height={16} />
          <Skeleton width="90%" height={13} />
          <Skeleton width="55%" height={13} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton width={80} height={28} radius={999} />
            <Skeleton width={80} height={28} radius={999} />
            <Skeleton width={80} height={28} radius={999} />
          </div>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="ai-rec-error">
          ⚠ {error}
        </div>
      )}

      {/* ── Expanded body ─────────────────────────────────────────────────── */}
      {isExpanded && !isLoading && !error && overview && (
        <div className="ai-rec-body">

          {/* Summary */}
          {overview.summary && (
            <div className="ai-rec-summary">
              <span className="ai-rec-summary-label">AI Recommendation Summary</span>
              <p className="ai-rec-summary-text">{overview.summary}</p>
            </div>
          )}

          {/* Top match */}
          {topMatch && (
            <article className="ai-rec-top">
              <div className="ai-rec-top-header">
                <span className="ai-rec-top-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Best choice
                </span>
              </div>

              <h3 className="ai-rec-top-title">{topMatch.title}</h3>

              {topMatch.confidence.total > 0 && (
                <div>
                  <div className="ai-rec-score-row" style={{ marginBottom: 6 }}>
                    <span className="ai-rec-score-label" style={{ color: 'var(--ai-secondary-strong)' }}>
                      {topMatch.confidence.matched}/{topMatch.confidence.total} criteria met
                    </span>
                    <span className="ai-rec-score-label" style={{ color: 'var(--ai-accent-muted)', fontWeight: 400 }}>
                      {topMatch.confidence.percent}% match
                    </span>
                    {formatDeadline(topMatchData?.applicationEndDate || topMatchData?.deadline) && (
                      <span className="ai-rec-deadline">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        Deadline: {formatDeadline(topMatchData?.applicationEndDate || topMatchData?.deadline)}
                      </span>
                    )}
                  </div>
                  <ScoreBar percent={topMatch.confidence.percent} color="var(--ai-secondary)" />
                </div>
              )}

              {asCleanList(topMatch.matchedCriteria).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {asCleanList(topMatch.matchedCriteria).map((c) => (
                    <span key={c} className="ai-rec-chip matched">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              <div className="ai-rec-top-actions">
                <button type="button" className="ai-rec-btn-primary" onClick={() => onOpenProgram?.(topMatch.title)}>
                  View Program
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </article>
          )}

          {/* Other matches */}
          {otherMatches.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div className="ai-rec-others-label">Other matches</div>
              {otherMatches.map((p, i) => (
                <article key={`${p.title || 'p'}-${i}`} className="ai-rec-other-card">
                  <div className="ai-rec-other-header">
                    <h4 className="ai-rec-other-title">{p.title || 'Program'}</h4>
                    <span className="ai-rec-other-badge">
                      {p.confidence.level} · {p.confidence.matched}/{p.confidence.total} criteria
                    </span>
                  </div>
                  {p.confidence.total > 0 && (
                    <ScoreBar percent={p.confidence.percent} color="var(--ai-accent)" />
                  )}
                  {p.reason && (
                    <p className="ai-rec-other-reason">{p.reason}</p>
                  )}
                  <div>
                    <button type="button" className="ai-rec-btn-ghost" onClick={() => onOpenProgram?.(p.title)}>
                      View Program
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Matched profile chips */}
          {profileChips.length > 0 && (
            <div className="ai-rec-chips-section">
              <div className="ai-rec-chips-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Matched on
              </div>
              <div className="ai-rec-chips-rail">
                {profileChips.map((chip) => (
                  <span key={chip} className="ai-rec-chip matched">{chip}</span>
                ))}
              </div>
            </div>
          )}

          {/* Required documents */}
          {allRequiredDocuments.length > 0 && (
            <div className="ai-rec-chips-section">
              <div className="ai-rec-chips-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Documents you'll need
              </div>
              <div className="ai-rec-chips-rail">
                {allRequiredDocuments.map((doc) => {
                  const ready = isUploaded(doc, uploadedNames);
                  return (
                    <span key={doc} className={`ai-rec-chip ${ready ? 'doc-ready' : 'doc-missing'}`}>
                      {ready
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      }
                      {doc}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing profile warning */}
          {missingProfile.length > 0 && (
            <div className="ai-rec-warning">
              <div className="ai-rec-warning-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Complete your profile for better matches
              </div>
              <ul>
                {missingProfile.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {typeof onCompleteProfile === 'function' && (
                <div>
                  <button type="button" className="ai-rec-btn-warm" onClick={onCompleteProfile}>
                    Complete profile →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </section>
  );
}
