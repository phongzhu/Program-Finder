import { useEffect, useMemo, useState } from 'react';
import { getTaxonomyNames } from 'Utils/programTaxonomy';
import AiOverviewRecommendation from 'Components/AiOverviewRecommendation';
import {
  getApplicantApplications,
  getApplicantVisiblePrograms,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  isProgramIntakeEnded,
} from 'Services/Applicant/applicant-utils';

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
    case 'chevron-down':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case 'filter':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.75 1.75" />
        </svg>
      );
    case 'document':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5H8Z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12h6M9 16h6" />
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
    Open: { bg: '#d8f6e5', color: '#177b4d' },
    Upcoming: { bg: '#fff1d6', color: '#ad7a20' },
    Closed: { bg: '#e8edf4', color: '#61748a' },
  };
  const tone = map[status] || { bg: '#e8edf4', color: '#61748a' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        background: tone.bg,
        color: tone.color,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        lineHeight: 1.15,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function Chip({ children, green, accent }) {
  let bg = '#edf1f7';
  let color = '#5f7288';

  if (green) {
    bg = '#dbeeff';
    color = '#3f5d8a';
  }

  if (accent) {
    bg = '#e5f2ff';
    color = '#3f5d8a';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        background: bg,
        color,
        whiteSpace: 'nowrap',
        flex: '0 0 auto',
      }}
    >
      {children}
    </span>
  );
}

