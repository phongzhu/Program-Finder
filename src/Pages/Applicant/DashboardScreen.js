import { useState } from 'react';
import { createPortal } from 'react-dom';
import ApplicantOnboardingSurveyScreen from './ApplicantOnboardingSurveyScreen';
import {
  getApplicantApplications,
  getApplicantDocuments,
  getApplicantJoinablePrograms,
  getApplicantNotifications,
  getApplicantSearchSurvey,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  sortProgramsForApplicantSurvey,
} from 'Services/Applicant/applicant-utils';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'profile':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'applications':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <path d="M9 9h6M9 12h6M9 15h4" />
        </svg>
      );
    case 'deadlines':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M5 9h14" />
        </svg>
      );
    case 'alerts':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.5 10a4.5 4.5 0 0 1 9 0v2.5c0 1 .35 1.9 1 2.6l.5.4H6l.5-.4A3.9 3.9 0 0 0 7.5 12.5Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'location':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.75c-3.45 0-6.25 2.8-6.25 6.25 0 5.48 6.25 12.25 6.25 12.25S18.25 14.48 18.25 9c0-3.45-2.8-6.25-6.25-6.25Z" />
          <circle cx="12" cy="9" r="2.25" />
        </svg>
      );
    case 'search':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6" />
          <path d="m21 21-4.35-4.35" />
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
    default:
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function parseDateValue(value) {
  return new Date(`${value}T12:00:00`);
}
function formatCalendarLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(parseDateValue(value));
}
function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date);
}
function buildDeadlineCalendar(programs) {
  const upcomingPrograms = [...programs]
    .filter((p) => ['Open', 'Upcoming'].includes(p.status))
    .sort((a, b) => parseDateValue(a.deadline) - parseDateValue(b.deadline));
  const anchorDate = upcomingPrograms[0] ? parseDateValue(upcomingPrograms[0].deadline) : new Date();
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = monthStart.getDay();
  const deadlineMap = upcomingPrograms.reduce((map, p) => {
    const d = parseDateValue(p.deadline);
    if (d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth()) {
      const ex = map.get(d.getDate()) || [];
      ex.push(p);
      map.set(d.getDate(), ex);
    }
    return map;
  }, new Map());
  const cells = [];
  for (let i = 0; i < leadingEmptyDays; i++) cells.push({ key: `e-${i}`, empty: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: `d-${d}`, day: d, items: deadlineMap.get(d) || [] });
  while (cells.length % 7 !== 0) cells.push({ key: `t-${cells.length}`, empty: true });
  return { monthLabel: formatMonthLabel(monthStart), cells, upcomingPrograms };
}

