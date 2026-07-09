import { useEffect, useState } from 'react';
import {
  canApplicantApplyToProgram,
  getApplicationOfficeRemark,
  getApplicationOfficeRemarkLabel,
  formatProgramDate,
  formatProgramWindow,
  getApplicantApplications,
  getProgramBookmarkReminder,
  getProgramById,
  getProgramCapacity,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  isProgramIntakeEnded,
} from 'Services/Applicant/applicant-utils';
import { formatDocumentTypeList, uniqueDocumentTypes } from 'Constants/documentTypes';

/* ============================================================
   ICON
============================================================ */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'arrow-left':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
    case 'arrow-right':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'calendar':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3.75" y="5.25" width="16.5" height="15" rx="2" /><path d="M7.5 3.75v3M16.5 3.75v3M3.75 9.5h16.5" /></svg>;
    case 'clock':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M12 8v4.25l2.75 1.75" /></svg>;
    case 'office':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M4 9l8-5 8 5" /></svg>;
    case 'location':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s6-5.75 6-11.2A6 6 0 0 0 6 8.8C6 14.25 12 20 12 20Z" /><circle cx="12" cy="9" r="2" /></svg>;
    case 'target':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.5" /><path d="M12 4.5V2.75M19.5 12h1.75M12 19.5v1.75M2.75 12H4.5" /></svg>;
    case 'star':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m12 4.75 2.1 4.27 4.72.69-3.4 3.32.8 4.69L12 15.5l-4.22 2.22.8-4.69-3.4-3.32 4.72-.69Z" /></svg>;
    case 'document':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3.75h6l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 20.25V5.25A1.5 1.5 0 0 1 8.5 3.75Z" /><path d="M14 3.75v4h4M10 12h4M10 15.5h4" /></svg>;
    case 'users':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8.5" r="2.75" /><circle cx="16.25" cy="8.25" r="2.1" /><path d="M4.5 18a4.9 4.9 0 0 1 9 0M14 17.5a3.5 3.5 0 0 1 5.25-3" /></svg>;
    case 'check':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>;
    case 'x':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l10 10M17 7 7 17" /></svg>;
    case 'alert':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5 20 19H4L12 4.5Z" /><path d="M12 9.5v4M12 16.75h.01" /></svg>;
    case 'bookmark-off':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" /></svg>;
    case 'bookmark-on':
      return <svg style={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5Z" /></svg>;
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="7" /></svg>;
  }
}

/* ============================================================
   UTILITY FUNCTIONS  (logic unchanged)
============================================================ */
function normalizeText(value) { return String(value || '').trim(); }
function readNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
function formatValue(value, fallback = 'Not provided') { return normalizeText(value) || fallback; }
function formatPeso(value) {
  const number = readNumber(value);
  if (number === null) return 'Not set';
  return `Php${number.toLocaleString('en-PH')}`;
}

function getRequirementAcceptedDocumentTypes(requirement = {}) {
  const linkedTypes = uniqueDocumentTypes(
    requirement?.acceptedDocumentTypes || requirement?.accepted_document_types || []
  );
  return linkedTypes;
}