// eslint-disable-next-line no-unused-vars
function Card({ children, style }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid #d7dde8',
        boxShadow: '0 1px 0 rgba(15, 35, 62, 0.04)',
        overflow: 'visible',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function CardBody({ children, style }) {
  return <div style={{ padding: '14px 14px', ...style }}>{children}</div>;
}

// eslint-disable-next-line no-unused-vars
function Divider() {
  return <div style={{ height: 1, background: 'var(--pf-border)', margin: '0 22px' }} />;
}

function ProgramArtwork({ program }) {
  const programImageSource = getProgramPhotoSource(program) || getProgramIllustrationSource(program);

  return (
    <div
      style={{
        position: 'relative',
        height: 132,
        overflow: 'hidden',
        background: '#dfe9f5',
        borderBottom: '1px solid #d7dde8',
        borderRadius: '12px 12px 0 0',
      }}
    >
      {programImageSource ? (
        <img
          src={programImageSource}
          alt={program.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : null}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function RecommendedProgramCard({
  program,
  applicantProfile,
  isBookmarked,
  hasExisting,
  onView,
  onBookmark,
}) {
  const match = getProgramMatchSummary(program, applicantProfile);
  const imageSource = getProgramPhotoSource(program) || getProgramIllustrationSource(program);

  return (
    <article className="sp-recommended-card">
      <div className="sp-recommended-card__media">
        {imageSource ? (
          <img
            src={imageSource}
            alt={program.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </div>

      <div className="sp-recommended-card__body">
        <div className="sp-recommended-card__top">
          <div className="sp-recommended-card__chip-rail">
            <Chip>{program.category}</Chip>
            <StatusChip status={program.status} />
            {hasExisting ? <Chip green>Applied</Chip> : null}
          </div>
          <button
            type="button"
            onClick={onBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            className="sp-bookmark-button"
          >
            <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={14} />
          </button>
        </div>

        <h3 className="sp-recommended-card__title">{program.title}</h3>

        <div className="sp-recommended-card__meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="office" size={12} />
            {program.office}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="location" size={12} />
            {program.municipality}
          </span>
        </div>

        <div className="sp-recommended-card__footer">
          <span className="sp-recommended-card__fit">
            <Icon name="check" size={12} />
            {match.total > 0 ? `${match.matched}/${match.total} eligibility checks met` : 'Eligibility checks pending'}
          </span>
          <button type="button" onClick={onView} className="sp-primary-button">
            View Program
          </button>
        </div>
      </div>
    </article>
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

const SECTION_COPY_SIZE = 14;
const FIELD_LABEL_SIZE = 12;
const CARD_BADGE_SIZE = 10;
const CARD_TITLE_SIZE = 17;
const CARD_BODY_SIZE = 13;
const CARD_META_SIZE = 13;

function parseNumber(value) {
  const numeric = Number(String(value || '').replace(/[^\d.]+/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function calculateAgeFromBirthDate(birthDate) {
  const text = String(birthDate || '').trim();
  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function hasSpecialCategory(profile, key) {
  const special = String(profile?.specialCategory || '').toLowerCase();
  if (!special) {
    return false;
  }

  return special.includes(key);
}

function checkRequirementPrepared(requirementName, applicantProfile = {}) {
  const name = String(requirementName || '').toLowerCase();
  const age = calculateAgeFromBirthDate(applicantProfile.birthDate);

  if (name.includes('barangay') || name.includes('residency') || name.includes('indigency')) {
    return Boolean(applicantProfile.municipality && applicantProfile.barangay);
  }
  if (name.includes('income')) {
    return Boolean(applicantProfile.householdIncome || applicantProfile.monthlyPersonalIncome);
  }
  if (name.includes('student') || name.includes('school') || name.includes('enrollment') || name.includes('grade')) {
    return Boolean(applicantProfile.school || applicantProfile.course || applicantProfile.educationStatus);
  }
  if (name.includes('pwd')) {
    return hasSpecialCategory(applicantProfile, 'pwd');
  }
  if (name.includes('senior')) {
    return hasSpecialCategory(applicantProfile, 'senior') || (typeof age === 'number' && age >= 60);
  }
  if (name.includes('solo')) {
    return hasSpecialCategory(applicantProfile, 'solo');
  }
  if (name.includes('farmer')) {
    return hasSpecialCategory(applicantProfile, 'farmer');
  }
  if (name.includes('fisher')) {
    return hasSpecialCategory(applicantProfile, 'fisher');
  }
  if (name.includes('ofw')) {
    return hasSpecialCategory(applicantProfile, 'ofw');
  }
  if (name.includes('indigenous')) {
    return hasSpecialCategory(applicantProfile, 'indigenous');
  }
  if (name.includes('unemployed')) {
    return hasSpecialCategory(applicantProfile, 'unemployed') || String(applicantProfile.employmentStatus || '').toLowerCase() === 'unemployed';
  }
  if (name.includes('birth')) {
    return Boolean(applicantProfile.birthDate);
  }
  if (name.includes('id')) {
    return Boolean(applicantProfile.firstName && applicantProfile.lastName && applicantProfile.birthDate);
  }

  return false;
}

function getProgramMatchSummary(program, applicantProfile = {}) {
  const rules = program?.eligibilityRules || {};
  const checks = [];
  const age = calculateAgeFromBirthDate(applicantProfile.birthDate);
  const sex = String(applicantProfile.sex || '').toLowerCase();
  const civilStatus = String(applicantProfile.civilStatus || '').toLowerCase();
  const citizenship = String(applicantProfile.citizenship || '').toLowerCase();
  const employmentStatus = String(applicantProfile.employmentStatus || '').toLowerCase();
  const occupation = String(applicantProfile.occupation || '').toLowerCase();
  const personalIncome = parseNumber(applicantProfile.monthlyPersonalIncome);
  const householdIncome = parseNumber(applicantProfile.householdIncome);
  const educationStatus = String(applicantProfile.educationStatus || '').toLowerCase();

  if (Number.isFinite(Number(rules.minAge))) {
    checks.push(typeof age === 'number' && age >= Number(rules.minAge));
  }
  if (Number.isFinite(Number(rules.maxAge))) {
    checks.push(typeof age === 'number' && age <= Number(rules.maxAge));
  }
  if (rules.requiredSex) {
    checks.push(sex === String(rules.requiredSex).toLowerCase());
  }
  if (rules.requiredCivilStatus) {
    checks.push(civilStatus === String(rules.requiredCivilStatus).toLowerCase());
  }
  if (rules.requiredCitizenship) {
    checks.push(citizenship === String(rules.requiredCitizenship).toLowerCase());
  }
  if (Number.isFinite(Number(rules.minPersonalIncome))) {
    checks.push(typeof personalIncome === 'number' && personalIncome >= Number(rules.minPersonalIncome));
  }
  if (Number.isFinite(Number(rules.maxPersonalIncome))) {
    checks.push(typeof personalIncome === 'number' && personalIncome <= Number(rules.maxPersonalIncome));
  }
  if (Number.isFinite(Number(rules.minHouseholdIncome))) {
    checks.push(typeof householdIncome === 'number' && householdIncome >= Number(rules.minHouseholdIncome));
  }
  if (Number.isFinite(Number(rules.maxHouseholdIncome))) {
    checks.push(typeof householdIncome === 'number' && householdIncome <= Number(rules.maxHouseholdIncome));
  }
  if (rules.requiredEducationalAttainment) {
    checks.push(educationStatus === String(rules.requiredEducationalAttainment).toLowerCase());
  }
  if (rules.requiredEmploymentStatus) {
    checks.push(employmentStatus === String(rules.requiredEmploymentStatus).toLowerCase());
  }
  if (rules.requiredOccupation) {
    checks.push(occupation === String(rules.requiredOccupation).toLowerCase());
  }

  if (rules.requiresSeniorCitizen) checks.push(hasSpecialCategory(applicantProfile, 'senior'));
  if (rules.requiresPwd) checks.push(hasSpecialCategory(applicantProfile, 'pwd'));
  if (rules.requiresSoloParent) checks.push(hasSpecialCategory(applicantProfile, 'solo'));
  if (rules.requiresFarmer) checks.push(hasSpecialCategory(applicantProfile, 'farmer'));
  if (rules.requiresFisherfolk) checks.push(hasSpecialCategory(applicantProfile, 'fisher'));
  if (rules.requiresOutOfSchoolYouth) checks.push(hasSpecialCategory(applicantProfile, 'out-of-school'));
  if (rules.requiresIndigenousPeoples) checks.push(hasSpecialCategory(applicantProfile, 'indigenous'));
  if (rules.requiresOfwFamily) checks.push(hasSpecialCategory(applicantProfile, 'ofw'));
  if (rules.requiresUnemployed) checks.push(hasSpecialCategory(applicantProfile, 'unemployed') || employmentStatus === 'unemployed');

  const requirementNames = (program?.requirements || []).filter(Boolean);
  const requirementChecks = requirementNames.map((name) =>
    checkRequirementPrepared(name, applicantProfile)
  );
  const ruleTotal = checks.length;
  const ruleMatched = checks.filter(Boolean).length;
  const reqTotal = requirementChecks.length;
  const reqMatched = requirementChecks.filter(Boolean).length;

  if (ruleTotal > 0) {
    return {
      matched: ruleMatched,
      total: ruleTotal,
      label: `${ruleMatched}/${ruleTotal} eligibility checks`,
    };
  }

  if (reqTotal > 0) {
    return {
      matched: reqMatched,
      total: reqTotal,
      label: `${reqMatched}/${reqTotal} requirements ready`,
    };
  }

  return {
    matched: 0,
    total: 0,
    label: 'No checks defined',
  };
}

function getDaysUntil(dateValue) {
  const raw = String(dateValue || '').trim();
  if (!raw) return null;

  const endDate = new Date(`${raw}T23:59:59`);
  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const now = new Date();
  const ms = endDate.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getNormalizedApplicationStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function getLatestApplicationByProgramId(applications = []) {
  const lookup = new Map();

  (applications || []).forEach((application) => {
    const programId = String(application?.programId || '').trim();
    if (!programId || lookup.has(programId)) {
      return;
    }
    lookup.set(programId, application);
  });

  return lookup;
}

function ProgramListRowCard({
  program,
  applicantProfile,
  isBookmarked,
  hasExisting,
  isDraftApplication,
  onView,
  onBookmark,
}) {
  const imageSource = getProgramPhotoSource(program) || getProgramIllustrationSource(program);
  const match = getProgramMatchSummary(program, applicantProfile);
  const daysRemaining = getDaysUntil(program?.applicationEndDate || program?.application_end_date);
  const isFullyEligible = match.total > 0 && match.matched === match.total;
  const isPartiallyEligible = match.total > 0 && match.matched > 0 && !isFullyEligible;
  const locationText = [program.office, program.municipality].filter(Boolean).join(' • ');

  let closeLabel = 'No deadline';
  if (typeof daysRemaining === 'number') {
    closeLabel = daysRemaining < 0
      ? 'Closed'
      : daysRemaining === 0
        ? 'Closes today'
        : `Closes in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
  }

  return (
    <article className={`sp-program-row ${hasExisting ? 'is-applied' : ''}`}>
      <div className="sp-program-row__media">
        {imageSource ? (
          <img
            src={imageSource}
            alt={program.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </div>

      <div className="sp-program-row__content">
        <div className="sp-program-row__header">
          <div className="sp-program-row__label-rail">
            <span className="sp-program-row__category">{program.category || 'Program'}</span>
            {hasExisting ? (
              <span className="sp-program-row__applied-badge">
                {isDraftApplication ? 'Draft' : '✓ Applied'}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            className="sp-program-row__bookmark"
          >
            <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={16} />
          </button>
        </div>

        <div className="sp-program-row__title-wrap">
          <h3 className="sp-program-row__title">{program.title}</h3>
          <StatusChip status={program.status} />
        </div>

        <p className="sp-program-row__meta">{locationText || 'Office information unavailable'}</p>

        <div className="sp-program-row__chips">
          <span className={`sp-match-pill ${isFullyEligible ? 'is-eligible' : isPartiallyEligible ? 'is-partial' : 'is-neutral'}`}>
            <Icon name="check" size={12} />
            {isFullyEligible ? "You're eligible" : isPartiallyEligible ? `Match ${match.matched}/${match.total}` : 'Eligibility review needed'}
          </span>
          <span className="sp-match-pill is-closing">
            <Icon name="clock" size={12} />
            {closeLabel}
          </span>
        </div>

        <div className="sp-program-row__footer">
          <div className="sp-program-row__status" aria-live="polite">
            {hasExisting ? (
              <span className="sp-submitted-flag">
                <Icon name={isDraftApplication ? 'clock' : 'check'} size={12} />
                {isDraftApplication ? 'Application draft saved' : 'Application submitted'}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onView}
            className={`sp-row-action ${hasExisting ? 'is-secondary' : 'is-primary'}`}
          >
            {hasExisting ? (isDraftApplication ? 'Continue Draft' : 'View Application') : 'View Program'}
          </button>
        </div>
      </div>
    </article>
  );
}

// eslint-disable-next-line no-unused-vars
function ProgramCard({
  program,
  applicantProfile,
  isBookmarked,
  hasExisting,
  onView,
  onBookmark,
}) {
  const eligibility = (program.eligibility || []).filter(Boolean);
  const fallbackEligibility = (program.requirements || []).filter(Boolean).slice(0, 4);
  const eligibilityItems = eligibility.length ? eligibility : fallbackEligibility;
  const match = getProgramMatchSummary(program, applicantProfile);

  return (
    <div className="sp-program-card">
      <ProgramArtwork program={program} />

      <div className="sp-program-card__body">
        <div className="sp-program-card__top">
          <div className="sp-program-card__chip-rail">
            <Chip>{program.category}</Chip>
            <StatusChip status={program.status} />
            {match.total > 0 ? <Chip accent>{match.label}</Chip> : null}
            {hasExisting ? <Chip green>Applied</Chip> : null}
          </div>

          <button
            type="button"
            onClick={onBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            className="sp-bookmark-button"
          >
            <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={15} />
          </button>
        </div>

        <div className="sp-program-card__copy">
          <h3
            style={{
              margin: 0,
              fontSize: CARD_TITLE_SIZE,
              fontWeight: 700,
              color: 'var(--pf-ink)',
              lineHeight: 1.28,
              minHeight: 'calc(1.28em * 2)',
              ...clampTwoLines,
            }}
          >
            {program.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: CARD_BODY_SIZE,
              color: 'var(--pf-ink-muted)',
              lineHeight: 1.58,
              minHeight: 'calc(1.58em * 3)',
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
              fontSize: CARD_META_SIZE,
              color: 'var(--pf-ink-muted)',
              minWidth: 0,
              lineHeight: 1.45,
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
              fontSize: CARD_META_SIZE,
              color: 'var(--pf-ink-muted)',
              lineHeight: 1.45,
            }}
          >
            <Icon name="location" size={12} />
            <span>{program.municipality}</span>
          </span>
        </div>

        <div className="sp-program-card__eligibility">
          <div
            style={{
              fontSize: FIELD_LABEL_SIZE,
              fontWeight: 700,
              letterSpacing: '.09em',
              textTransform: 'uppercase',
              color: 'var(--pf-ink-muted)',
            }}
          >
            Eligibility
          </div>
          <div className="sp-program-card__eligibility-rail">
            {eligibilityItems.length ? eligibilityItems.map((item) => (
              <span
                key={item}
                className="sp-program-card__eligibility-chip"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'var(--pf-accent-soft)',
                  border: '1px solid var(--pf-workspace-border)',
                  fontSize: CARD_BADGE_SIZE,
                  color: 'var(--pf-ink-soft)',
                  lineHeight: 1.2,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name="check" size={10} />
                {item}
                </span>
            )) : (
              <span
                style={{
                  fontSize: CARD_META_SIZE,
                  color: 'var(--pf-ink-muted)',
                }}
              >
                Requirements will appear when published for this program.
              </span>
            )}
          </div>
        </div>

        <div className="sp-program-card__footer">
          <button
            type="button"
            onClick={onView}
            className="sp-primary-button sp-primary-button--full"
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

function normalizeLookupKey(value) {
  return normalizeFilterText(value).replace(/\s+/g, ' ').trim();
}

const SEARCH_SYNONYM_GROUPS = [
  ['education', 'school', 'student', 'scholarship', 'tuition', 'allowance', 'learning'],
  ['medical', 'health', 'medicine', 'hospital', 'checkup', 'treatment'],
  ['financial', 'cash', 'allowance', 'ayuda', 'assistance', 'support'],
  ['livelihood', 'job', 'work', 'income', 'business', 'employment'],
  ['disaster', 'calamity', 'relief', 'typhoon', 'flood', 'emergency'],
  ['pwd', 'disability', 'disabled', 'persons with disability'],
  ['senior', 'elderly', 'senior citizen'],
  ['solo parent', 'single parent'],
];

const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'is',
  'are', 'i', 'me', 'my', 'we', 'our', 'need', 'want', 'help',
]);

function tokenizeQuery(query) {
  return normalizeFilterText(query)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && !SEARCH_STOPWORDS.has(token));
}

function getExpandedSearchTerms(search) {
  const normalizedQuery = normalizeFilterText(search);
  const tokenSet = new Set(tokenizeQuery(search));
  const phraseSet = new Set();

  if (normalizedQuery) {
    phraseSet.add(normalizedQuery);
  }

  for (const group of SEARCH_SYNONYM_GROUPS) {
    const normalizedGroup = group.map((term) => normalizeFilterText(term)).filter(Boolean);
    const hasMatch = normalizedGroup.some((term) => {
      if (!term) return false;
      if (term.includes(' ')) {
        return normalizedQuery.includes(term);
      }
      return tokenSet.has(term);
    });

    if (hasMatch) {
      normalizedGroup.forEach((term) => {
        if (term.length > 1) {
          phraseSet.add(term);
          term.split(' ').forEach((token) => {
            if (token.length > 1 && !SEARCH_STOPWORDS.has(token)) {
              tokenSet.add(token);
            }
          });
        }
      });
    }
  }

  return {
    tokens: [...tokenSet],
    phrases: [...phraseSet],
  };
}

function isProvinceWideLocation(value) {
  const normalized = normalizeFilterText(value);

  return normalized === 'province wide' || normalized === 'bulacan province';
}

function extractEligibilityNotes(program) {
  const rules = program?.eligibilityRules || program?.program_eligibility_rules || {};
  if (!rules || typeof rules !== 'object') {
    return [];
  }

  const candidateKeys = [
    'notes',
    'note',
    'remarks',
    'customNotes',
    'custom_notes',
    'customRuleNotes',
    'description',
  ];

  return candidateKeys
    .map((key) => rules?.[key])
    .filter(Boolean)
    .map((value) => String(value));
}

function extractRequirementText(program) {
  const requirements = [];
  const directRequirements = Array.isArray(program?.requirements) ? program.requirements : [];
  const recordRequirements = Array.isArray(program?.requirementRecords) ? program.requirementRecords : [];
  const nestedRequirements = Array.isArray(program?.program_requirements) ? program.program_requirements : [];

  directRequirements.forEach((item) => {
    if (item) requirements.push(String(item));
  });

  [...recordRequirements, ...nestedRequirements].forEach((record) => {
    if (!record) return;
    if (typeof record === 'string') {
      requirements.push(record);
      return;
    }
    requirements.push(
      record.requirement_name ||
      record.requirementName ||
      record.name ||
      record.description ||
      ''
    );
  });

  return requirements.filter(Boolean);
}

function getProgramSearchText(program) {
  return normalizeFilterText(
    [
      program.title,
      program.category,
      program.programType,
      program.program_type,
      program.office,
      program.description,
      program.summary,
      program.objective,
      program.benefits,
      program.coverageNotes,
      program.submissionInstructions,
      program.additionalNotes,
      program.sector,
      ...(Array.isArray(program?.sectorNames) ? program.sectorNames : []),
      program.status,
      program.municipality,
      ...(extractEligibilityNotes(program)),
      ...((Array.isArray(program?.eligibility) ? program.eligibility : [])),
      ...(extractRequirementText(program)),
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function isDirectTitleMatch(search, program) {
  const queryKey = normalizeLookupKey(search);
  const titleKey = normalizeLookupKey(program?.title);

  if (!queryKey || !titleKey) {
    return false;
  }

  if (titleKey.includes(queryKey) || queryKey.includes(titleKey)) {
    return true;
  }

  const queryCompact = queryKey.replace(/\s+/g, '');
  const titleCompact = titleKey.replace(/\s+/g, '');
  return Boolean(queryCompact && titleCompact && (titleCompact.includes(queryCompact) || queryCompact.includes(titleCompact)));
}

function applyProgramFilters({
  programs,
  search,
  category,
  status,
  municipalityScope,
  scopedMunicipalities,
  existingIds,
}) {
  const expandedSearch = getExpandedSearchTerms(search);

  return programs.filter((program) => {
    const searchableText = getProgramSearchText(program);
    const hasSearchInput =
      expandedSearch.tokens.length > 0 || expandedSearch.phrases.length > 0;
    const phraseMatch = expandedSearch.phrases.some((term) => searchableText.includes(term));
    const tokenMatch = expandedSearch.tokens.some((token) => searchableText.includes(token));
    const directTitleMatch = isDirectTitleMatch(search, program);
    const matchSearch = !hasSearchInput || phraseMatch || tokenMatch || directTitleMatch;
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
}

const AI_OVERVIEW_ERROR_MESSAGE =
  'AI overview is temporarily unavailable. You can still browse the program results below.';
const AI_OVERVIEW_FALLBACK_NOTE =
  'Final approval is handled by authorized staff after review.';
const NO_EXACT_MATCH_SUMMARY_PREFIX =
  'No exact search match, but here are related programs.';

function mapProgramForAiOverview(program) {
  return {
    id: program?.id || '',
    title: program?.title || '',
    description: program?.description || program?.summary || '',
    objective: program?.objective || '',
    benefits: program?.benefits || '',
    program_type: program?.programType || program?.program_type || '',
    status: program?.status || '',
    application_start_date: program?.applicationStartDate || program?.application_start_date || '',
    application_end_date: program?.applicationEndDate || program?.application_end_date || '',
    municipality: program?.municipality || '',
    barangay: program?.barangay || '',
    office: program?.office || '',
    category: program?.category || '',
    sector_names: Array.isArray(program?.sectorNames) ? program.sectorNames : [],
    eligibility_notes: extractEligibilityNotes(program),
    program_eligibility_rules: program?.eligibilityRules || program?.program_eligibility_rules || {},
    program_requirements: (program?.requirements || [])
      .filter(Boolean)
      .map((name) => ({ requirement_name: String(name) })),
    eligibility: (program?.eligibility || []).filter(Boolean),
  };
}

function normalizeOverviewProgram(program) {
  const toList = (value) =>
    (Array.isArray(value) ? value : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);

  return {
    title: String(program?.title || '').trim(),
    reason: String(program?.reason || '').trim(),
    matchedCriteria: toList(program?.matchedCriteria),
    missingDetails: toList(program?.missingDetails),
    requiredDocuments: toList(program?.requiredDocuments),
  };
}

function normalizeAiOverview(overview) {
  const recommendedPrograms = Array.isArray(overview?.recommendedPrograms)
    ? overview.recommendedPrograms.map(normalizeOverviewProgram).filter((program) => program.title)
    : [];
  const notRecommendedPrograms = Array.isArray(overview?.notRecommendedPrograms)
    ? overview.notRecommendedPrograms
        .map((program) => ({
          title: String(program?.title || '').trim(),
          reason: String(program?.reason || '').trim(),
        }))
        .filter((program) => program.title)
    : [];

  return {
    summary: String(overview?.summary || '').trim(),
    recommendedPrograms,
    notRecommendedPrograms,
    finalNote: String(overview?.finalNote || AI_OVERVIEW_FALLBACK_NOTE).trim(),
  };
}

export default function SearchProgramsScreen({ session, data, actions, navigate }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [municipalityScope, setMunicipalityScope] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('All');
  const [statusInput, setStatusInput] = useState('All');
  const [municipalityScopeInput, setMunicipalityScopeInput] = useState('all');
  const [aiOverview, setAiOverview] = useState(null);
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false);
  const [aiOverviewError, setAiOverviewError] = useState('');
  const [hasAiSearchRequest, setHasAiSearchRequest] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [visibleProgramCount, setVisibleProgramCount] = useState(6);
  const [sortBy, setSortBy] = useState('best-match');

  const applicantApplications = useMemo(
    () => getApplicantApplications(data, session),
    [data, session]
  );
  const latestApplicationByProgramId = useMemo(
    () => getLatestApplicationByProgramId(applicantApplications),
    [applicantApplications]
  );
  const existingIds = useMemo(
    () => new Set(applicantApplications.map((application) => application.programId)),
    [applicantApplications]
  );
  const bookmarkedIds = useMemo(() => new Set(data.bookmarks), [data.bookmarks]);
  const applicantVisiblePrograms = useMemo(
    () => getApplicantVisiblePrograms(data),
    [data]
  );
  const applicantSearchPrograms = useMemo(
    () => applicantVisiblePrograms.filter((program) => !isProgramIntakeEnded(program)),
    [applicantVisiblePrograms]
  );
  const scopedMunicipalities = useMemo(
    () =>
      new Set(
        [data.applicantProfile?.municipality, session?.municipality]
          .map(normalizeFilterText)
          .filter(Boolean)
      ),
    [data.applicantProfile?.municipality, session?.municipality]
  );

  const allCategories = ['All', ...getTaxonomyNames(data.categories, applicantSearchPrograms.map((program) => program.category))];
  const allStatuses = ['All', ...new Set(applicantSearchPrograms.map((program) => program.status))];
  const effectiveSearch = String(searchInput || '').trim();
  const effectiveCategory = categoryInput;
  const effectiveStatus = statusInput;
  const effectiveMunicipalityScope = municipalityScopeInput;

  const filteredPrograms = useMemo(
    () =>
      applyProgramFilters({
        programs: applicantSearchPrograms,
        search: effectiveSearch,
        category: effectiveCategory,
        status: effectiveStatus,
        municipalityScope: effectiveMunicipalityScope,
        scopedMunicipalities,
        existingIds,
      }),
    [
      effectiveSearch,
      effectiveCategory,
      effectiveStatus,
      effectiveMunicipalityScope,
      applicantSearchPrograms,
      scopedMunicipalities,
      existingIds,
    ]
  );

  const aiApplicantContext = useMemo(
    () => ({
      profile: {
        id: session?.id || '',
        email: session?.email || data.applicantProfile?.email || '',
        first_name: data.applicantProfile?.firstName || '',
        middle_name: data.applicantProfile?.middleName || '',
        last_name: data.applicantProfile?.lastName || '',
        suffix: data.applicantProfile?.suffix || '',
        mobile_number: data.applicantProfile?.phone || '',
      },
      applicant_profiles: {
        birthdate: data.applicantProfile?.birthDate || '',
        sex: data.applicantProfile?.sex || '',
        civil_status: data.applicantProfile?.civilStatus || '',
        citizenship: data.applicantProfile?.citizenship || '',
        employment_status: data.applicantProfile?.employmentStatus || '',
        occupation: data.applicantProfile?.occupation || '',
        monthly_personal_income: data.applicantProfile?.monthlyPersonalIncome || '',
        educational_attainment: data.applicantProfile?.educationStatus || '',
        applicant_household_info: {
          total_household_monthly_income: data.applicantProfile?.householdIncome || '',
          household_member_count: data.applicantProfile?.householdMemberCount || '',
          dependent_count: data.applicantProfile?.dependentCount || '',
          housing_status: data.applicantProfile?.housingStatus || '',
        },
        applicant_special_categories: {
          special_category: data.applicantProfile?.specialCategory || '',
        },
        applicant_student_info: {
          school_name: data.applicantProfile?.school || '',
          course_program: data.applicantProfile?.course || '',
        },
        applicant_family_members: data.applicantProfile?.familyMembers || [],
      },
      user_addresses: {
        municipality_name: data.applicantProfile?.municipality || '',
        barangay_name: data.applicantProfile?.barangay || '',
        house_number: data.applicantProfile?.houseNumber || '',
        street_name: data.applicantProfile?.streetName || '',
        subdivision_area: data.applicantProfile?.subdivisionArea || '',
        zip_code: data.applicantProfile?.zipCode || '',
      },
    }),
    [data.applicantProfile, session?.email, session?.id]
  );

  const programByNormalizedTitle = useMemo(() => {
    const lookup = new Map();
    applicantSearchPrograms.forEach((program) => {
      const key = normalizeLookupKey(program?.title);
      if (key && !lookup.has(key)) {
        lookup.set(key, program);
      }
    });
    return lookup;
  }, [applicantSearchPrograms]);

  const hasPendingSearchChanges =
    String(searchInput || '').trim() !== String(search || '').trim() ||
    categoryInput !== category ||
    statusInput !== status ||
    municipalityScopeInput !== municipalityScope;

  const sortedPrograms = useMemo(() => {
    const ranked = [...filteredPrograms];
    if (sortBy === 'closing-soon') {
      ranked.sort((left, right) => {
        const leftDays = getDaysUntil(left?.applicationEndDate || left?.application_end_date);
        const rightDays = getDaysUntil(right?.applicationEndDate || right?.application_end_date);
        const a = typeof leftDays === 'number' ? leftDays : Number.POSITIVE_INFINITY;
        const b = typeof rightDays === 'number' ? rightDays : Number.POSITIVE_INFINITY;
        return a - b;
      });
      return ranked;
    }
    if (sortBy === 'name') {
      ranked.sort((left, right) => String(left?.title || '').localeCompare(String(right?.title || '')));
      return ranked;
    }

    ranked.sort((left, right) => {
      const leftMatch = getProgramMatchSummary(left, data.applicantProfile);
      const rightMatch = getProgramMatchSummary(right, data.applicantProfile);
      const leftScore = leftMatch.total > 0 ? leftMatch.matched / leftMatch.total : 0;
      const rightScore = rightMatch.total > 0 ? rightMatch.matched / rightMatch.total : 0;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return String(left?.title || '').localeCompare(String(right?.title || ''));
    });
    return ranked;
  }, [filteredPrograms, sortBy, data.applicantProfile]);

  const visiblePrograms = useMemo(
    () => sortedPrograms.slice(0, visibleProgramCount),
    [sortedPrograms, visibleProgramCount]
  );
  const hasMorePrograms = visibleProgramCount < sortedPrograms.length;

  useEffect(() => {
    setVisibleProgramCount(6);
  }, [searchInput, categoryInput, statusInput, municipalityScopeInput]);

  useEffect(() => {
    setShowAiDetails(false);
  }, [searchInput, categoryInput, statusInput, municipalityScopeInput]);

  function openProgramFromAiTitle(title) {
    const exact = programByNormalizedTitle.get(normalizeLookupKey(title));
    if (exact?.id) {
      actions.openProgramDetails(exact.id);
      return;
    }

    const fuzzy = applicantSearchPrograms.find((program) => {
      const programKey = normalizeLookupKey(program?.title);
      const titleKey = normalizeLookupKey(title);
      return (
        programKey &&
        titleKey &&
        (programKey.includes(titleKey) || titleKey.includes(programKey))
      );
    });

    if (fuzzy?.id) {
      actions.openProgramDetails(fuzzy.id);
    }
  }

  function resolveProgramByTitle(title) {
    const exact = programByNormalizedTitle.get(normalizeLookupKey(title));
    if (exact) return exact;

    return applicantSearchPrograms.find((program) => {
      const programKey = normalizeLookupKey(program?.title);
      const titleKey = normalizeLookupKey(title);
      return (
        programKey &&
        titleKey &&
        (programKey.includes(titleKey) || titleKey.includes(programKey))
      );
    }) || null;
  }

  useEffect(() => {
    if (existingIds.size > 0) {
      return;
    }

    if (municipalityScope === 'existing') {
      setMunicipalityScope('all');
    }

    if (municipalityScopeInput === 'existing') {
      setMunicipalityScopeInput('all');
    }
  }, [existingIds.size, municipalityScope, municipalityScopeInput]);

  async function triggerAiFromSearch() {
    const nextSearch = String(searchInput || '').trim();
    const nextCategory = categoryInput;
    const nextStatus = statusInput;
    const nextMunicipalityScope = municipalityScopeInput;

    setSearch(nextSearch);
    setCategory(nextCategory);
    setStatus(nextStatus);
    setMunicipalityScope(nextMunicipalityScope);

    const nextFilteredPrograms = applyProgramFilters({
      programs: applicantSearchPrograms,
      search: nextSearch,
      category: nextCategory,
      status: nextStatus,
      municipalityScope: nextMunicipalityScope,
      scopedMunicipalities,
      existingIds,
    });

    const hasExactMatches = nextFilteredPrograms.length > 0;
    const sourcePrograms = hasExactMatches
      ? nextFilteredPrograms
      : applicantSearchPrograms;
    const programContext = sourcePrograms.map(mapProgramForAiOverview);

    setHasAiSearchRequest(true);
    setAiOverviewLoading(true);
    setAiOverviewError('');

    try {
      const response = await fetch('/api/ai/program-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'overview',
          message:
            nextSearch ||
            'Provide an AI overview recommendation for the currently visible programs.',
          searchQuery: nextSearch,
          noExactMatch: !hasExactMatches,
          applicant: aiApplicantContext,
          applicantSurvey: data.applicantProfile?.searchSurvey || null,
          programs: programContext,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.overview) {
        throw new Error(AI_OVERVIEW_ERROR_MESSAGE);
      }

      const normalizedOverview = normalizeAiOverview(payload.overview);

      if (!hasExactMatches) {
        const summaryText = String(normalizedOverview.summary || '').trim();
        const alreadyPrefixed = summaryText
          .toLowerCase()
          .startsWith(NO_EXACT_MATCH_SUMMARY_PREFIX.toLowerCase());

        normalizedOverview.summary = alreadyPrefixed
          ? summaryText
          : summaryText
            ? `${NO_EXACT_MATCH_SUMMARY_PREFIX} ${summaryText}`.trim()
            : NO_EXACT_MATCH_SUMMARY_PREFIX;
      } else {
        const summaryText = String(normalizedOverview.summary || '').trim();
        const lowerPrefix = NO_EXACT_MATCH_SUMMARY_PREFIX.toLowerCase();
        if (summaryText.toLowerCase().startsWith(lowerPrefix)) {
          normalizedOverview.summary = summaryText.slice(NO_EXACT_MATCH_SUMMARY_PREFIX.length).trim() || 'Here are programs that match your search.';
        }
      }

      if (!normalizedOverview.recommendedPrograms.length && sourcePrograms.length) {
        normalizedOverview.recommendedPrograms = sourcePrograms.slice(0, 3).map((program) => ({
          title: String(program.title || ''),
          reason: 'This program matches your active search filters.',
          matchedCriteria: [],
          missingDetails: [],
          requiredDocuments: [],
        }));
      }

      setAiOverview(normalizedOverview);
    } catch (error) {
      console.error('AI overview request failed:', error);
      setAiOverview(null);
      setAiOverviewError(AI_OVERVIEW_ERROR_MESSAGE);
    } finally {
      setAiOverviewLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .dashboard-shell-applicant .dashboard-topbar {
          justify-content: flex-end;
          padding: 0 1.1rem;
          min-height: 54px;
          background: transparent;
          box-shadow: none;
        }
        .dashboard-shell-applicant .dashboard-topbar-leading {
          display: none;
        }
        .dashboard-shell-applicant .dashboard-topbar-actions {
          gap: 0.45rem;
        }
        .dashboard-shell-applicant .sidebar-edge-toggle {
          top: 0.9rem;
        }
        .dashboard-shell-applicant .dashboard-vector-orb,
        .dashboard-shell-applicant .dashboard-vector-svg,
        .dashboard-shell-applicant .dashboard-vector-wave {
          display: none !important;
        }
        .sp-root {
          --sp-card-height: 430px;
          font-family: var(--pf-font-body, var(--font-body));
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          display: grid;
          gap: 10px;
          grid-auto-rows: max-content;
          align-content: start;
          padding: 16px 12px 8px 0;
          color: #243143;
          overflow-x: hidden;
        }
        .sp-root > * {
          min-width: 0;
        }
        .sp-section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.9rem;
          flex-wrap: wrap;
        }
        .sp-recommended-rail {
          display: flex;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 0 10px;
          scroll-snap-type: x proximity;
        }
        .sp-recommended-rail > * {
          scroll-snap-align: start;
        }
        .sp-recommended-card {
          flex: 0 0 min(44rem, 100%);
          width: min(44rem, 100%);
          border: 1px solid #d7dde8;
          border-radius: 12px;
          background: #fff;
          display: grid;
          grid-template-columns: minmax(12rem, 33%) minmax(0, 1fr);
          overflow: hidden;
        }
        .sp-recommended-card__media {
          min-height: 200px;
          background: #dbe7f7;
        }
        .sp-recommended-card__body {
          padding: 14px 15px;
          display: grid;
          gap: 10px;
          align-content: start;
        }
        .sp-recommended-card__top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .sp-recommended-card__chip-rail {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .sp-recommended-card__title {
          margin: 0;
          color: #263347;
          font-size: 17px;
          line-height: 1.3;
          font-weight: 700;
        }
        .sp-recommended-card__meta {
          display: grid;
          gap: 4px;
          font-size: 13px;
          color: #637488;
          line-height: 1.45;
        }
        .sp-recommended-card__footer {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sp-recommended-card__fit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #2b8f60;
          font-weight: 700;
        }
        .sp-filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
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
          grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
          justify-content: flex-start;
          gap: 12px;
          align-items: stretch;
        }
        .sp-program-card {
          display: flex;
          flex-direction: column;
          min-height: var(--sp-card-height);
          height: auto;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #d7dde8;
          box-shadow: 0 1px 0 rgba(15, 35, 62, 0.04);
        }
        .sp-program-card__body {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 10px;
          min-height: 0;
          padding: 12px 12px 14px;
        }
        .sp-program-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          min-height: 66px;
          min-width: 0;
        }
        .sp-program-card__chip-rail {
          display: flex;
          flex: 1 1 auto;
          min-width: 0;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
          overflow: visible;
          padding-bottom: 0;
          min-height: 56px;
          align-content: flex-start;
        }
        .sp-program-card__copy {
          display: grid;
          gap: 6px;
          min-height: 0;
          align-content: start;
          min-height: 116px;
        }
        .sp-program-card__meta {
          display: grid;
          gap: 4px;
          min-height: 0;
          align-content: start;
          min-height: 52px;
        }
        .sp-program-card__eligibility {
          display: grid;
          gap: 6px;
          min-height: 0;
          height: auto;
          align-content: start;
          min-height: 88px;
        }
        .sp-program-card__eligibility-rail {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 4px;
          scroll-snap-type: x proximity;
          min-height: 34px;
          align-items: center;
        }
        .sp-program-card__eligibility-chip {
          flex: 0 0 auto;
          scroll-snap-align: start;
        }
        .sp-program-card__footer {
          display: flex;
          justify-content: center;
          margin-top: auto;
          padding-top: 6px;
        }
        .sp-bookmark-button {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: #f4f7fb;
          border: 1px solid #d7dde8;
          color: #5a6d84;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .sp-bookmark-button:hover {
          background: #eaf0fa;
          border-color: #b8c8df;
        }
        .sp-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: none;
          border-radius: 9px;
          background: #0f2f63;
          color: #f3f6fd;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 700;
          min-width: 118px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sp-primary-button:hover {
          background: #1a4080;
        }
        .sp-primary-button:disabled,
        .sp-bookmark-button:disabled {
          opacity: 0.64;
          cursor: not-allowed;
        }
        .sp-primary-button--full {
          width: 100%;
        }
        .sp-toolbar-card {
          border-radius: 14px;
          border: 1px solid #dbe1eb;
          background: #ffffff;
          box-shadow: 0 1px 0 rgba(15, 35, 62, 0.04);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-self: start;
          height: fit-content;
        }
        .sp-toolbar-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-field-shell {
          position: relative;
          flex: 1 1 auto;
          min-width: 0;
        }
        .sp-field-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7c92;
          pointer-events: none;
        }
        .sp-input-main {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #ccd5e3;
          background: #f8fafd;
          color: #273549;
          padding: 0 14px 0 42px;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
        }
        .sp-input-main:focus,
        .sp-chip-select:focus {
          border-color: #9bb0cd;
          box-shadow: 0 0 0 3px rgba(54, 101, 176, 0.12);
          outline: none;
        }
        .sp-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
          flex: 0 0 auto;
        }
        .sp-filter-row .sp-chip-select {
          flex: 0 0 auto;
        }
        .sp-chip-select {
          height: 38px;
          min-width: 128px;
          border-radius: 10px;
          border: 1px solid #ccd5e3;
          background: #f8fafd;
          color: #2f3e55;
          padding: 0 32px 0 12px;
          font-size: 14px;
          font-weight: 600;
          appearance: none;
          cursor: pointer;
          background-image:
            url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235c6e85' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 11px center;
        }
        .sp-chip-select:hover {
          border-color: #b7c7dc;
          background-color: #f3f7fd;
        }
        .sp-found-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          background: #e7eefb;
          color: #3d5a84;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .sp-ai-launch {
          border: 1px solid #ccd5e3;
          border-radius: 10px;
          background: #f8fafd;
          color: #0f2f63;
          font-size: 13px;
          font-weight: 700;
          height: 38px;
          padding: 0 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .sp-ai-launch[disabled] {
          cursor: default;
          opacity: 0.8;
        }
        .sp-ai-launch.is-loading {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .sp-ai-launch-spinner {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 2px solid color-mix(in srgb, var(--pf-accent) 30%, transparent);
          border-top-color: var(--pf-accent);
          animation: sp-ai-spin 0.75s linear infinite;
          flex-shrink: 0;
        }
        @keyframes sp-ai-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sp-ai-launch:hover {
          border-color: #b7c7dc;
          background-color: #f3f7fd;
        }
        .sp-results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 0;
        }
        .sp-results-title {
          margin: 0;
          font-size: 22px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: #253347;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .sp-sort-group {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .sp-sort-group label {
          font-size: 13px;
          color: #667789;
          font-weight: 700;
        }
        .sp-sort-select {
          height: 38px;
          border: 1px solid #ccd5e3;
          border-radius: 10px;
          background: #f8fafd;
          color: #233750;
          font-size: 14px;
          font-weight: 700;
          padding: 0 34px 0 12px;
          appearance: none;
          cursor: pointer;
          background-image:
            url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23647387' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 11px center;
        }
        .sp-sort-select:hover {
          border-color: #b7c7dc;
          background-color: #f3f7fd;
        }
        .sp-program-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }
        .sp-program-row {
          display: flex;
          gap: 10px;
          border: 1px solid #d7dde8;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 1px 0 rgba(15, 35, 62, 0.04);
          padding: 10px;
          align-items: flex-start;
          min-height: 168px;
          height: 100%;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .sp-program-row.is-applied {
          border-left: 3px solid #2e4f86;
          padding-left: 12px;
          background: linear-gradient(180deg, rgba(46,79,134,.04) 0%, #ffffff 100%);
        }
        .sp-program-row:hover {
          box-shadow: 0 4px 14px rgba(15, 35, 62, 0.09);
          border-color: #c0ccdd;
        }
        .sp-program-row__media {
          flex: 0 0 96px;
          width: 96px;
          height: 96px;
          border-radius: 10px;
          overflow: hidden;
          background: #dde6f4;
          border: 1px solid #d5dce8;
        }
        .sp-program-row__content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1 1 auto;
          min-height: 100%;
        }
        .sp-program-row__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .sp-program-row__label-rail {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .sp-program-row__category {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 10px;
          background: #e8eef8;
          color: #355278;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }
        .sp-program-row__applied-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 10px;
          background: #e7edf8;
          color: #2b4671;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }
        .sp-program-row__title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
          justify-content: space-between;
        }
        .sp-program-row__title {
          margin: 0;
          color: #0f2f63;
          font-size: 15px;
          line-height: 1.28;
          font-weight: 800;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
          min-height: calc(1.28em * 2);
          flex: 1 1 auto;
        }
        .sp-program-row__bookmark {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid #d7dde8;
          background: #f4f7fb;
          color: #26446b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .sp-program-row__meta {
          margin: 0;
          color: #4f6278;
          font-size: 13px;
          line-height: 1.45;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 20px;
        }
        .sp-program-row__chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          min-height: 30px;
        }
        .sp-match-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .sp-match-pill.is-eligible {
          background: #dff2e5;
          color: #1f6c3b;
        }
        .sp-match-pill.is-partial {
          background: #e6eef8;
          color: #2f547c;
        }
        .sp-match-pill.is-neutral {
          background: #edf1f7;
          color: #5e7188;
        }
        .sp-match-pill.is-closing {
          background: #f7e7db;
          color: #98622f;
        }
        .sp-program-row__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
          padding-top: 4px;
        }
        .sp-program-row__status {
          min-height: 0;
          display: flex;
          align-items: center;
          flex: 1 1 auto;
        }
        .sp-submitted-flag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2f4f7e;
          font-size: 12px;
          font-weight: 700;
        }
        .sp-row-action {
          min-width: 132px;
          border-radius: 11px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 12px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .sp-row-action.is-primary {
          background: #0f2f63;
          color: #fff;
        }
        .sp-row-action.is-primary:hover {
          background: #1a4080;
        }
        .sp-row-action.is-secondary {
          background: #fff;
          border-color: #d0d7e4;
          color: #2f4665;
        }
        .sp-row-action.is-secondary:hover {
          background: #f4f7fb;
          border-color: #b8c8df;
        }
        .sp-load-more {
          justify-self: center;
          grid-column: 1 / -1;
          margin-top: 8px;
          border: 1px solid #ccd5e3;
          background: #fff;
          color: #0f2f63;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 24px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .sp-load-more:hover {
          background: #f0f4fb;
          border-color: #a8bcda;
        }
        .sp-program-card__chip-rail::-webkit-scrollbar,
        .sp-program-card__eligibility-rail::-webkit-scrollbar,
        .sp-results-scroller::-webkit-scrollbar,
        .sp-recommended-rail::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .sp-program-card__chip-rail::-webkit-scrollbar-thumb,
        .sp-program-card__eligibility-rail::-webkit-scrollbar-thumb,
        .sp-results-scroller::-webkit-scrollbar-thumb,
        .sp-recommended-rail::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--pf-accent) 18%, transparent);
          border-radius: 999px;
        }
        .sp-program-card__chip-rail::-webkit-scrollbar-track,
        .sp-program-card__eligibility-rail::-webkit-scrollbar-track,
        .sp-results-scroller::-webkit-scrollbar-track,
        .sp-recommended-rail::-webkit-scrollbar-track {
          background: color-mix(in srgb, var(--pf-ink-muted) 8%, transparent);
          border-radius: 999px;
        }
        @media (max-width: 900px) {
          .sp-toolbar-main {
            flex-direction: column;
            align-items: stretch;
          }
          .sp-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .sp-recommended-card {
            grid-template-columns: 1fr;
          }
          .sp-recommended-card__media {
            min-height: 170px;
          }
          .sp-filter-row {
            flex-wrap: wrap;
            gap: 6px;
          }
          .sp-chip-select {
            min-width: 100px;
            font-size: 13px;
          }
          .sp-sort-group {
            width: 100%;
            justify-content: space-between;
          }
          .sp-program-row {
            flex-direction: column;
          }
          .sp-program-row__media {
            width: 100%;
            height: 162px;
            flex-basis: 162px;
          }
          .sp-program-row__title {
            font-size: 15px;
          }
          .sp-program-row__meta,
          .sp-match-pill,
          .sp-submitted-flag,
          .sp-row-action {
            font-size: 13px;
          }
          .sp-sort-select,
          .sp-results-title {
            font-size: 17px;
          }
        }
        @media (max-width: 680px) {
          .sp-root {
            --sp-card-height: 26rem;
            padding-top: 8px;
          }
          .sp-filter-grid,
          .sp-results-grid,
          .sp-program-list {
            grid-template-columns: 1fr;
          }
          .sp-recommended-card {
            flex-basis: min(92vw, 24rem);
          }
        }
        @media (max-width: 1200px) {
          .sp-program-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-toolbar-card">
          <div className="sp-toolbar-main">
            {/* Search field — full width */}
            <div className="sp-field-shell">
              <span className="sp-field-icon">
                <Icon name="search" size={16} />
              </span>
              <input
                className="sp-input-main"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    triggerAiFromSearch();
                  }
                }}
                placeholder="Search by program name or agency..."
              />
            </div>

            {/* Filters + result count — single compact row */}
            <div className="sp-filter-row">
              <select
                className="sp-chip-select"
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                aria-label="Category filter"
              >
                {allCategories.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'Category' : option}
                  </option>
                ))}
              </select>

              <select
                className="sp-chip-select"
                value={statusInput}
                onChange={(event) => setStatusInput(event.target.value)}
                aria-label="Status filter"
              >
                {allStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'Status' : option}
                  </option>
                ))}
              </select>

              <select
                className="sp-chip-select"
                value={municipalityScopeInput}
                onChange={(event) => setMunicipalityScopeInput(event.target.value)}
                aria-label="Location scope filter"
              >
                <option value="all">Location Scope</option>
                <option value="my-area">My municipality + province-wide</option>
                <option value="existing" disabled={existingIds.size === 0}>
                  {existingIds.size === 0 ? 'Applied programs (none yet)' : 'Applied programs'}
                </option>
              </select>
            </div>
          </div>

          {hasPendingSearchChanges ? (
            <p style={{ margin: 0, fontSize: 12, color: '#607086', lineHeight: 1.4 }}>
              Press Enter in the search field to refresh AI explanation for current filters.
            </p>
          ) : null}
        </div>

        {showAiDetails && (hasAiSearchRequest || aiOverviewLoading || aiOverviewError) ? (
          <AiOverviewRecommendation
            overview={aiOverview}
            isLoading={aiOverviewLoading}
            error={aiOverviewError}
            onOpenProgram={openProgramFromAiTitle}
            applicantProfile={data.applicantProfile}
            uploadedDocuments={data.documents}
            resolveProgramByTitle={resolveProgramByTitle}
            onCompleteProfile={() => navigate('/applicant/profile-management')}
          />
        ) : null}

        <div className="sp-results-head">
          <h2 className="sp-results-title">
            Programs
            <span className="sp-found-pill">{sortedPrograms.length} found</span>
          </h2>
          <div className="sp-sort-group">
            {!showAiDetails ? (
              <button
                type="button"
                className={`sp-ai-launch${aiOverviewLoading ? ' is-loading' : ''}`}
                disabled={aiOverviewLoading}
                onClick={async () => {
                  setShowAiDetails(true);
                  const shouldFetchAi = !hasAiSearchRequest || hasPendingSearchChanges;
                  if (shouldFetchAi && !aiOverviewLoading) {
                    await triggerAiFromSearch();
                  }
                }}
              >
                {aiOverviewLoading ? (
                  <>
                    <span className="sp-ai-launch-spinner" aria-hidden="true" />
                    Analyzing recommendations...
                  </>
                ) : (
                  '✨ Show AI recommendations'
                )}
              </button>
            ) : (
              <button
                type="button"
                className="sp-ai-launch"
                onClick={() => setShowAiDetails(false)}
              >
                Hide AI recommendations
              </button>
            )}
            <label htmlFor="sp-sort">Sort:</label>
            <select
              id="sp-sort"
              className="sp-sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="best-match">Best match</option>
              <option value="closing-soon">Closing soon</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {sortedPrograms.length ? (
          <div className="sp-program-list">
            {visiblePrograms.map((program) => {
              const existingApplication = latestApplicationByProgramId.get(program.id) || null;
              const isDraftApplication =
                getNormalizedApplicationStatus(existingApplication?.status) === 'draft';

              return (
                <ProgramListRowCard
                  key={program.id}
                  program={program}
                  applicantProfile={data.applicantProfile}
                  isBookmarked={bookmarkedIds.has(program.id)}
                  hasExisting={existingIds.has(program.id)}
                  isDraftApplication={isDraftApplication}
                  onView={() =>
                    isDraftApplication
                      ? actions.startApplication(program.id)
                      : actions.openProgramDetails(program.id)
                  }
                  onBookmark={() => actions.toggleBookmark(program.id)}
                />
              );
            })}
            {hasMorePrograms ? (
              <button
                type="button"
                className="sp-load-more"
                onClick={() => setVisibleProgramCount((count) => count + 6)}
              >
                Load more programs
              </button>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '54px 20px',
              borderRadius: 20,
              background: 'var(--pf-card)',
              border: '1px dashed var(--pf-border)',
              color: 'var(--pf-ink-muted)',
            }}
          >
            <div style={{ fontSize: CARD_TITLE_SIZE, fontWeight: 700, color: 'var(--pf-ink)', marginBottom: 7 }}>
              No programs matched your search
            </div>
            <div style={{ fontSize: SECTION_COPY_SIZE, lineHeight: 1.6 }}>
              Adjust the search text, location scope, category, or status filter and try again.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