function parseNumeric(value) {
  const parsed = Number(String(value || '').replace(/[^\d.]+/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateAgeFromBirthDate(birthDate) {
  const text = String(birthDate || '').trim();
  if (!text) return null;
  const parsedDate = new Date(`${text}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const monthDelta = today.getMonth() - parsedDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsedDate.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function hasSpecialCategory(profile, key) {
  const specialCategory = String(profile?.specialCategory || '').toLowerCase();
  return specialCategory.includes(key);
}

function checkRequirementPrepared(requirementName, applicantProfile = {}) {
  const requirement = String(requirementName || '').toLowerCase();
  const age = calculateAgeFromBirthDate(applicantProfile.birthDate);

  if (requirement.includes('barangay') || requirement.includes('residency') || requirement.includes('indigency')) {
    return Boolean(applicantProfile.municipality && applicantProfile.barangay);
  }
  if (requirement.includes('income')) {
    return Boolean(applicantProfile.householdIncome || applicantProfile.monthlyPersonalIncome);
  }
  if (requirement.includes('student') || requirement.includes('school') || requirement.includes('enrollment') || requirement.includes('grade')) {
    return Boolean(applicantProfile.school || applicantProfile.course || applicantProfile.educationStatus);
  }
  if (requirement.includes('pwd')) return hasSpecialCategory(applicantProfile, 'pwd');
  if (requirement.includes('senior')) return hasSpecialCategory(applicantProfile, 'senior') || (typeof age === 'number' && age >= 60);
  if (requirement.includes('solo')) return hasSpecialCategory(applicantProfile, 'solo');
  if (requirement.includes('farmer')) return hasSpecialCategory(applicantProfile, 'farmer');
  if (requirement.includes('fisher')) return hasSpecialCategory(applicantProfile, 'fisher');
  if (requirement.includes('ofw')) return hasSpecialCategory(applicantProfile, 'ofw');
  if (requirement.includes('indigenous')) return hasSpecialCategory(applicantProfile, 'indigenous');
  if (requirement.includes('unemployed')) {
    return hasSpecialCategory(applicantProfile, 'unemployed') || String(applicantProfile.employmentStatus || '').toLowerCase() === 'unemployed';
  }
  if (requirement.includes('birth')) return Boolean(applicantProfile.birthDate);
  if (requirement.includes('id')) return Boolean(applicantProfile.firstName && applicantProfile.lastName && applicantProfile.birthDate);
  return false;
}

function getProgramMatchLabel(program, applicantProfile = {}) {
  const rules = program?.eligibilityRules || {};
  const checks = [];
  const age = calculateAgeFromBirthDate(applicantProfile.birthDate);
  const sex = String(applicantProfile.sex || '').toLowerCase();
  const civilStatus = String(applicantProfile.civilStatus || '').toLowerCase();
  const citizenship = String(applicantProfile.citizenship || '').toLowerCase();
  const employmentStatus = String(applicantProfile.employmentStatus || '').toLowerCase();
  const occupation = String(applicantProfile.occupation || '').toLowerCase();
  const personalIncome = parseNumeric(applicantProfile.monthlyPersonalIncome);
  const householdIncome = parseNumeric(applicantProfile.householdIncome);
  const educationStatus = String(applicantProfile.educationStatus || '').toLowerCase();

  if (Number.isFinite(Number(rules.minAge))) checks.push(typeof age === 'number' && age >= Number(rules.minAge));
  if (Number.isFinite(Number(rules.maxAge))) checks.push(typeof age === 'number' && age <= Number(rules.maxAge));
  if (rules.requiredSex) checks.push(sex === String(rules.requiredSex).toLowerCase());
  if (rules.requiredCivilStatus) checks.push(civilStatus === String(rules.requiredCivilStatus).toLowerCase());
  if (rules.requiredCitizenship) checks.push(citizenship === String(rules.requiredCitizenship).toLowerCase());
  if (Number.isFinite(Number(rules.minPersonalIncome))) checks.push(typeof personalIncome === 'number' && personalIncome >= Number(rules.minPersonalIncome));
  if (Number.isFinite(Number(rules.maxPersonalIncome))) checks.push(typeof personalIncome === 'number' && personalIncome <= Number(rules.maxPersonalIncome));
  if (Number.isFinite(Number(rules.minHouseholdIncome))) checks.push(typeof householdIncome === 'number' && householdIncome >= Number(rules.minHouseholdIncome));
  if (Number.isFinite(Number(rules.maxHouseholdIncome))) checks.push(typeof householdIncome === 'number' && householdIncome <= Number(rules.maxHouseholdIncome));
  if (rules.requiredEducationalAttainment) checks.push(educationStatus === String(rules.requiredEducationalAttainment).toLowerCase());
  if (rules.requiredEmploymentStatus) checks.push(employmentStatus === String(rules.requiredEmploymentStatus).toLowerCase());
  if (rules.requiredOccupation) checks.push(occupation === String(rules.requiredOccupation).toLowerCase());
  if (rules.requiresSeniorCitizen) checks.push(hasSpecialCategory(applicantProfile, 'senior'));
  if (rules.requiresPwd) checks.push(hasSpecialCategory(applicantProfile, 'pwd'));
  if (rules.requiresSoloParent) checks.push(hasSpecialCategory(applicantProfile, 'solo'));
  if (rules.requiresFarmer) checks.push(hasSpecialCategory(applicantProfile, 'farmer'));
  if (rules.requiresFisherfolk) checks.push(hasSpecialCategory(applicantProfile, 'fisher'));
  if (rules.requiresOutOfSchoolYouth) checks.push(hasSpecialCategory(applicantProfile, 'out-of-school'));
  if (rules.requiresIndigenousPeoples) checks.push(hasSpecialCategory(applicantProfile, 'indigenous'));
  if (rules.requiresOfwFamily) checks.push(hasSpecialCategory(applicantProfile, 'ofw'));
  if (rules.requiresUnemployed) checks.push(hasSpecialCategory(applicantProfile, 'unemployed') || employmentStatus === 'unemployed');

  if (checks.length > 0) {
    const matched = checks.filter(Boolean).length;
    return `${matched}/${checks.length} eligibility checks`;
  }
  const requirements = (program?.requirements || []).filter(Boolean);
  if (requirements.length > 0) {
    const prepared = requirements.filter((name) => checkRequirementPrepared(name, applicantProfile)).length;
    return `${prepared}/${requirements.length} requirements ready`;
  }
  return 'No checks defined';
}

const clampTwoLines = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
};

/* ─── Survey Dialog ──────────────────────────────────────────────────────── */
function ApplicantSearchSurveyDialog({ categories, onSave, onOpenSearch }) {
  const categoryOptions = [...categories.slice(0, 4).map((c) => c.name), 'All'];
  const [interestCategory, setInterestCategory] = useState(categoryOptions[0] || 'All');
  const [discoveryMode, setDiscoveryMode] = useState('browse');
  const discoveryOptions = [
    { id: 'open-now', icon: 'deadlines', label: 'Apply to programs that are open now', description: 'Prioritize listings that are currently accepting applications.' },
    { id: 'my-area', icon: 'location', label: 'Focus on my municipality and province-wide listings', description: 'Show programs closer to your local coverage area.' },
    { id: 'browse', icon: 'search', label: 'Browse all public listings first', description: 'Start with the full directory and refine from there.' },
  ];

  const submitSurvey = () => {
    const result = onSave({ interestCategory, discoveryMode });
    if (result?.ok) onOpenSearch();
  };

  const dialog = (
    <div className="db-survey-overlay" role="presentation">
      <div aria-labelledby="db-survey-title" aria-modal="true" className="db-survey-dialog" role="dialog">
        <div className="db-survey-head">
          <span className="db-survey-badge">Applicant Intake Survey</span>
          <h2 id="db-survey-title">Tell us what kind of program you are looking for.</h2>
          <p>Your answers will be used to recommend programs inside Search Programs right after login.</p>
          <span className="db-survey-note">Search Programs will open automatically after you save.</span>
        </div>

        <div className="db-survey-section">
          <strong>What type of assistance are you mainly looking for?</strong>
          <div className="db-survey-category-grid">
            {categoryOptions.map((option) => (
              <button
                aria-pressed={interestCategory === option}
                className={`db-survey-option${interestCategory === option ? ' is-active' : ''}`}
                key={option}
                onClick={() => setInterestCategory(option)}
                type="button"
              >
                {option === 'All' ? 'General Public Programs' : option}
              </button>
            ))}
          </div>
        </div>

        <div className="db-survey-section">
          <strong>How do you want to start your search?</strong>
          <div className="db-survey-mode-grid">
            {discoveryOptions.map((option) => (
              <button
                aria-pressed={discoveryMode === option.id}
                className={`db-survey-mode-card${discoveryMode === option.id ? ' is-active' : ''}`}
                key={option.id}
                onClick={() => setDiscoveryMode(option.id)}
                type="button"
              >
                <span className="db-survey-mode-icon"><Icon name={option.icon} size={16} /></span>
                <div className="db-survey-mode-copy">
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="db-survey-actions">
          <button className="db-survey-submit" onClick={submitSurvey} type="button">
            Save and continue to Search Programs
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(dialog, document.body) : null;
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function DashboardScreen({ session, data, navigate, actions }) {
  const applications = getApplicantApplications(data, session);
  const notifications = getApplicantNotifications(data, session);
  const documents = getApplicantDocuments(data, session);
  const applicantVisiblePrograms = getApplicantJoinablePrograms(data);
  const searchSurvey = getApplicantSearchSurvey(data.applicantProfile);
  const shouldShowSearchSurvey = !searchSurvey.completedAt;
  const recommendedPrograms = sortProgramsForApplicantSurvey(applicantVisiblePrograms, data.applicantProfile, session)
    .slice(0, 3)
    .map((program) => ({ ...program, matchLabel: getProgramMatchLabel(program, data.applicantProfile) }));
  const calendar = buildDeadlineCalendar(applicantVisiblePrograms);
  const nextDeadlineProgram = calendar.upcomingPrograms[0] || null;
  const latestAnnouncements = [...data.announcements].sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date)).slice(0, 2);
  const unreadNotifications = notifications.filter((n) => n.unread).length;
  const activeApplications = applications.filter((application) => {
    const normalizedStatus = String(application?.status || '').toLowerCase();
    return !['approved', 'rejected', 'completed', 'cancelled'].includes(normalizedStatus);
  });
  const criticalApplication = [...activeApplications].sort(
    (left, right) => String(right?.submittedAt || '').localeCompare(String(left?.submittedAt || ''))
  )[0] || null;
  const criticalProgram = criticalApplication
    ? applicantVisiblePrograms.find((program) => program.id === criticalApplication.programId) || null
    : nextDeadlineProgram;
  const criticalImageSource = criticalProgram
    ? getProgramPhotoSource(criticalProgram) || getProgramIllustrationSource(criticalProgram)
    : '';
  const criticalRequirements = (criticalProgram?.requirements || []).map((item) => String(item || '').trim()).filter(Boolean);
  const criticalUploadedDocuments = criticalApplication?.requirementFiles?.length
    ? criticalApplication.requirementFiles.filter((item) => String(item?.status || '').toLowerCase() !== 'rejected').map((item) => String(item?.requirementName || '').trim()).filter(Boolean)
    : [];
  const fallbackUploadedDocuments = documents.map((item) => String(item?.name || '').trim()).filter(Boolean);
  const uploadedDocSet = new Set(
    (criticalUploadedDocuments.length ? criticalUploadedDocuments : fallbackUploadedDocuments).map((item) => item.toLowerCase())
  );
  const missingRequirements = criticalRequirements.filter((name) => !uploadedDocSet.has(name.toLowerCase()));
  const uploadedRequirementCount = Math.max(0, criticalRequirements.length - missingRequirements.length);
  const completionRatio = criticalRequirements.length ? Math.round((uploadedRequirementCount / criticalRequirements.length) * 100) : 0;
  const actionItems = missingRequirements.slice(0, 2).map((name, index) => ({
    id: `missing-${index}-${name}`,
    label: name,
    source: criticalProgram?.title || 'Active application',
  }));
  const pendingDeadline = calendar.upcomingPrograms[0] || null;
  const daysUntilNearestDeadline = pendingDeadline
    ? Math.max(0, Math.ceil((parseDateValue(pendingDeadline.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const primaryApplication = [...applications].sort(
    (left, right) => String(right?.submittedAt || '').localeCompare(String(left?.submittedAt || ''))
  )[0] || null;
  const primaryProgram = primaryApplication
    ? applicantVisiblePrograms.find((program) => program.id === primaryApplication.programId) || null
    : null;
  const timelineEntries = [
    ...notifications.slice(0, 2).map((item) => ({ id: `notif-${item.id}`, title: item.title, detail: item.message, time: item.time || 'Recent', tone: 'success' })),
    ...latestAnnouncements.slice(0, 2).map((item) => ({ id: `announcement-${item.id}`, title: item.title, detail: item.message, time: formatCalendarLabel(item.date), tone: 'info' })),
  ].slice(0, 4);
  const featuredRecommendations = recommendedPrograms.slice(0, 2);
  const primaryStatusNormalized = String(primaryApplication?.status || '').toLowerCase();
  const statusStage =
    ['approved', 'rejected', 'completed', 'cancelled'].includes(primaryStatusNormalized) ? 2
    : ['for review', 'submitted', 'pending', 'incomplete'].includes(primaryStatusNormalized) ? 1
    : 0;
  const focusDeadlineLabel = criticalProgram?.deadline
    ? formatCalendarLabel(criticalProgram.deadline)
    : pendingDeadline?.deadline ? formatCalendarLabel(pendingDeadline.deadline)
    : 'Not set';

  if (shouldShowSearchSurvey) {
    return <ApplicantOnboardingSurveyScreen session={session} data={data} actions={actions} navigate={navigate} />;
  }

  return (
    <>
      <style>{DB_STYLES}</style>
      <div className="db-root">

        {/* ── Welcome ── */}
        <header className="db-welcome">
          <div>
            <h1>Good day, {data.applicantProfile.firstName || 'Applicant'}</h1>
            <p>Here's your overview — applications, deadlines, and recommended programs.</p>
          </div>
          <button className="db-search-btn" type="button" onClick={() => navigate('/applicant/search-programs')}>
            <Icon name="search" size={15} />
            Find Programs
          </button>
        </header>

        {/* ── Stats row ── */}
        <section className="db-stats">
          <div className="db-stat">
            <div className="db-stat-icon"><Icon name="applications" size={16} /></div>
            <div>
              <span className="db-stat-label">Active Applications</span>
              <strong className="db-stat-val">{activeApplications.length.toString().padStart(2, '0')}</strong>
            </div>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon db-stat-icon--amber"><Icon name="deadlines" size={16} /></div>
            <div>
              <span className="db-stat-label">Upcoming Deadlines</span>
              <strong className="db-stat-val db-stat-val--amber">{calendar.upcomingPrograms.length.toString().padStart(2, '0')}</strong>
            </div>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon db-stat-icon--green"><Icon name="profile" size={16} /></div>
            <div>
              <span className="db-stat-label">Profile Completeness</span>
              <strong className="db-stat-val db-stat-val--green">{data.applicantProfile.completeness}%</strong>
            </div>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon"><Icon name="alerts" size={16} /></div>
            <div>
              <span className="db-stat-label">Unread Notifications</span>
              <strong className="db-stat-val">{String(unreadNotifications).padStart(2, '0')}</strong>
            </div>
          </div>
        </section>

        {/* ── Two-column layout ── */}
        <div className="db-layout">

          {/* ── Main column ── */}
          <div className="db-main">

            {/* Critical Focus */}
            <div className="db-panel">
              <div className="db-panel-top">
                <div>
                  <span className="db-eyebrow">Priority</span>
                  <h2 className="db-panel-title">Critical Focus</h2>
                </div>
              </div>
              <div className="db-panel-body">
                <div className="db-critical">
                  <div className="db-critical-header">
                    <div className="db-critical-info">
                      {criticalImageSource ? (
                        <img src={criticalImageSource} alt={criticalProgram?.title || 'Program'} className="db-critical-thumb" />
                      ) : null}
                      <div>
                        <span className={`db-days-badge${daysUntilNearestDeadline !== null && daysUntilNearestDeadline <= 7 ? ' db-days-badge--urgent' : ''}`}>
                          {daysUntilNearestDeadline === null
                            ? 'No deadline set'
                            : `${daysUntilNearestDeadline} day${daysUntilNearestDeadline === 1 ? '' : 's'} until deadline`}
                        </span>
                        <h3 className="db-critical-title">{criticalProgram?.title || 'No active application yet'}</h3>
                        <p className="db-critical-sub">{criticalProgram?.office || 'Provincial Office'} · Deadline {focusDeadlineLabel}</p>
                      </div>
                    </div>
                    <div className="db-critical-progress">
                      <div className="db-progress-header">
                        <span>Documents</span>
                        <span>{uploadedRequirementCount}/{criticalRequirements.length || 0}</span>
                      </div>
                      <div className="db-progress-track">
                        <div className="db-progress-fill" style={{ width: `${completionRatio}%` }} />
                      </div>
                    </div>
                  </div>

                  {missingRequirements.length ? (
                    <div className="db-missing-alert">
                      <Icon name="alerts" size={14} />
                      <span>
                        <strong>Missing: </strong>
                        {missingRequirements.slice(0, 2).join(', ')}
                        {missingRequirements.length > 2 ? ` +${missingRequirements.length - 2} more` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="db-complete-note">
                      <Icon name="check" size={14} />
                      <span>All required documents uploaded</span>
                    </div>
                  )}

                  <div className="db-critical-actions">
                    <button
                      type="button"
                      className="db-cta-btn"
                      onClick={() => {
                        if (criticalProgram?.id) {
                          actions.startApplication(criticalProgram.id);
                        } else {
                          navigate('/applicant/search-programs');
                        }
                      }}
                    >
                      Continue Application
                    </button>
                    <button type="button" className="db-outline-btn" onClick={() => navigate('/applicant/search-programs')}>
                      Browse Programs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Required */}
            <div className="db-panel">
              <div className="db-panel-top">
                <div>
                  <span className="db-eyebrow">Documents</span>
                  <h2 className="db-panel-title">Action Required</h2>
                </div>
              </div>
              <div className="db-panel-body">
                {actionItems.length ? actionItems.map((item) => (
                  <div className="db-action-item" key={item.id}>
                    <div className="db-action-item-left">
                      <strong>{item.label}</strong>
                      <span>Required for {item.source}</span>
                    </div>
                    <span className="db-action-arrow">›</span>
                  </div>
                )) : (
                  <div className="db-empty-note">
                    <Icon name="check" size={15} />
                    <span>No pending document tasks — you're up to date.</span>
                  </div>
                )}
              </div>
            </div>

            {/* My Applications */}
            <div className="db-panel">
              <div className="db-panel-top">
                <div>
                  <span className="db-eyebrow">Tracker</span>
                  <h2 className="db-panel-title">My Applications</h2>
                </div>
                <button type="button" className="db-ghost-btn" onClick={() => navigate('/applicant/manage-applications')}>
                  View All
                </button>
              </div>
              <div className="db-panel-body">
                <div className="db-flow">
                  <div className="db-flow-node">
                    <span className={`db-flow-dot${statusStage >= 0 ? ' db-flow-dot--done' : ''}`}>✓</span>
                    <span className="db-flow-label">Submitted</span>
                  </div>
                  <div className={`db-flow-line${statusStage >= 1 ? ' db-flow-line--done' : ''}`} />
                  <div className="db-flow-node">
                    <span className={`db-flow-dot${statusStage >= 1 ? ' db-flow-dot--active' : ''}`}>↺</span>
                    <span className="db-flow-label">Under Review</span>
                  </div>
                  <div className={`db-flow-line${statusStage >= 2 ? ' db-flow-line--done' : ''}`} />
                  <div className="db-flow-node">
                    <span className={`db-flow-dot${statusStage >= 2 ? ' db-flow-dot--done' : ''}`}>✓</span>
                    <span className="db-flow-label">Decision</span>
                  </div>
                </div>
                <p className="db-flow-status">
                  {primaryApplication
                    ? `Your application for ${primaryProgram?.title || 'the selected program'} is currently ${String(primaryApplication.status || 'under review').toLowerCase()}.`
                    : 'You have no submitted application yet. Start from Search Programs to begin.'}
                </p>
              </div>
            </div>

          </div>

          {/* ── Sidebar ── */}
          <aside className="db-sidebar">

            {/* Deadline Calendar */}
            <div className="db-panel">
              <div className="db-panel-top">
                <h3 className="db-panel-title">{calendar.monthLabel}</h3>
                <span className="db-count-chip">{calendar.upcomingPrograms.length}</span>
              </div>
              <div className="db-panel-body">
                <div className="db-cal-grid">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div className="db-cal-week" key={`${day}-${index}`}>{day}</div>
                  ))}
                  {calendar.cells.map((cell) => (
                    <div className={`db-cal-day${cell.items?.length ? ' has-deadline' : ''}`} key={cell.key}>
                      {!cell.empty ? cell.day : ''}
                      {!cell.empty && cell.items.length > 0 ? <span>{cell.items.length}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="db-panel">
              <div className="db-panel-top">
                <h3 className="db-panel-title">Upcoming Deadlines</h3>
                <button type="button" className="db-ghost-btn" onClick={() => navigate('/applicant/search-programs')}>
                  View All
                </button>
              </div>
              <div className="db-panel-body">
                {calendar.upcomingPrograms.length ? calendar.upcomingPrograms.slice(0, 3).map((program) => {
                  const monthLbl = new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(parseDateValue(program.deadline)).toUpperCase();
                  const dayLbl = new Intl.DateTimeFormat('en-PH', { day: '2-digit' }).format(parseDateValue(program.deadline));
                  const daysLeft = Math.max(0, Math.ceil((parseDateValue(program.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div className="db-deadline-row" key={program.id}>
                      <div className="db-date-block">
                        <span>{monthLbl}</span>
                        <strong>{dayLbl}</strong>
                      </div>
                      <div className="db-deadline-info">
                        <strong>{program.title}</strong>
                        <span>In {daysLeft} day{daysLeft === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="db-empty-text">No upcoming deadlines this month.</p>
                )}
              </div>
            </div>

            {/* Recent Updates */}
            <div className="db-panel">
              <div className="db-panel-top">
                <h3 className="db-panel-title">Recent Updates</h3>
              </div>
              <div className="db-panel-body">
                {timelineEntries.length ? (
                  <div className="db-timeline">
                    {timelineEntries.map((entry) => (
                      <div className="db-timeline-item" key={entry.id}>
                        <span className={`db-timeline-dot db-timeline-dot--${entry.tone}`} />
                        <div>
                          <span className="db-timeline-time">{entry.time}</span>
                          <strong className="db-timeline-title">{entry.title}</strong>
                          <p className="db-timeline-detail">{entry.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="db-empty-text">No new updates yet.</p>
                )}
              </div>
            </div>

            {/* Recommended Programs */}
            {featuredRecommendations.length ? (
              <div className="db-panel">
                <div className="db-panel-top">
                  <h3 className="db-panel-title">Recommended for You</h3>
                </div>
                <div className="db-panel-body db-panel-body--gap">
                  {featuredRecommendations.map((program) => (
                    <article className="db-reco-card" key={program.id}>
                      <div className="db-reco-top">
                        <span className="db-reco-category">{program.category || 'Program'}</span>
                        <span className="db-reco-fit">{program.matchLabel}</span>
                      </div>
                      <h4 className="db-reco-title" style={clampTwoLines}>{program.title}</h4>
                      <p className="db-reco-meta">{program.office}</p>
                      <button
                        type="button"
                        className="db-reco-btn"
                        onClick={() => actions.openProgramDetails(program.id)}
                      >
                        View Details
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

          </aside>
        </div>
      </div>

      {shouldShowSearchSurvey ? (
        <ApplicantSearchSurveyDialog
          categories={data.categories || []}
          onOpenSearch={() => navigate('/applicant/search-programs')}
          onSave={actions.saveApplicantSearchSurvey}
        />
      ) : null}
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const DB_STYLES = `
  /* Root */
  .db-root {
    font-family: var(--pf-font-body, system-ui, sans-serif);
    background: #f4f7fb;
    min-height: 100vh;
    padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
    box-sizing: border-box;
    color: #1a3356;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
  .db-root > * { min-width: 0; }

  /* Welcome header */
  .db-welcome {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .db-welcome h1 {
    margin: 0 0 4px;
    font-size: clamp(1.3rem, 2.2vw, 1.7rem);
    font-weight: 700;
    color: #0f2f63;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .db-welcome p {
    margin: 0;
    color: #4a5e7a;
    font-size: 0.92rem;
    line-height: 1.45;
  }
  .db-search-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #0f2f63;
    color: #ffffff;
    border: none;
    border-radius: 9px;
    padding: 10px 18px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .db-search-btn:hover { background: #1a4a8a; }

  /* Stats row */
  .db-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  @media (max-width: 1100px) { .db-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px)  { .db-stats { grid-template-columns: 1fr; } }

  .db-stat {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(15,47,99,.04);
  }
  .db-stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    display: grid;
    place-items: center;
    color: #2a4e8c;
    flex-shrink: 0;
  }
  .db-stat-icon--amber { background: #fff8e6; border-color: #efd488; color: #9a6700; }
  .db-stat-icon--green { background: #f0faf5; border-color: #9ed0b5; color: #1a7f4e; }

  .db-stat-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #7a8fa6;
    margin-bottom: 3px;
  }
  .db-stat-val {
    display: block;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    color: #0f2f63;
    letter-spacing: -0.03em;
  }
  .db-stat-val--amber { color: #9a6700; }
  .db-stat-val--green { color: #1a7f4e; }

  /* Two-column layout */
  .db-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(0, 0.88fr);
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 1200px) { .db-layout { grid-template-columns: 1fr; } }
  .db-main    { display: grid; gap: 16px; min-width: 0; }
  .db-sidebar { display: grid; gap: 14px; min-width: 0; }

  /* Panel */
  .db-panel {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(15,47,99,.05);
    overflow: hidden;
  }
  .db-panel-top {
    padding: 14px 20px;
    background: #f8fafd;
    border-bottom: 1px solid #e8ecf2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .db-panel-body { padding: 16px 20px; }
  .db-panel-body--gap { display: grid; gap: 12px; }

  .db-eyebrow {
    display: block;
    font-size: 0.67rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7a8fa6;
    margin-bottom: 2px;
  }
  .db-panel-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f2f63;
    line-height: 1.2;
  }

  /* Buttons */
  .db-ghost-btn {
    background: none;
    border: none;
    color: #2a4e8c;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .db-ghost-btn:hover { opacity: 0.7; }
  .db-cta-btn {
    background: #0f2f63;
    color: #ffffff;
    border: none;
    border-radius: 9px;
    padding: 10px 18px;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }
  .db-cta-btn:hover { background: #1a4a8a; }
  .db-outline-btn {
    background: #ffffff;
    color: #2a4e8c;
    border: 1px solid #c8d8f5;
    border-radius: 9px;
    padding: 10px 18px;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .db-outline-btn:hover { background: #eef4ff; border-color: #a8c4f0; }

  /* Critical Focus */
  .db-critical { display: grid; gap: 14px; }
  .db-critical-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .db-critical-info {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }
  .db-critical-thumb {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #d7dde8;
    flex-shrink: 0;
  }
  .db-days-badge {
    display: inline-block;
    background: #eef4ff;
    color: #2a4e8c;
    border: 1px solid #c8d8f5;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 10px;
    margin-bottom: 7px;
    letter-spacing: 0.02em;
  }
  .db-days-badge--urgent { background: #fff8e6; color: #9a6700; border-color: #efd488; }
  .db-critical-title {
    margin: 0 0 4px;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f2f63;
    line-height: 1.3;
  }
  .db-critical-sub { margin: 0; font-size: 0.84rem; color: #4a5e7a; }
  .db-critical-progress { min-width: 140px; flex-shrink: 0; }
  .db-progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.74rem;
    color: #7a8fa6;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .db-progress-track {
    height: 6px;
    background: #e8ecf2;
    border-radius: 999px;
    overflow: hidden;
  }
  .db-progress-fill {
    height: 100%;
    background: #0f2f63;
    border-radius: inherit;
    transition: width 0.4s ease;
  }
  .db-missing-alert {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #fff8e6;
    border: 1px solid #efd488;
    border-radius: 9px;
    padding: 10px 12px;
    font-size: 0.84rem;
    color: #9a6700;
  }
  .db-missing-alert strong { font-weight: 700; }
  .db-complete-note {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f0faf5;
    border: 1px solid #9ed0b5;
    border-radius: 9px;
    padding: 10px 12px;
    font-size: 0.84rem;
    color: #1a7f4e;
    font-weight: 600;
  }
  .db-critical-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  /* Action Required */
  .db-action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid #e8ecf2;
  }
  .db-action-item:last-child { border-bottom: none; }
  .db-action-item-left { min-width: 0; }
  .db-action-item-left strong {
    display: block;
    font-size: 0.9rem;
    font-weight: 700;
    color: #1a3356;
    margin-bottom: 2px;
  }
  .db-action-item-left span { font-size: 0.78rem; color: #7a8fa6; }
  .db-action-arrow { font-size: 1.15rem; color: #b0bfd0; flex-shrink: 0; }
  .db-empty-note {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4a5e7a;
    font-size: 0.88rem;
  }
  .db-empty-text { margin: 0; color: #7a8fa6; font-size: 0.86rem; }

  /* Application Flow */
  .db-flow {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .db-flow-node { display: grid; justify-items: center; gap: 6px; }
  .db-flow-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px solid #c8d4e5;
    background: #f0f4fb;
    color: #7a8fa6;
    display: grid;
    place-items: center;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .db-flow-dot--done, .db-flow-dot--active {
    background: #0f2f63;
    border-color: #0f2f63;
    color: #ffffff;
  }
  .db-flow-line { height: 2px; border-radius: 999px; background: #d7dde8; }
  .db-flow-line--done { background: #0f2f63; }
  .db-flow-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #7a8fa6;
    text-align: center;
    letter-spacing: 0.02em;
  }
  .db-flow-status {
    margin: 0;
    font-size: 0.86rem;
    color: #4a5e7a;
    line-height: 1.55;
    text-align: center;
    padding: 12px 8px 0;
    border-top: 1px solid #e8ecf2;
  }

  /* Count chip */
  .db-count-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 999px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    font-size: 0.72rem;
    font-weight: 700;
    color: #2a4e8c;
    flex-shrink: 0;
  }

  /* Calendar */
  .db-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 3px;
  }
  .db-cal-week {
    text-align: center;
    font-size: 0.62rem;
    font-weight: 700;
    color: #7a8fa6;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-bottom: 6px;
  }
  .db-cal-day {
    aspect-ratio: 1;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    font-weight: 500;
    color: #4a5e7a;
    position: relative;
  }
  .db-cal-day.has-deadline {
    background: #eef4ff;
    color: #2a4e8c;
    font-weight: 700;
    border: 1px solid #c8d8f5;
  }
  .db-cal-day.has-deadline span {
    font-size: 0.58rem;
    color: #2a4e8c;
    opacity: 0.8;
  }

  /* Deadline rows */
  .db-deadline-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #e8ecf2;
  }
  .db-deadline-row:last-child { border-bottom: none; }
  .db-date-block {
    width: 38px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    border-radius: 8px;
    text-align: center;
    padding: 5px 0 4px;
    flex-shrink: 0;
  }
  .db-date-block span {
    display: block;
    font-size: 0.6rem;
    font-weight: 700;
    color: #2a4e8c;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .db-date-block strong {
    display: block;
    font-size: 1rem;
    font-weight: 700;
    color: #0f2f63;
    line-height: 1.1;
    margin-top: 1px;
  }
  .db-deadline-info { min-width: 0; }
  .db-deadline-info strong {
    display: block;
    font-size: 0.86rem;
    font-weight: 700;
    color: #1a3356;
    line-height: 1.3;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .db-deadline-info span { font-size: 0.76rem; color: #7a8fa6; }

  /* Timeline */
  .db-timeline { display: grid; gap: 12px; }
  .db-timeline-item {
    display: grid;
    grid-template-columns: 10px 1fr;
    gap: 10px;
    align-items: start;
  }
  .db-timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #b0bfd0;
    margin-top: 4px;
    flex-shrink: 0;
  }
  .db-timeline-dot--success { background: #0f2f63; }
  .db-timeline-dot--info    { background: #c97c3a; }
  .db-timeline-time { display: block; font-size: 0.7rem; color: #7a8fa6; margin-bottom: 2px; }
  .db-timeline-title { display: block; font-size: 0.84rem; font-weight: 700; color: #1a3356; margin-bottom: 3px; line-height: 1.3; }
  .db-timeline-detail { margin: 0; font-size: 0.76rem; color: #4a5e7a; line-height: 1.5; }

  /* Recommended cards */
  .db-reco-card {
    border: 1px solid #d7dde8;
    border-radius: 10px;
    padding: 12px 14px;
    display: grid;
    gap: 8px;
    background: #ffffff;
  }
  .db-reco-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .db-reco-category {
    display: inline-flex;
    align-items: center;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    color: #2a4e8c;
    font-size: 0.67rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .db-reco-fit { font-size: 0.72rem; font-weight: 700; color: #1a7f4e; }
  .db-reco-title { margin: 0; font-size: 0.9rem; font-weight: 700; color: #1a3356; line-height: 1.35; }
  .db-reco-meta { margin: 0; font-size: 0.76rem; color: #7a8fa6; }
  .db-reco-btn {
    border: 1px solid #c8d8f5;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #2a4e8c;
    background: #ffffff;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s, border-color 0.15s;
  }
  .db-reco-btn:hover { background: #eef4ff; border-color: #a8c4f0; }

  /* ── Survey dialog ─────────────────────────────────────────────────────── */
  .db-survey-overlay {
    position: fixed;
    inset: 0;
    z-index: 140;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(8, 20, 33, 0.52);
    backdrop-filter: blur(8px);
    animation: db-survey-fade-in 0.28s ease;
  }
  .db-survey-dialog {
    width: min(100%, 56rem);
    display: grid;
    gap: 20px;
    padding: 28px;
    border-radius: 18px;
    border: 1px solid #d7dde8;
    background: #ffffff;
    box-shadow: 0 24px 54px rgba(8, 20, 33, 0.2);
    transform: translateY(20px) scale(0.975);
    opacity: 0;
    animation: db-survey-dialog-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .db-survey-dialog > * {
    opacity: 0;
    transform: translateY(12px);
    animation: db-survey-item-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .db-survey-dialog > *:nth-child(1) { animation-delay: 0.08s; }
  .db-survey-dialog > *:nth-child(2) { animation-delay: 0.14s; }
  .db-survey-dialog > *:nth-child(3) { animation-delay: 0.2s; }
  .db-survey-dialog > *:nth-child(4) { animation-delay: 0.26s; }

  .db-survey-head { display: grid; gap: 10px; }
  .db-survey-badge {
    display: inline-flex;
    align-items: center;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    color: #2a4e8c;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 5px 12px;
    width: fit-content;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .db-survey-note {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #2a4e8c;
    font-size: 0.84rem;
    font-weight: 700;
  }
  .db-survey-note::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #2a4e8c;
    flex-shrink: 0;
  }
  .db-survey-head h2 {
    margin: 0;
    font-size: clamp(1.3rem, 2.1vw, 1.8rem);
    line-height: 1.2;
    color: #0f2f63;
    letter-spacing: -0.02em;
    font-weight: 700;
  }
  .db-survey-head p { margin: 0; font-size: 0.94rem; line-height: 1.65; color: #4a5e7a; }

  .db-survey-section { display: grid; gap: 12px; }
  .db-survey-section > strong { font-size: 0.9rem; color: #1a3356; font-weight: 700; }

  .db-survey-category-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }
  .db-survey-option {
    border: 1px solid #d7dde8;
    background: #ffffff;
    color: #1a3356;
    border-radius: 10px;
    font: inherit;
    text-align: left;
    min-height: 3rem;
    padding: 11px 13px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .db-survey-option:hover {
    border-color: #a8c4f0;
    background: #f8fafd;
    box-shadow: 0 2px 8px rgba(15,47,99,.06);
  }
  .db-survey-option.is-active {
    border-color: #2a4e8c;
    background: #eef4ff;
    box-shadow: inset 0 0 0 1px #c8d8f5;
    color: #0f2f63;
  }
  .db-survey-mode-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .db-survey-mode-card {
    border: 1px solid #d7dde8;
    background: #ffffff;
    color: #1a3356;
    border-radius: 12px;
    font: inherit;
    text-align: left;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
    min-height: 8rem;
    padding: 14px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .db-survey-mode-card:hover {
    border-color: #a8c4f0;
    background: #f8fafd;
    box-shadow: 0 4px 12px rgba(15,47,99,.06);
  }
  .db-survey-mode-card.is-active {
    border-color: #2a4e8c;
    background: #eef4ff;
    box-shadow: inset 0 0 0 1px #c8d8f5;
  }
  .db-survey-mode-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    color: #2a4e8c;
  }
  .db-survey-mode-card.is-active .db-survey-mode-icon { background: #dde9ff; }
  .db-survey-mode-copy { display: grid; gap: 5px; }
  .db-survey-mode-copy strong { font-size: 0.9rem; line-height: 1.35; color: #0f2f63; }
  .db-survey-mode-copy span  { font-size: 0.84rem; line-height: 1.5; color: #4a5e7a; }

  .db-survey-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    padding-top: 4px;
    border-top: 1px solid #e8ecf2;
  }
  .db-survey-submit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #0f2f63;
    color: #ffffff;
    border: none;
    border-radius: 9px;
    padding: 11px 20px;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }
  .db-survey-submit:hover { background: #1a4a8a; }

  @media (max-width: 900px) {
    .db-survey-category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .db-survey-mode-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .db-survey-overlay { padding: 16px; }
    .db-survey-dialog  { padding: 20px; }
    .db-survey-category-grid { grid-template-columns: 1fr; }
    .db-survey-actions { align-items: stretch; }
    .db-survey-submit  { width: 100%; justify-content: center; }
  }

  @keyframes db-survey-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes db-survey-dialog-in {
    from { opacity: 0; transform: translateY(20px) scale(0.975); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes db-survey-item-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .db-survey-overlay,
    .db-survey-dialog,
    .db-survey-dialog > *,
    .db-survey-option,
    .db-survey-mode-card { animation: none; transition: none; }
  }
`;