function getRequirementItems(program = {}) {
  if (Array.isArray(program.requirementRecords) && program.requirementRecords.length) {
    return [...program.requirementRecords]
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((r) => ({ ...r, isRequired: r?.isRequired ?? true }));
  }
  return (program.requirements || []).map((name, i) => ({
    id: `${name}-${i}`, name, description: '',
    acceptedDocumentTypes: [], isRequired: true, allowMultipleFiles: false, sources: [],
  }));
}
function getRequirementName(req) { return normalizeText(req?.name || req?.requirementName || req); }
function getRequirementUpload(application, requirement) {
  const reqName = getRequirementName(requirement).toLowerCase();
  const reqId   = normalizeText(requirement?.id);
  return (application?.requirementFiles || []).find((f) => {
    const fName = normalizeText(f.requirementName || f.name).toLowerCase();
    return (reqId && normalizeText(f.requirementId) === reqId) || (reqName && fName === reqName);
  });
}
function getApplicantAge(profile = {}) {
  if (!profile.birthDate) return null;
  const d = new Date(`${profile.birthDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const md = today.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}
function isStudentProfile(profile = {}) {
  const emp = normalizeText(profile.employmentStatus).toLowerCase();
  const cat = normalizeText(profile.specialCategory).toLowerCase();
  const types = Array.isArray(profile.searchSurvey?.applicantTypes)
    ? profile.searchSurvey.applicantTypes.map((t) => normalizeText(t).toLowerCase()) : [];
  return emp === 'student' || cat === 'student' || types.includes('student') || Boolean(profile.studentInfo?.isStudent);
}
function getApplicantSpecialFlags(profile = {}) {
  const sp = profile.specialCategories || {};
  const text = normalizeText(profile.specialCategory).toLowerCase();
  const types = Array.isArray(profile.searchSurvey?.applicantTypes)
    ? profile.searchSurvey.applicantTypes.map((t) => normalizeText(t).toLowerCase()) : [];
  return {
    isStudent: isStudentProfile(profile),
    isSeniorCitizen: Boolean(sp.isSeniorCitizen || text.includes('senior') || types.includes('senior_citizen')),
    isPwd: Boolean(sp.isPwd || text.includes('pwd') || text.includes('disability') || types.includes('pwd')),
    isSoloParent: Boolean(sp.isSoloParent || text.includes('solo') || types.includes('solo_parent')),
    isFarmer: Boolean(sp.isFarmer || text.includes('farmer') || types.includes('farmer')),
    isFisherfolk: Boolean(sp.isFisherfolk || text.includes('fisher') || types.includes('fisherfolk')),
    isOutOfSchoolYouth: Boolean(sp.isOutOfSchoolYouth || text.includes('out of school') || types.includes('out_of_school_youth')),
    isIndigenousPeoples: Boolean(sp.isIndigenousPeoples || text.includes('indigenous') || types.includes('indigenous_peoples')),
    isOfwFamily: Boolean(sp.isOfwFamily || text.includes('ofw') || types.includes('ofw_family')),
    isUnemployed: Boolean(sp.isUnemployed || text.includes('unemployed') || types.includes('unemployed')),
  };
}
function findFamilyMember(profile = {}, relationshipType) {
  const n = normalizeText(relationshipType).toLowerCase();
  return (profile.familyMembers || []).find(
    (m) => normalizeText(m.relationshipType || m.relationship_type).toLowerCase() === n
  );
}
function buildEligibilityBreakdown(profile = {}, program = {}, applicationCount = 0) {
  const rules = program.eligibilityRules || {};
  const special = getApplicantSpecialFlags(profile);
  const age = getApplicantAge(profile);
  const personalIncome = readNumber(profile.monthlyPersonalIncome);
  const householdIncome = readNumber(profile.householdIncome);
  const items = [];
  const addItem = ({ section = 'Eligibility', label, expected, actual, passes, missing = false, detail = '' }) => {
    if (!label) return;
    items.push({ section, label, expected: formatValue(expected, 'Required'), actual: formatValue(actual, missing ? 'Missing from profile' : 'Not provided'), status: missing ? 'missing' : passes ? 'pass' : 'fail', detail });
  };
  if (rules.minAge || rules.maxAge) {
    const expected = [rules.minAge ? `at least ${rules.minAge}` : '', rules.maxAge ? `at most ${rules.maxAge}` : ''].filter(Boolean).join(', ');
    const missing = age === null;
    addItem({ section: 'Identity', label: 'Age', expected, actual: missing ? '' : `${age} years old`, missing, passes: (rules.minAge ? age >= Number(rules.minAge) : true) && (rules.maxAge ? age <= Number(rules.maxAge) : true), detail: missing ? 'Add your birth date in Profile Management.' : '' });
  }
  if (rules.requiredSex) addItem({ section: 'Identity', label: 'Sex', expected: rules.requiredSex, actual: profile.sex, missing: !profile.sex, passes: profile.sex === rules.requiredSex, detail: !profile.sex ? 'Select your sex in Profile Management.' : '' });
  if (rules.requiredCivilStatus) addItem({ section: 'Identity', label: 'Civil status', expected: rules.requiredCivilStatus, actual: profile.civilStatus, missing: !profile.civilStatus, passes: profile.civilStatus === rules.requiredCivilStatus, detail: !profile.civilStatus ? 'Select your civil status in Profile Management.' : '' });
  if (rules.requiredCitizenship) addItem({ section: 'Identity', label: 'Citizenship', expected: rules.requiredCitizenship, actual: profile.citizenship, missing: !profile.citizenship, passes: normalizeText(profile.citizenship).toLowerCase() === normalizeText(rules.requiredCitizenship).toLowerCase(), detail: !profile.citizenship ? 'Add your citizenship in Profile Management.' : '' });
  if (rules.requiredMunicipalityId || program.municipalityId || program.municipality) {
    const expected = program.municipality || 'Required municipality';
    const missing = !profile.municipalityId && !profile.municipality;
    const passes = rules.requiredMunicipalityId
      ? profile.municipalityId ? profile.municipalityId === rules.requiredMunicipalityId : normalizeText(profile.municipality).toLowerCase() === normalizeText(program.municipality).toLowerCase()
      : normalizeText(profile.municipality).toLowerCase() === normalizeText(program.municipality).toLowerCase();
    addItem({ section: 'Residency', label: 'Municipality', expected, actual: profile.municipality, missing, passes, detail: missing ? 'Select your municipality in Profile Management.' : 'Your municipality must match the program coverage.' });
  }
  if (rules.requiredBarangayId || program.barangayId) {
    const expected = program.barangay || 'Required barangay';
    const missing = !profile.barangayId && !profile.barangay;
    const passes = rules.requiredBarangayId
      ? profile.barangayId ? profile.barangayId === rules.requiredBarangayId : normalizeText(profile.barangay).toLowerCase() === normalizeText(program.barangay).toLowerCase()
      : normalizeText(profile.barangay).toLowerCase() === normalizeText(program.barangay).toLowerCase();
    addItem({ section: 'Residency', label: 'Barangay', expected, actual: profile.barangay, missing, passes, detail: missing ? 'Select your barangay in Profile Management.' : 'Your barangay must match the program coverage.' });
  }
  if (rules.minPersonalIncome || rules.maxPersonalIncome) {
    const expected = [rules.minPersonalIncome ? `minimum ${formatPeso(rules.minPersonalIncome)}` : '', rules.maxPersonalIncome ? `maximum ${formatPeso(rules.maxPersonalIncome)}` : ''].filter(Boolean).join(', ');
    const missing = personalIncome === null && !special.isStudent;
    addItem({ section: 'Income', label: 'Monthly personal income', expected, actual: personalIncome === null ? '' : formatPeso(personalIncome), missing, passes: personalIncome === null ? special.isStudent : (rules.minPersonalIncome ? personalIncome >= Number(rules.minPersonalIncome) : true) && (rules.maxPersonalIncome ? personalIncome <= Number(rules.maxPersonalIncome) : true), detail: missing ? 'Add your monthly personal income in Profile Management.' : '' });
  }
  if (rules.minHouseholdIncome || rules.maxHouseholdIncome) {
    const expected = [rules.minHouseholdIncome ? `minimum ${formatPeso(rules.minHouseholdIncome)}` : '', rules.maxHouseholdIncome ? `maximum ${formatPeso(rules.maxHouseholdIncome)}` : ''].filter(Boolean).join(', ');
    const missing = householdIncome === null;
    addItem({ section: 'Income', label: 'Household monthly income', expected, actual: householdIncome === null ? '' : formatPeso(householdIncome), missing, passes: (rules.minHouseholdIncome ? householdIncome >= Number(rules.minHouseholdIncome) : true) && (rules.maxHouseholdIncome ? householdIncome <= Number(rules.maxHouseholdIncome) : true), detail: missing ? 'Add exact household monthly income in Profile Management.' : '' });
  }
  if (rules.requiredEducationalAttainment) addItem({ section: 'Education', label: 'Educational attainment', expected: rules.requiredEducationalAttainment, actual: profile.educationStatus, missing: !profile.educationStatus, passes: normalizeText(profile.educationStatus).toLowerCase() === normalizeText(rules.requiredEducationalAttainment).toLowerCase(), detail: !profile.educationStatus ? 'Select educational attainment in Profile Management.' : '' });
  if (rules.requiresStudent) addItem({ section: 'Education', label: 'Student applicant', expected: 'Student', actual: special.isStudent ? 'Student' : profile.employmentStatus || profile.specialCategory, missing: !profile.employmentStatus && !profile.specialCategory, passes: special.isStudent, detail: special.isStudent ? '' : 'Set Employment status or Special category to Student in Profile Management.' });
  if (rules.requiredSchoolType) addItem({ section: 'Education', label: 'School type', expected: rules.requiredSchoolType, actual: profile.studentInfo?.schoolType, missing: !profile.studentInfo?.schoolType, passes: profile.studentInfo?.schoolType === rules.requiredSchoolType, detail: !profile.studentInfo?.schoolType ? 'Add student school type in Profile Management.' : '' });
  if (rules.requiredEducationalLevel) addItem({ section: 'Education', label: 'Educational level', expected: rules.requiredEducationalLevel, actual: profile.studentInfo?.educationalLevel || profile.educationStatus, missing: !profile.studentInfo?.educationalLevel && !profile.educationStatus, passes: normalizeText(profile.studentInfo?.educationalLevel || profile.educationStatus).toLowerCase() === normalizeText(rules.requiredEducationalLevel).toLowerCase(), detail: 'Your education level must match the program requirement.' });
  if (rules.requiredEmploymentStatus) addItem({ section: 'Work', label: 'Employment status', expected: rules.requiredEmploymentStatus, actual: profile.employmentStatus, missing: !profile.employmentStatus, passes: profile.employmentStatus === rules.requiredEmploymentStatus, detail: !profile.employmentStatus ? 'Select employment status in Profile Management.' : '' });
  if (rules.requiredOccupation && !special.isStudent) addItem({ section: 'Work', label: 'Occupation', expected: rules.requiredOccupation, actual: profile.occupation, missing: !profile.occupation, passes: normalizeText(profile.occupation).toLowerCase() === normalizeText(rules.requiredOccupation).toLowerCase(), detail: !profile.occupation ? 'Add occupation in Profile Management.' : '' });
  [
    ['requiresSeniorCitizen','isSeniorCitizen','Senior citizen'],
    ['requiresPwd','isPwd','PWD applicant'],
    ['requiresSoloParent','isSoloParent','Solo parent'],
    ['requiresFarmer','isFarmer','Farmer'],
    ['requiresFisherfolk','isFisherfolk','Fisherfolk'],
    ['requiresOutOfSchoolYouth','isOutOfSchoolYouth','Out-of-school youth'],
    ['requiresIndigenousPeoples','isIndigenousPeoples','Indigenous peoples'],
    ['requiresOfwFamily','isOfwFamily','OFW family'],
    ['requiresUnemployed','isUnemployed','Unemployed applicant'],
  ].forEach(([ruleKey, flagKey, label]) => {
    if (!rules[ruleKey]) return;
    addItem({ section: 'Special category', label, expected: label, actual: special[flagKey] ? label : profile.specialCategory, missing: !profile.specialCategory && !special[flagKey], passes: Boolean(special[flagKey]), detail: special[flagKey] ? '' : `Set your special category to ${label} if this applies to you.` });
  });
  [
    ['requiresFatherIncomeCheck','maxFatherIncome','father','Father monthly income'],
    ['requiresMotherIncomeCheck','maxMotherIncome','mother','Mother monthly income'],
    ['requiresGuardianIncomeCheck','maxGuardianIncome','guardian','Guardian monthly income'],
  ].forEach(([ruleKey, maxKey, relationship, label]) => {
    if (!rules[ruleKey]) return;
    const fi = readNumber(findFamilyMember(profile, relationship)?.monthlyIncome);
    const missing = fi === null;
    addItem({ section: 'Family income', label, expected: rules[maxKey] ? `maximum ${formatPeso(rules[maxKey])}` : 'Required', actual: fi === null ? '' : formatPeso(fi), missing, passes: !rules[maxKey] || fi <= Number(rules[maxKey]), detail: missing ? `Add ${relationship} monthly income in family member details.` : '' });
  });
  if (program.slots > 0) addItem({ section: 'Program capacity', label: 'Available slots', expected: `${program.slots} slot(s)`, actual: `${applicationCount} active application(s) recorded`, passes: applicationCount < Number(program.slots), detail: applicationCount >= Number(program.slots) ? 'Program slots are already full.' : '' });
  const customNotes = Array.isArray(program.eligibility) ? program.eligibility : [];
  customNotes.forEach((note) => items.push({ section: 'Office criteria', label: note, expected: 'Manual office review', actual: 'Shown for applicant preparation', status: 'info', detail: 'This criterion is listed by the office and may be checked during review.' }));
  const failed = items.filter((i) => i.status === 'fail');
  const missing = items.filter((i) => i.status === 'missing');
  const checkable = items.filter((i) => i.status !== 'info');
  const passed = checkable.filter((i) => i.status === 'pass').length;
  const score = checkable.length ? Math.round((passed / checkable.length) * 100) : Number(program.fitScore) || 0;
  return { items, failed, missing, passed, total: checkable.length, score, qualified: failed.length === 0 && missing.length === 0 };
}
function getDisplayFitScore(program = {}, eligibilitySummary = null) {
  const explicit = Number(program.fitScore);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return eligibilitySummary?.score || 0;
}

/* ============================================================
   VISUAL COMPONENTS
============================================================ */

function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  let cls = 'spv-status-badge spv-status-badge--neutral';
  if (['open','approved','completed','verified','active'].includes(normalized))          cls = 'spv-status-badge spv-status-badge--green';
  else if (['upcoming','submitted','pending','pending review','for review','incomplete'].includes(normalized)) cls = 'spv-status-badge spv-status-badge--amber';
  else if (['closed','rejected','archived','inactive'].includes(normalized))             cls = 'spv-status-badge spv-status-badge--red';
  return <span className={cls}>{status}</span>;
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="spv-metric-card">
      <span className="spv-metric-icon"><Icon name={icon} size={14} /></span>
      <div className="spv-metric-copy">
        <span className="spv-metric-label">{label}</span>
        <strong className="spv-metric-value">{value || '—'}</strong>
      </div>
    </div>
  );
}

function SectionCard({ eyebrow, title, children }) {
  return (
    <div className="spv-section-card">
      <div className="spv-section-card-header">
        {eyebrow ? <span className="spv-eyebrow">{eyebrow}</span> : null}
        {title ? <h3 className="spv-section-title">{title}</h3> : null}
      </div>
      <div className="spv-section-card-body">{children}</div>
    </div>
  );
}

function InfoBlock({ icon, title, children }) {
  return (
    <div className="spv-info-block">
      <div className="spv-info-block-head">
        <span className="spv-info-block-icon"><Icon name={icon} size={14} /></span>
        <strong className="spv-info-block-title">{title}</strong>
      </div>
      <p className="spv-info-block-text">{children}</p>
    </div>
  );
}

function EligibilityStatusChip({ status }) {
  const map = {
    pass:    { icon: 'check',    label: 'Passed',        cls: 'is-pass' },
    missing: { icon: 'alert',    label: 'Needs info',    cls: 'is-missing' },
    info:    { icon: 'document', label: 'For review',    cls: 'is-info' },
    fail:    { icon: 'x',        label: 'Not qualified', cls: 'is-fail' },
  };
  const tone = map[status] || map.fail;
  return (
    <span className={`spv-elig-chip ${tone.cls}`}>
      <Icon name={tone.icon} size={11} />
      {tone.label}
    </span>
  );
}

function RequirementList({ requirements, application = null }) {
  if (!requirements.length) {
    return (
      <div className="spv-empty-note">
        No document requirements were provided for this program.
      </div>
    );
  }
  return (
    <div className="spv-table-wrap">
      <table className="spv-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Document Requirement</th>
            <th>Description</th>
            <th>Accepted Document Types</th>
            <th>Files</th>
            <th>Sources &amp; References</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((req, idx) => {
            const upload  = getRequirementUpload(application, req);
            const sources = Array.isArray(req.sources) ? req.sources : [];
            return (
              <tr key={req.id || getRequirementName(req)}>
                <td style={{ color: '#9aafc0', fontWeight: 700, width: 32 }}>{idx + 1}</td>
                <td>
                  <strong className="spv-table-name">{getRequirementName(req)}</strong>
                  <span className="spv-table-muted">{req?.isRequired === false ? 'Optional' : 'Required'}</span>
                  {upload?.fileName ? (
                    <span className="spv-table-uploaded">Uploaded: {upload.fileName}</span>
                  ) : null}
                </td>
                <td className="spv-table-muted">{req.description || 'No description provided.'}</td>
                <td className="spv-table-muted">{formatDocumentTypeList(getRequirementAcceptedDocumentTypes(req), 'Not specified')}</td>
                <td className="spv-table-muted">{req.allowMultipleFiles ? 'Multiple files allowed' : 'One document only'}</td>
                <td>
                  {sources.length ? (
                    <div className="spv-source-list">
                      {sources.map((src) => (
                        <div key={src.id || `${src.sourceName}-${src.instructions}`} className="spv-source-item">
                          <span className="spv-source-name">{src.sourceName || src.sourceType || 'Issuing office'}</span>
                          {src.instructions ? <span className="spv-source-detail">{src.instructions}</span> : null}
                          {(src.estimatedProcessingTime || src.feeAmount) ? (
                            <span className="spv-source-detail">
                              {src.estimatedProcessingTime ? `Processing: ${src.estimatedProcessingTime}` : ''}
                              {src.estimatedProcessingTime && src.feeAmount ? ' · ' : ''}
                              {src.feeAmount ? `Fee: ${formatPeso(src.feeAmount)}` : ''}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="spv-table-muted">No source references provided.</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EligibilityBreakdownList({ items }) {
  if (!items.length) {
    return (
      <div className="spv-empty-note">
        No program-specific eligibility rules were configured. The office may still review submitted documents manually.
      </div>
    );
  }
  return (
    <div className="spv-table-wrap">
      <table className="spv-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Qualification Check</th>
            <th>Status</th>
            <th>Required</th>
            <th>Your Profile</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={`${item.section}-${item.label}-${idx}`}>
              <td><span className="spv-elig-section">{item.section}</span></td>
              <td><strong className="spv-table-name">{item.label}</strong></td>
              <td><EligibilityStatusChip status={item.status} /></td>
              <td className="spv-table-muted">{item.expected}</td>
              <td className="spv-table-muted">{item.actual}</td>
              <td className="spv-table-muted">{item.detail || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EligibilityPanel({ eligibilitySummary, navigate }) {
  const blocking = [...eligibilitySummary.failed, ...eligibilitySummary.missing];
  const { qualified, score, failed } = eligibilitySummary;

  let scoreCls = 'spv-score-ring--amber';
  let panelCls = 'spv-elig-panel spv-elig-panel--amber';
  let statusLabel = 'Profile details needed';
  if (qualified)       { scoreCls = 'spv-score-ring--green'; panelCls = 'spv-elig-panel spv-elig-panel--green'; statusLabel = 'Qualified based on current profile'; }
  else if (failed.length) { scoreCls = 'spv-score-ring--red';   panelCls = 'spv-elig-panel spv-elig-panel--red';   statusLabel = 'Not qualified based on current profile'; }

  return (
    <div className={panelCls}>
      {/* Score + title */}
      <div className="spv-elig-panel-left">
        <div className={`spv-score-ring ${scoreCls}`}>
          <span className="spv-score-value">{score}%</span>
          <span className="spv-score-label">match</span>
        </div>
        <div className="spv-elig-title-block">
          <strong className="spv-elig-status-title">{statusLabel}</strong>
          <p className="spv-elig-status-desc">
            {qualified
              ? 'Your saved profile meets the configured checks for this program.'
              : 'Review the issues below before applying. Staff may still do final document validation.'}
          </p>
        </div>
      </div>

      {/* Issues + action */}
      {blocking.length > 0 ? (
        <div className="spv-elig-panel-right">
          <div className="spv-elig-issues">
            {blocking.slice(0, 3).map((issue) => (
              <div key={`${issue.section}-${issue.label}`} className="spv-elig-issue-row">
                <EligibilityStatusChip status={issue.status} />
                <span className="spv-elig-issue-label">{issue.label}</span>
              </div>
            ))}
            {blocking.length > 3 ? (
              <span className="spv-elig-more">+{blocking.length - 3} more issue{blocking.length - 3 > 1 ? 's' : ''}</span>
            ) : null}
          </div>
          <button className="spv-ghost-btn" onClick={() => navigate('/applicant/profile-management')}>
            Update Profile Details
            <Icon name="arrow-right" size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* Tab content components */
function OverviewTab({ program, eligibilitySummary }) {
  return (
    <div className="spv-tab-content-grid">
      <SectionCard eyebrow="Program Overview" title="Objective &amp; Benefits">
        <div className="spv-info-block-list">
          <InfoBlock icon="target" title="Objective">
            {program.objective || 'No objective provided.'}
          </InfoBlock>
          <InfoBlock icon="star" title="Benefits">
            {program.benefits || 'No benefit summary provided.'}
          </InfoBlock>
        </div>
      </SectionCard>
      <SectionCard eyebrow="Coverage" title="Where the support applies">
        <p className="spv-muted-text">{program.coverageNotes || 'No coverage notes provided.'}</p>
        <div className="spv-metrics-2col">
          <MetricCard icon="office"    label="Managing Office"       value={program.office} />
          <MetricCard icon="location"  label="Municipality"          value={program.municipality} />
          <MetricCard icon="users"     label="Max. Beneficiaries"    value={`${getProgramCapacity(program)} slots`} />
          <MetricCard icon="star"      label="Estimated Fit"         value={`${getDisplayFitScore(program, eligibilitySummary)}% match`} />
        </div>
      </SectionCard>
    </div>
  );
}

function PrepareTab({ program, requirements, existingApplication }) {
  const attachments = program.attachments || [];
  return (
    <div className="spv-tab-content-stack">
      <SectionCard eyebrow="Submission Guide" title="What to prepare before applying">
        <div className="spv-info-block-list">
          <InfoBlock icon="document" title="Submission Instructions">
            {program.submissionInstructions || 'No submission instructions provided.'}
          </InfoBlock>
          <InfoBlock icon="clock" title="Additional Notes">
            {program.additionalNotes || 'No additional notes provided.'}
          </InfoBlock>
        </div>
      </SectionCard>
      <SectionCard eyebrow="Checklist" title="Documents and references">
        <RequirementList requirements={requirements} application={existingApplication} />
        {attachments.length ? (
          <div style={{ marginTop: 14 }}>
            <p className="spv-subsection-label">Program attachments</p>
            <div className="spv-attachment-chips">
              {attachments.map((item) => (
                <span key={item} className="spv-attachment-chip">{item}</span>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

function EligibilityTab({ program, eligibilitySummary }) {
  return (
    <div className="spv-tab-content-stack">
      <SectionCard eyebrow="Eligibility" title="Qualification checks against your profile">
        <EligibilityBreakdownList items={eligibilitySummary.items} />
      </SectionCard>
      <SectionCard eyebrow="Program Facts" title="Key dates and details">
        <div className="spv-metrics-2col">
          <MetricCard icon="calendar" label="Application Period" value={formatProgramWindow(program)} />
          <MetricCard icon="clock"    label="Deadline"           value={formatProgramDate(program.deadline)} />
          <MetricCard icon="office"   label="Managing Office"    value={program.office} />
          <MetricCard icon="location" label="Municipality"       value={program.municipality} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */
export default function ApplicantProgramViewScreen({ session, data, actions, navigate }) {
  const urlProgramId = (() => {
    try {
      const sp = new URL(window.location.href).searchParams;
      const pid = sp.get('programId') || sp.get('programid') || sp.get('id');
      if (pid) return pid;
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      if (qIndex >= 0) {
        const params = new URLSearchParams(hash.slice(qIndex));
        return params.get('programId') || params.get('programid') || params.get('id');
      }
    } catch { return null; }
    return null;
  })();

  let selectedProgram = getProgramById(data.programs, data.composer.programId);
  if (!selectedProgram && urlProgramId) selectedProgram = getProgramById(data.programs, urlProgramId);

  const applicantApplications      = getApplicantApplications(data, session);
  const existingApplication        = selectedProgram ? applicantApplications.find((a) => a.programId === selectedProgram.id) : null;
  const existingApplicationStatus = normalizeText(existingApplication?.status).toLowerCase();
  const isExistingApplicationDraft = existingApplicationStatus === 'draft';
  const existingApplicationRemark  = existingApplication ? getApplicationOfficeRemark(existingApplication) : '';
  const existingApplicationRemarkLabel = existingApplication ? getApplicationOfficeRemarkLabel(existingApplication) : 'Office remark';
  const isBookmarked    = selectedProgram ? data.bookmarks.includes(selectedProgram.id) : false;
  const intakeEnded     = selectedProgram ? isProgramIntakeEnded(selectedProgram) : false;
  const canApply        = selectedProgram ? canApplicantApplyToProgram(selectedProgram) : false;
  const bookmarkReminder = selectedProgram ? getProgramBookmarkReminder(selectedProgram, isBookmarked) : '';
  const activeApplicationCount = selectedProgram
    ? (data.applications || []).filter((a) => a.programId === selectedProgram.id && !['Rejected','Cancelled'].includes(a.status)).length
    : 0;
  const requirementItems   = selectedProgram ? getRequirementItems(selectedProgram) : [];
  const eligibilitySummary = selectedProgram ? buildEligibilityBreakdown(data.applicantProfile || {}, selectedProgram, activeApplicationCount) : null;
  const displayFitScore    = selectedProgram ? getDisplayFitScore(selectedProgram, eligibilitySummary) : 0;
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { setActiveTab('overview'); }, [selectedProgram?.id]);

  const programImageSource = selectedProgram ? (getProgramPhotoSource(selectedProgram) || getProgramIllustrationSource(selectedProgram)) : null;

  /* ---- Empty state ---- */
  if (!selectedProgram) {
    return (
      <>
        {SPV_STYLES}
        <div className="spv-root">
          <div className="spv-empty-state">
            <span className="spv-eyebrow">Program Details</span>
            <h1 className="spv-empty-title">No program selected</h1>
            <p className="spv-empty-body">Open Search Programs and click View Program on a listing to see its full details.</p>
            <button className="spv-primary-btn" onClick={() => navigate('/applicant/search-programs')}>
              <Icon name="arrow-left" size={14} />
              Back to Search Programs
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {SPV_STYLES}
      <div className="spv-root">

        {/* ====================================================
            HEADER CARD
        ==================================================== */}
        <div className="spv-panel">
          {/* Breadcrumb row */}
          <div className="spv-breadcrumb">
            <button className="spv-back-btn" onClick={() => navigate('/applicant/search-programs')}>
              <Icon name="arrow-left" size={14} />
              Back to Search Programs
            </button>
            <button
              className={`spv-bookmark-btn${isBookmarked ? ' is-active' : ''}`}
              onClick={() => actions.toggleBookmark(selectedProgram.id)}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this program'}
            >
              <Icon name={isBookmarked ? 'bookmark-on' : 'bookmark-off'} size={16} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>

          {/* Hero: two columns */}
          <div className="spv-hero">
            {/* Left: copy */}
            <div className="spv-hero-copy">
              {/* Badge row */}
              <div className="spv-badge-row">
                <span className="spv-category-badge">{selectedProgram.category}</span>
                <StatusBadge status={selectedProgram.status} />
                <span className="spv-fit-badge">
                  <Icon name="star" size={11} />
                  {displayFitScore}% fit
                </span>
                {existingApplication ? <StatusBadge status={existingApplication.status} /> : null}
              </div>

              {/* Title */}
              <h1 className="spv-title">{selectedProgram.title}</h1>

              {/* Description */}
              <p className="spv-description">
                {selectedProgram.description || selectedProgram.summary}
              </p>

              {/* Metrics */}
              <div className="spv-metrics-grid">
                <MetricCard icon="office"    label="Managing Office"     value={selectedProgram.office} />
                <MetricCard icon="location"  label="Municipality"        value={selectedProgram.municipality} />
                <MetricCard icon="calendar"  label="Application Period"  value={formatProgramWindow(selectedProgram)} />
                <MetricCard icon="clock"     label="Deadline"            value={formatProgramDate(selectedProgram.deadline)} />
              </div>

              {/* Action buttons */}
              <div className="spv-action-row">
                {existingApplication ? (
                  isExistingApplicationDraft ? (
                    <button className="spv-primary-btn" onClick={() => actions.startApplication(selectedProgram.id)}>
                      Continue Draft
                      <Icon name="arrow-right" size={14} />
                    </button>
                  ) : (
                    <button className="spv-primary-btn" onClick={() => navigate('/applicant/manage-applications')}>
                      View My Application
                      <Icon name="arrow-right" size={14} />
                    </button>
                  )
                ) : canApply ? (
                  <button className="spv-primary-btn" onClick={() => actions.startApplication(selectedProgram.id)}>
                    Apply for this Program
                    <Icon name="arrow-right" size={14} />
                  </button>
                ) : (
                  <button className="spv-disabled-btn" disabled>
                    Applications Closed
                  </button>
                )}
              </div>
            </div>

            {/* Right: hero image */}
            <div className="spv-hero-image">
              {programImageSource ? (
                <img
                  src={programImageSource}
                  alt={selectedProgram.title}
                  loading="lazy"
                  className="spv-hero-img"
                />
              ) : (
                <div className="spv-hero-placeholder">
                  <Icon name="document" size={40} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
            INTAKE CLOSED ALERT
        ==================================================== */}
        {intakeEnded ? (
          <div className="spv-alert-banner spv-alert-banner--amber">
            <div className="spv-alert-icon"><Icon name="clock" size={16} /></div>
            <div className="spv-alert-copy">
              <strong className="spv-alert-title">Application window ended</strong>
              <p className="spv-alert-body">{bookmarkReminder || 'Make sure you have prepared the necessary requirements and supporting files before the next intake opens.'}</p>
            </div>
          </div>
        ) : null}

        {/* ====================================================
            EXISTING APPLICATION BANNER
        ==================================================== */}
        {existingApplication ? (
          <div className="spv-panel">
            <div className="spv-app-banner-top">
              <div className="spv-app-banner-copy">
                <strong className="spv-app-banner-title">
                  {isExistingApplicationDraft
                    ? 'You have a saved application draft'
                    : 'You have an existing application'}
                </strong>
                <p className="spv-app-banner-desc">
                  {isExistingApplicationDraft
                    ? 'Finish the remaining requirements and submit when you are ready.'
                    : 'You already submitted an application for this program. Go to Manage Applications to track the latest progress.'}
                </p>
              </div>
              <div className="spv-app-banner-right">
                <StatusBadge status={existingApplication.status} />
                {isExistingApplicationDraft ? (
                  <button className="spv-ghost-btn" onClick={() => actions.startApplication(selectedProgram.id)}>
                    Continue Draft
                    <Icon name="arrow-right" size={13} />
                  </button>
                ) : (
                  <button className="spv-ghost-btn" onClick={() => navigate('/applicant/manage-applications')}>
                    Open Manage Applications
                    <Icon name="arrow-right" size={13} />
                  </button>
                )}
              </div>
            </div>

            {existingApplicationRemark ? (
              <div className="spv-remark-block">
                <span className="spv-remark-label">{existingApplicationRemarkLabel}</span>
                <p className="spv-remark-text">{existingApplicationRemark}</p>
                {existingApplication.reviewedAt ? (
                  <span className="spv-remark-date">Recorded {formatProgramDate(existingApplication.reviewedAt)}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ====================================================
            ELIGIBILITY / READINESS PANEL
        ==================================================== */}
        {eligibilitySummary ? (
          <EligibilityPanel eligibilitySummary={eligibilitySummary} navigate={navigate} />
        ) : null}

        {/* ====================================================
            DETAIL TABS
        ==================================================== */}
        <div className="spv-panel">
          {/* Tab bar */}
          <div className="spv-tab-bar">
            {[
              { key: 'overview',     label: 'Program Overview' },
              { key: 'prepare',      label: 'What to Prepare' },
              { key: 'eligibility',  label: 'Who Can Apply' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`spv-tab-btn${activeTab === key ? ' is-active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="spv-tab-panel">
            {activeTab === 'overview'    ? <OverviewTab   program={selectedProgram} eligibilitySummary={eligibilitySummary} /> : null}
            {activeTab === 'prepare'     ? <PrepareTab    program={selectedProgram} requirements={requirementItems} existingApplication={existingApplication} /> : null}
            {activeTab === 'eligibility' ? <EligibilityTab program={selectedProgram} eligibilitySummary={eligibilitySummary} /> : null}
          </div>
        </div>

      </div>
    </>
  );
}

/* ============================================================
   STYLES  (defined here so JSX above can reference SPV_STYLES)
============================================================ */
const SPV_STYLES = (
  <style>{`
    /* ---- Root ---- */
    .spv-root {
      font-family: var(--pf-font-body, 'Public Sans', system-ui, sans-serif);
      display: grid;
      gap: 18px;
      padding: 4px 0 32px;
      color: #1a2637;
    }

    /* ---- Panel (white card) ---- */
    .spv-panel {
      background: #ffffff;
      border: 1px solid #d7dde8;
      border-radius: 16px;
      box-shadow: 0 1px 4px rgba(15,35,62,.06);
      overflow: hidden;
    }

    /* ---- Breadcrumb ---- */
    .spv-breadcrumb {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 22px;
      border-bottom: 1px solid #e8ecf2;
      background: #f8fafd;
      flex-wrap: wrap;
    }
    .spv-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #3a5a84;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }
    .spv-back-btn:hover { color: #0f2f63; }
    .spv-bookmark-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #3a5a84;
      background: none;
      border: 1px solid #d0daea;
      border-radius: 8px;
      padding: 5px 11px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .spv-bookmark-btn:hover { background: #f0f5ff; border-color: #b0c4e8; }
    .spv-bookmark-btn.is-active { color: #1a4080; border-color: #a0bcec; background: #eef4ff; }

    /* ---- Hero ---- */
    .spv-hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(260px, .55fr);
      gap: 24px;
      padding: 24px 22px;
      align-items: start;
    }
    .spv-hero-copy {
      display: grid;
      gap: 16px;
      align-content: start;
    }

    /* Badge row */
    .spv-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .spv-category-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      background: #f0f3f8;
      color: #5e7086;
      font-size: 12px;
      font-weight: 700;
    }
    .spv-status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .04em;
    }
    .spv-status-badge--green  { background: #d4f0e2; color: #186840; }
    .spv-status-badge--amber  { background: #fff3d6; color: #875900; }
    .spv-status-badge--red    { background: #fde8e6; color: #8a2e28; }
    .spv-status-badge--neutral { background: #f0f3f8; color: #6a7e94; }
    .spv-fit-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #eef4ff;
      color: #2a4e8c;
      font-size: 12px;
      font-weight: 700;
    }

    /* Title + description */
    .spv-title {
      margin: 0;
      font-size: clamp(20px, 2.6vw, 26px);
      font-weight: 800;
      color: #0f2037;
      line-height: 1.18;
      letter-spacing: -0.02em;
    }
    .spv-description {
      margin: 0;
      font-size: 14px;
      color: #5e7086;
      line-height: 1.7;
      max-width: 640px;
    }

    /* Metrics */
    .spv-metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .spv-metrics-2col {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .spv-metric-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 13px;
      border-radius: 10px;
      background: #f8fafd;
      border: 1px solid #e8ecf2;
    }
    .spv-metric-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #dde9ff;
      color: #2a4e8c;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .spv-metric-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .spv-metric-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: #9aafc0;
    }
    .spv-metric-value {
      font-size: 13.5px;
      color: #0f2037;
      font-weight: 700;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    /* Action row */
    .spv-action-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .spv-primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 42px;
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      background: #0f2f63;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .spv-primary-btn:hover { background: #1a4582; }
    .spv-ghost-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 38px;
      padding: 8px 14px;
      border-radius: 9px;
      border: 1px solid #d0daea;
      background: #ffffff;
      color: #2a4e8c;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s;
    }
    .spv-ghost-btn:hover { background: #f0f5ff; border-color: #b0c4e8; }
    .spv-disabled-btn {
      display: inline-flex;
      align-items: center;
      min-height: 42px;
      padding: 10px 20px;
      border-radius: 10px;
      border: 1px solid #d0daea;
      background: #f4f6f9;
      color: #9aafc0;
      font-size: 14px;
      font-weight: 700;
      cursor: not-allowed;
    }

    /* Hero image */
    .spv-hero-image {
      border-radius: 12px;
      overflow: hidden;
      background: #dde6f4;
      border: 1px solid #d7dde8;
      aspect-ratio: 4/3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spv-hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .spv-hero-placeholder {
      color: #b8c8d8;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }

    /* ---- Alert banners ---- */
    .spv-alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 20px;
      border-radius: 16px;
      border: 1px solid transparent;
    }
    .spv-alert-banner--amber {
      background: #fff8e6;
      border-color: #efd488;
      color: #8a5a05;
    }
    .spv-alert-banner--red {
      background: #fff4f3;
      border-color: #f0bcb5;
      color: #8a2e28;
    }
    .spv-alert-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
    .spv-alert-copy { display: grid; gap: 4px; }
    .spv-alert-title { font-size: 14px; font-weight: 700; }
    .spv-alert-body  { margin: 0; font-size: 13px; line-height: 1.6; }

    /* ---- Existing application banner ---- */
    .spv-app-banner-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 20px;
      flex-wrap: wrap;
    }
    .spv-app-banner-copy { display: grid; gap: 4px; flex: 1; }
    .spv-app-banner-title { font-size: 15px; font-weight: 700; color: #0f2037; }
    .spv-app-banner-desc  { margin: 0; font-size: 13px; color: #5e7086; line-height: 1.6; }
    .spv-app-banner-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .spv-remark-block {
      margin: 0 20px 18px;
      padding: 14px 16px;
      border-radius: 10px;
      background: #eef4ff;
      border: 1px solid #c8d8f5;
      display: grid;
      gap: 6px;
    }
    .spv-remark-label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #2a4e8c; }
    .spv-remark-text  { margin: 0; font-size: 13.5px; color: #0f2037; line-height: 1.65; }
    .spv-remark-date  { font-size: 12px; color: #9aafc0; }

    /* ---- Eligibility panel ---- */
    .spv-elig-panel {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 18px 22px;
      border-radius: 16px;
      border: 1px solid transparent;
      flex-wrap: wrap;
    }
    .spv-elig-panel--green { background: #f2faf6; border-color: #b0dfc4; }
    .spv-elig-panel--amber { background: #fffbf0; border-color: #efd488; }
    .spv-elig-panel--red   { background: #fff8f7; border-color: #f0bcb5; }
    .spv-elig-panel-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 260px;
    }
    .spv-score-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 4px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .spv-score-ring--green { border-color: #4caf80; }
    .spv-score-ring--amber { border-color: #dab04a; }
    .spv-score-ring--red   { border-color: #d05050; }
    .spv-score-value { font-size: 18px; font-weight: 800; color: #0f2037; line-height: 1; }
    .spv-score-label { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #9aafc0; }
    .spv-elig-title-block { display: grid; gap: 5px; }
    .spv-elig-status-title { font-size: 15px; font-weight: 700; color: #0f2037; }
    .spv-elig-status-desc  { margin: 0; font-size: 13px; color: #5e7086; line-height: 1.55; max-width: 440px; }
    .spv-elig-panel-right {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      flex-shrink: 0;
    }
    .spv-elig-issues { display: grid; gap: 7px; }
    .spv-elig-issue-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #3a5060;
    }
    .spv-elig-issue-label { font-weight: 600; }
    .spv-elig-more { font-size: 12px; color: #9aafc0; }
    .spv-elig-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .spv-elig-chip.is-pass    { background: #d4f0e2; color: #186840; }
    .spv-elig-chip.is-missing { background: #fff3d6; color: #875900; }
    .spv-elig-chip.is-info    { background: #f0f3f8; color: #6a7e94; }
    .spv-elig-chip.is-fail    { background: #fde8e6; color: #8a2e28; }
    .spv-elig-section {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: #4a6890;
      white-space: nowrap;
    }

    /* ---- Tabs ---- */
    .spv-tab-bar {
      display: flex;
      gap: 0;
      border-bottom: 1px solid #e8ecf2;
      padding: 0 20px;
      overflow-x: auto;
    }
    .spv-tab-btn {
      display: inline-flex;
      align-items: center;
      padding: 13px 16px;
      border: none;
      border-bottom: 2px solid transparent;
      background: none;
      color: #6a7e94;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .spv-tab-btn:hover:not(.is-active) { color: #2a4e8c; }
    .spv-tab-btn.is-active { color: #0f2f63; border-bottom-color: #0f2f63; font-weight: 700; }
    .spv-tab-panel { padding: 22px 20px; }

    /* ---- Tab content layouts ---- */
    .spv-tab-content-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      align-items: start;
    }
    .spv-tab-content-stack { display: grid; gap: 16px; }

    /* ---- Section card ---- */
    .spv-section-card {
      border: 1px solid #e8ecf2;
      border-radius: 12px;
      overflow: hidden;
    }
    .spv-section-card-header {
      padding: 13px 16px;
      background: #f8fafd;
      border-bottom: 1px solid #e8ecf2;
      display: grid;
      gap: 3px;
    }
    .spv-section-card-body { padding: 16px; }

    /* ---- Typography helpers ---- */
    .spv-eyebrow {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #4a6890;
    }
    .spv-section-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #0f2037;
    }
    .spv-muted-text {
      margin: 0 0 12px;
      font-size: 13.5px;
      color: #5e7086;
      line-height: 1.7;
    }
    .spv-subsection-label {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      color: #5e7086;
    }

    /* ---- Info blocks (objective, benefits, etc.) ---- */
    .spv-info-block-list { display: grid; gap: 10px; }
    .spv-info-block {
      padding: 13px 14px;
      border-radius: 10px;
      background: #f8fafd;
      border: 1px solid #e8ecf2;
      display: grid;
      gap: 8px;
    }
    .spv-info-block-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spv-info-block-icon {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #dde9ff;
      color: #2a4e8c;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .spv-info-block-title { font-size: 13px; font-weight: 700; color: #0f2037; }
    .spv-info-block-text  { margin: 0; font-size: 13.5px; color: #5e7086; line-height: 1.7; }

    /* ---- Tables ---- */
    .spv-table-wrap {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid #e0e8f0;
      background: #ffffff;
    }
    .spv-table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
    }
    .spv-table thead th {
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #9aafc0;
      background: #f8fafd;
      padding: 10px 12px;
      border-bottom: 1px solid #e0e8f0;
      white-space: nowrap;
    }
    .spv-table tbody td {
      vertical-align: top;
      padding: 11px 12px;
      border-top: 1px solid #f0f4f9;
      font-size: 13.5px;
      color: #1a2637;
      line-height: 1.5;
    }
    .spv-table tbody tr:first-child td { border-top: 0; }
    .spv-table tbody tr:hover td { background: #fafbfd; }
    .spv-table-name {
      display: block;
      font-weight: 700;
      color: #0f2037;
      line-height: 1.35;
    }
    .spv-table-uploaded {
      display: block;
      font-size: 12px;
      color: #8a9bb0;
      margin-top: 3px;
      overflow-wrap: anywhere;
    }
    .spv-table-muted { color: #5e7086; font-size: 13px; }

    /* Source items */
    .spv-source-list { display: grid; gap: 7px; }
    .spv-source-item {
      display: grid;
      gap: 3px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #e0e8f0;
      background: #f8fafd;
    }
    .spv-source-name   { font-size: 13px; font-weight: 700; color: #0f2037; overflow-wrap: anywhere; }
    .spv-source-detail { font-size: 12px; color: #8a9bb0; line-height: 1.5; overflow-wrap: anywhere; }

    /* ---- Attachment chips ---- */
    .spv-attachment-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .spv-attachment-chip {
      display: inline-flex;
      padding: 5px 11px;
      border-radius: 999px;
      background: #f0f3f8;
      color: #5e7086;
      font-size: 13px;
      font-weight: 600;
    }

    /* ---- Empty note ---- */
    .spv-empty-note {
      padding: 18px 16px;
      border-radius: 10px;
      border: 1px dashed #d0daea;
      color: #8a9bb0;
      font-size: 13.5px;
      line-height: 1.6;
    }

    /* ---- Empty state ---- */
    .spv-empty-state {
      background: #ffffff;
      border: 1px solid #d7dde8;
      border-radius: 16px;
      box-shadow: 0 1px 4px rgba(15,35,62,.06);
      padding: 40px 32px;
      display: grid;
      gap: 14px;
      max-width: 520px;
    }
    .spv-empty-title { margin: 0; font-size: 22px; font-weight: 800; color: #0f2037; line-height: 1.2; }
    .spv-empty-body  { margin: 0; font-size: 14px; color: #5e7086; line-height: 1.65; }

    /* ---- Responsive ---- */
    @media (max-width: 1050px) {
      .spv-hero { grid-template-columns: 1fr; }
      .spv-hero-image { max-height: 260px; }
      .spv-tab-content-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .spv-hero { padding: 18px; gap: 16px; }
      .spv-metrics-grid, .spv-metrics-2col { grid-template-columns: 1fr; }
      .spv-elig-panel { flex-direction: column; }
      .spv-elig-panel-right { width: 100%; }
      .spv-app-banner-top { flex-direction: column; }
      .spv-breadcrumb { padding: 12px 16px; }
      .spv-tab-panel { padding: 16px; }
    }
  `}</style>
);
