import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, FormField, SelectField, StatusPill } from 'Components/UI';
import {
  canComposeProgramContent,
  canReviewApplicants,
  canSetProgramRelease,
  getAccountRoleLabel,
} from 'Utils/staffHierarchy';
import { getTaxonomyNames, getTaxonomyOptions } from 'Utils/programTaxonomy';
import { listProgramRecords } from 'Services/Supabase/programs';
import {
  getProgramIllustrationSource,
  getProgramPhotoSource,
  getProgramSurfaceLabel,
  getProgramVisualTheme,
} from 'Services/Applicant/applicant-utils';
import { formatDocumentTypeList, uniqueDocumentTypes } from 'Constants/documentTypes';

const STATUS_FILTERS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft',        value: 'Draft' },
  { label: 'Open',         value: 'Open' },
  { label: 'Closed',       value: 'Closed' },
  { label: 'Completed',    value: 'Completed' },
  { label: 'Cancelled',    value: 'Cancelled' },
  { label: 'Archived',     value: 'Archived' },
];

const FORM_STATUS_OPTIONS = [
  { label: 'Draft',    value: 'Draft' },
  { label: 'Open',     value: 'Open' },
  { label: 'Closed',   value: 'Closed' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const PROGRAM_TYPE_OPTIONS = [
  { label: 'Municipal Assistance Program',      value: 'Municipal Assistance Program' },
  { label: 'Barangay Assistance Program',       value: 'Barangay Assistance Program' },
  { label: 'Provincial Assistance Program',     value: 'Provincial Assistance Program' },
  { label: 'Livelihood Program',                value: 'Livelihood Program' },
  { label: 'Education Support Program',         value: 'Education Support Program' },
  { label: 'Health Assistance Program',         value: 'Health Assistance Program' },
  { label: 'Disaster Relief Program',           value: 'Disaster Relief Program' },
  { label: 'Social Welfare Program',            value: 'Social Welfare Program' },
  { label: 'Infrastructure / Community Program',value: 'Infrastructure / Community Program' },
  { label: 'Special Project Program',           value: 'Special Project Program' },
];

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'list':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>;
    case 'office':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9l9-6 9 6"/></svg>;
    case 'check-circle':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'users':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M21 20a4.5 4.5 0 0 0-7-3.7"/></svg>;
    case 'search':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.35-4.35"/></svg>;
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="7"/></svg>;
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(value) {
  if (!value) return 'Not set';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function formatWindow(program) {
  if (program.applicationStartDate && program.applicationEndDate)
    return `${formatDate(program.applicationStartDate)} to ${formatDate(program.applicationEndDate)}`;
  if (program.deadline) return `Deadline ${formatDate(program.deadline)}`;
  return 'Schedule to be announced';
}

function getDisplayStatus(program) {
  return program.archived ? 'Archived' : program.status || 'Open';
}

function isPreviewableImageReference(value) {
  return /^(https?:|data:image\/|blob:|\/)/i.test(String(value || '').trim());
}

function getImageFileLabel(program) {
  const reference = program?.coverImagePath || program?.cover_image_path || program?.imageName || '';
  const normalized = String(reference || '').trim();
  if (!normalized) return '';
  return normalized.split(/[\\/]/).filter(Boolean).pop() || normalized;
}

function createRequirementTemplateOverride(template = {}) {
  const acceptedDocumentTypes = uniqueDocumentTypes(
    template.acceptedDocumentTypes || template.accepted_document_types || []
  );
  return {
    acceptedDocumentTypes,
    expectedDocumentType: acceptedDocumentTypes[0] || '',
    isRequired: template.isRequired ?? true,
    allowMultipleFiles: template.allowMultipleFiles ?? false,
    sortOrder: template.sortOrder ?? 0,
    description: template.description || '',
  };
}

function normalizeOfficeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ');
}

function normalizeRoleText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function isProgramOwnedBySessionOffice(program, session) {
  const sessionUserId = String(session?.id || '').trim();
  const createdByUserId = String(program?.createdByUserId || program?.created_by || '').trim();
  if (sessionUserId && createdByUserId && sessionUserId === createdByUserId) {
    return true;
  }

  const programOfficeId = String(program?.officeId || program?.office_id || '').trim();
  const sessionOfficeId = String(session?.officeId || session?.office_id || '').trim();
  if (programOfficeId && sessionOfficeId) {
    return programOfficeId === sessionOfficeId;
  }

  const officeMatches = normalizeOfficeText(program?.office) === normalizeOfficeText(session?.office);
  if (officeMatches) {
    return true;
  }

  const staffRole = normalizeRoleText(session?.staffRole || session?.title);
  const sessionMunicipality = normalizeOfficeText(session?.municipality);
  const programMunicipality = normalizeOfficeText(program?.municipality);
  const sessionBarangay = normalizeOfficeText(session?.barangay);
  const programBarangay = normalizeOfficeText(program?.barangay);

  if (['municipal_mayor', 'municipal_secretary'].includes(staffRole)) {
    return Boolean(sessionMunicipality) && sessionMunicipality === programMunicipality;
  }

  if (['barangay_captain', 'barangay_secretary'].includes(staffRole)) {
    return Boolean(sessionMunicipality) && sessionMunicipality === programMunicipality &&
      (!sessionBarangay || sessionBarangay === programBarangay);
  }

  return false;
}

function resolveRequirementTemplateView(templates = []) {
  const allTemplates = Array.isArray(templates) ? templates : [];
  const activeTemplates = allTemplates.filter((template) => template?.isActive !== false);

  if (activeTemplates.length) {
    return {
      templates: activeTemplates,
      usingInactiveFallback: false,
    };
  }

  return {
    templates: allTemplates,
    usingInactiveFallback: allTemplates.length > 0,
  };
}

function createForm(data, session, program = null, requirementTemplatesOverride = null) {
  const activeCategories = (data.categories || []).filter((item) => item.isActive !== false);
  const activeSectors = (data.sectors || []).filter((item) => item.isActive !== false);
  const resolvedRequirementTemplates = Array.isArray(requirementTemplatesOverride)
    ? requirementTemplatesOverride
    : (data.requirementTemplates || []);
  const categoryNames = getTaxonomyNames(activeCategories, data.programs.map((item) => item.category));
  const sectorNames = getTaxonomyNames(activeSectors, data.programs.map((item) => item.sector));
  const defaultCategory = categoryNames[0] || '';
  const defaultSector = sectorNames[0] || '';

  if (!program) {
    return {
      title: '', category: defaultCategory, sector: defaultSector, status: 'Open',
      programType: 'Municipal Assistance Program', applicationStartDate: '', applicationEndDate: '',
      deadline: '', slots: '30', maxBeneficiaries: '30', summary: '', objective: '', benefits: '',
      coverageNotes: session.municipality || '', submissionInstructions: '', additionalNotes: '',
      requirements: '', requirementsCustom: '', requirementTemplateIds: '',
      requirementTemplateOverrides: {},
      minAge: '', maxAge: '', minPersonalIncome: '', maxPersonalIncome: '',
      minHouseholdIncome: '', maxHouseholdIncome: '',
      requiresSeniorCitizen: false, requiresPwd: false, requiresSoloParent: false,
      requiresFarmer: false, requiresFisherfolk: false, requiresOutOfSchoolYouth: false,
      requiresIndigenousPeoples: false, requiresOfwFamily: false, requiresUnemployed: false,
      eligibilityNotes: '', internalDocumentFiles: [], internalDocumentNames: '',
      internalDocumentRemarks: '', imageReference: '', imageName: '', imageFile: null,
    };
  }

  const imageReference = program.coverImageUrl || program.cover_image_url || program.imageReference || '';
  const coverImagePath = program.coverImagePath || program.cover_image_path ||
    (!isPreviewableImageReference(imageReference) ? imageReference : '');
  const { templates: activeTemplates } = resolveRequirementTemplateView(resolvedRequirementTemplates);
  const programRequirementRecords = Array.isArray(program.requirementRecords) ? program.requirementRecords : [];
  const programRequirements = programRequirementRecords.length
    ? programRequirementRecords.map((item) => item.name).filter(Boolean)
    : Array.isArray(program.requirements) ? program.requirements : [];
  const linkedTemplateIds = Array.from(
    new Set(
      programRequirementRecords
        .map((item) => String(item?.requirementTemplateId || item?.requirement_template_id || '').trim())
        .filter(Boolean)
    )
  );
  const selectedTemplateIds = activeTemplates
    .filter((t) => (
      linkedTemplateIds.includes(t.id) ||
      programRequirements.some((r) => String(r || '').trim().toLowerCase() === String(t.name || '').trim().toLowerCase())
    ))
    .map((t) => t.id);
  const selectedRequirementTemplates = activeTemplates.filter((template) => selectedTemplateIds.includes(template.id));
  const customRequirements = programRequirements.filter(
    (r) => !activeTemplates.some((t) => String(t.name || '').trim().toLowerCase() === String(r || '').trim().toLowerCase())
  );
  const requirementTemplateOverrides = selectedRequirementTemplates.reduce((summary, template) => {
    const matchingProgramRequirement = programRequirementRecords.find(
      (record) => (
        String(record?.requirementTemplateId || record?.requirement_template_id || '').trim() === String(template?.id || '').trim()
        || String(record?.name || '').trim().toLowerCase() === String(template?.name || '').trim().toLowerCase()
      )
    );
    summary[template.id] = createRequirementTemplateOverride({
      ...template,
      ...matchingProgramRequirement,
      acceptedDocumentTypes: uniqueDocumentTypes(
        template?.acceptedDocumentTypes ||
        template?.accepted_document_types ||
        matchingProgramRequirement?.acceptedDocumentTypes ||
        matchingProgramRequirement?.accepted_document_types ||
        []
      ),
    });
    return summary;
  }, {});

  return {
    title: program.title || '', category: program.category || defaultCategory,
    sector: program.sector || defaultSector, status: program.status || 'Open',
    programType: program.programType || 'Municipal Assistance Program',
    applicationStartDate: program.applicationStartDate || '', applicationEndDate: program.applicationEndDate || '',
    deadline: program.deadline || '', slots: String(program.slots || ''),
    maxBeneficiaries: String(program.maxBeneficiaries || ''),
    summary: program.summary || program.description || '', objective: program.objective || '',
    benefits: program.benefits || '', coverageNotes: program.coverageNotes || session.municipality || '',
    submissionInstructions: program.submissionInstructions || '', additionalNotes: program.additionalNotes || '',
    requirements: programRequirements.join('\n'), requirementsCustom: customRequirements.join('\n'),
    requirementTemplateIds: selectedTemplateIds.join(','),
    requirementTemplateOverrides,
    minAge: String(program.eligibilityRules?.minAge || ''), maxAge: String(program.eligibilityRules?.maxAge || ''),
    minPersonalIncome: String(program.eligibilityRules?.minPersonalIncome || ''),
    maxPersonalIncome: String(program.eligibilityRules?.maxPersonalIncome || ''),
    minHouseholdIncome: String(program.eligibilityRules?.minHouseholdIncome || ''),
    maxHouseholdIncome: String(program.eligibilityRules?.maxHouseholdIncome || ''),
    requiresSeniorCitizen: Boolean(program.eligibilityRules?.requiresSeniorCitizen),
    requiresPwd: Boolean(program.eligibilityRules?.requiresPwd),
    requiresSoloParent: Boolean(program.eligibilityRules?.requiresSoloParent),
    requiresFarmer: Boolean(program.eligibilityRules?.requiresFarmer),
    requiresFisherfolk: Boolean(program.eligibilityRules?.requiresFisherfolk),
    requiresOutOfSchoolYouth: Boolean(program.eligibilityRules?.requiresOutOfSchoolYouth),
    requiresIndigenousPeoples: Boolean(program.eligibilityRules?.requiresIndigenousPeoples),
    requiresOfwFamily: Boolean(program.eligibilityRules?.requiresOfwFamily),
    requiresUnemployed: Boolean(program.eligibilityRules?.requiresUnemployed),
    eligibilityNotes: program.eligibilityRules?.customRuleNotes || (program.eligibility || []).join('\n'),
    internalDocumentFiles: [], internalDocumentNames: (program.attachments || []).join(', '),
    internalDocumentRemarks: '',
    imageReference: isPreviewableImageReference(imageReference) ? imageReference : '',
    coverImagePath, imageName: getImageFileLabel({ ...program, coverImagePath }), imageFile: null,
  };
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function StatCard({ label, value, detail, icon, mod }) {
  return (
    <div className="pl-stat">
      <div className={`pl-stat-icon${mod ? ` pl-stat-icon--${mod}` : ''}`}>
        <Icon name={icon} size={15} />
      </div>
      <div>
        <span className="pl-stat-label">{label}</span>
        <strong className={`pl-stat-val${mod ? ` pl-stat-val--${mod}` : ''}`}>{value}</strong>
        <span className="pl-stat-detail">{detail}</span>
      </div>
    </div>
  );
}

function getProgramListingsRouteState() {
  const parts = (window.location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  if (parts[0] !== 'personnel' || parts[1] !== 'program-listings') return { mode: 'index', programId: null };
  if (parts[2] === 'new') return { mode: 'create', programId: null };
  if (parts[2] === 'edit' && parts[3]) return { mode: 'edit', programId: decodeURIComponent(parts[3]) };
  return { mode: 'index', programId: null };
}

/* ─── Artwork ────────────────────────────────────────────────────────────── */
function ProgramArtwork({ program, height = 146, rounded = 12, compact = false }) {
  const photoSource = getProgramPhotoSource(program);
  const illustrationSource = getProgramIllustrationSource(program);
  const [useIllustration, setUseIllustration] = useState(!photoSource);
  const theme = getProgramVisualTheme(program);

  useEffect(() => {
    setUseIllustration(!photoSource);
  }, [photoSource, program?.id, program?.title, program?.category, program?.programType, program?.sector]);

  const visualSource = useIllustration ? illustrationSource : photoSource;

  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', borderRadius: rounded, background: theme.surface, border: `1px solid ${theme.border}` }}>
      <img
        alt={program?.title || 'Program artwork'}
        loading="lazy"
        onError={() => setUseIllustration(true)}
        src={visualSource}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: useIllustration ? 'linear-gradient(180deg,rgba(8,16,11,.08) 0%,rgba(8,16,11,.24) 100%)' : 'linear-gradient(180deg,rgba(8,16,11,.06) 0%,rgba(8,16,11,.56) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, padding: compact ? '8px 10px' : '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: rounded, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', padding: compact ? '3px 7px' : '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: compact ? 9 : 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', backdropFilter: 'blur(10px)' }}>
            {getProgramSurfaceLabel(program)}
          </span>
          <span style={{ display: 'inline-flex', padding: compact ? '3px 7px' : '4px 9px', borderRadius: 999, background: 'rgba(8,16,11,.22)', color: '#fff', fontSize: compact ? 9 : 10, fontWeight: 700, backdropFilter: 'blur(10px)' }}>
            {program?.municipality || 'Province-wide'}
          </span>
        </div>
        <strong style={{ color: '#fff', fontSize: compact ? 11 : 14, lineHeight: 1.2 }}>{program?.office || 'Program office'}</strong>
      </div>
    </div>
  );
}

function ProgramCoverPreview({ program }) {
  const [failed, setFailed] = useState(false);
  const photoSource = getProgramPhotoSource(program);
  useEffect(() => { setFailed(false); }, [photoSource]);
  if (!photoSource || failed) return <ProgramArtwork program={program} height={168} rounded={0} />;
  return (
    <div className="pl-cover-preview">
      <img alt={program?.title || 'Program cover preview'} onError={() => setFailed(true)} src={photoSource} />
    </div>
  );
}

/* ─── Program Form ───────────────────────────────────────────────────────── */
function ProgramForm({
  form,
  categories,
  sectors,
  linkedApplications,
  office,
  municipality,
  permissions,
  requirementTemplates = [],
  usingInactiveRequirementTemplateFallback = false,
  onFieldChange,
  onImageUpload,
  onInternalDocumentUpload,
  readOnly = false,
}) {
  const previewProgram = { ...form, office: office || 'Program office', municipality: municipality || 'Province-wide', coverImageUrl: form.imageReference, coverImagePath: form.coverImagePath };
  const hasUploadedImage = Boolean(form.imageReference || form.coverImagePath || form.imageFile);
  const contentDisabled = readOnly || !permissions.canEditContent;
  const statusDisabled = readOnly || !(permissions.canEditContent || permissions.canEditRelease);
  const selectedSectors = String(form.sector || '').split(',').map((s) => s.trim()).filter(Boolean);
  const toggleSector = (v) => {
    const next = selectedSectors.includes(v) ? selectedSectors.filter((s) => s !== v) : [...selectedSectors, v];
    onFieldChange('sector', next.join(', '));
  };
  const selectedRequirementTemplateIds = String(form.requirementTemplateIds || '').split(',').map((s) => s.trim()).filter(Boolean);
  const selectedRequirementTemplates = requirementTemplates.filter((template) => selectedRequirementTemplateIds.includes(template.id));
  const parseRequirementLines = (v) => String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const syncRequirements = (nextIds, customValue = form.requirementsCustom) => {
    const selected = requirementTemplates.filter((t) => nextIds.includes(t.id));
    const templateNames = selected.map((t) => String(t.name || '').trim()).filter(Boolean);
    const custom = parseRequirementLines(customValue).filter((r) => !templateNames.some((n) => n.toLowerCase() === r.toLowerCase()));
    const currentOverrides = form.requirementTemplateOverrides || {};
    const nextOverrides = nextIds.reduce((summary, templateId) => {
      const template = requirementTemplates.find((item) => item.id === templateId);
      summary[templateId] = currentOverrides[templateId] || createRequirementTemplateOverride(template);
      return summary;
    }, {});
    onFieldChange('requirementTemplateIds', nextIds.join(','));
    onFieldChange('requirementsCustom', custom.join('\n'));
    onFieldChange('requirements', [...templateNames, ...custom].join('\n'));
    onFieldChange('requirementTemplateOverrides', nextOverrides);
  };
  const toggleRequirementTemplate = (template) => {
    const next = selectedRequirementTemplateIds.includes(template.id)
      ? selectedRequirementTemplateIds.filter((id) => id !== template.id)
      : [...selectedRequirementTemplateIds, template.id];
    syncRequirements(next, form.requirementsCustom);
  };
  const updateTemplateOverride = (templateId, patch) => {
    const currentOverrides = form.requirementTemplateOverrides || {};
    const template = requirementTemplates.find((item) => item.id === templateId);
    const base = currentOverrides[templateId] || createRequirementTemplateOverride(template);
    const merged = { ...base, ...patch };
    onFieldChange('requirementTemplateOverrides', {
      ...currentOverrides,
      [templateId]: merged,
    });
  };

  return (
    <div className="pl-form-shell">
      <div className="pl-form-section">
        <span className="pl-form-section-label">Basic Information</span>
        <div className="pl-form-grid pl-form-grid--triple">
          <FormField label="Program title" value={form.title} onChange={(v) => onFieldChange('title', v)} placeholder="Program title" disabled={contentDisabled} />
          <SelectField label="Program type" value={form.programType} onChange={(v) => onFieldChange('programType', v)} options={PROGRAM_TYPE_OPTIONS} disabled={contentDisabled} />
          <SelectField label="Category" value={form.category} onChange={(v) => onFieldChange('category', v)} options={categories} disabled={contentDisabled} />
          <SelectField label="Listing status" value={form.status} onChange={(v) => onFieldChange('status', v)} options={FORM_STATUS_OPTIONS} disabled={statusDisabled} />
          <FormField label="Slot count" type="number" value={form.slots} onChange={(v) => onFieldChange('slots', v)} placeholder="30" disabled={contentDisabled} />
          <FormField label="Application start date" type="date" value={form.applicationStartDate} onChange={(v) => onFieldChange('applicationStartDate', v)} disabled={contentDisabled} />
          <FormField label="Application end date" type="date" value={form.applicationEndDate} onChange={(v) => onFieldChange('applicationEndDate', v)} disabled={contentDisabled} />
        </div>
      </div>

      <div className="pl-form-section">
        <span className="pl-form-section-label">Sectors</span>
        <div className="pl-sector-grid">
          {sectors.map((sector) => (
            <label className={`pl-sector-option${selectedSectors.includes(sector.value) ? ' is-checked' : ''}`} key={sector.value}>
              <input checked={selectedSectors.includes(sector.value)} disabled={contentDisabled} onChange={() => toggleSector(sector.value)} type="checkbox" />
              <span>{sector.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pl-upload-grid">
        <div className="pl-preview-card">
          <ProgramCoverPreview program={previewProgram} />
          <div className="pl-preview-caption">
            <strong>{hasUploadedImage ? 'Applicant-facing cover preview' : 'Generated fallback preview'}</strong>
            <p>The listing will use your uploaded image when available. Otherwise it falls back to the same category-based visual style shown in Search Programs.</p>
          </div>
        </div>
        <label className="pl-upload-field">
          <span>Program image</span>
          <input accept="image/*" onChange={onImageUpload} type="file" disabled={contentDisabled} />
          <small>Upload an image file to use as the applicant-facing banner.</small>
          <strong>{form.imageName || 'No file selected'}</strong>
        </label>
      </div>

      <div className="pl-form-section">
        <span className="pl-form-section-label">Content</span>
        <div className="pl-form-grid">
          <FormField label="Summary" type="textarea" value={form.summary} onChange={(v) => onFieldChange('summary', v)} disabled={contentDisabled} />
          <FormField label="Objective" type="textarea" value={form.objective} onChange={(v) => onFieldChange('objective', v)} disabled={contentDisabled} />
          <FormField label="Benefits" type="textarea" value={form.benefits} onChange={(v) => onFieldChange('benefits', v)} disabled={contentDisabled} />
          <FormField label="Coverage notes" type="textarea" value={form.coverageNotes} onChange={(v) => onFieldChange('coverageNotes', v)} disabled={contentDisabled} />
          <FormField label="Submission instructions" type="textarea" value={form.submissionInstructions} onChange={(v) => onFieldChange('submissionInstructions', v)} disabled={contentDisabled} />
          <FormField label="Additional notes" type="textarea" value={form.additionalNotes} onChange={(v) => onFieldChange('additionalNotes', v)} disabled={contentDisabled} />
        </div>
      </div>

      <div className="pl-form-section">
        <span className="pl-form-section-label">Applicant Document Requirements</span>
        {usingInactiveRequirementTemplateFallback ? (
          <p className="pl-req-empty">All requirement templates are currently inactive. Showing inactive templates so you can continue.</p>
        ) : null}
        {requirementTemplates.length ? (
          <div className="pl-sector-grid">
            {requirementTemplates.map((template) => (
              <label className={`pl-sector-option${selectedRequirementTemplateIds.includes(template.id) ? ' is-checked' : ''}`} key={template.id}>
                <input checked={selectedRequirementTemplateIds.includes(template.id)} disabled={contentDisabled} onChange={() => toggleRequirementTemplate(template)} type="checkbox" />
                <span>{template.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="pl-req-empty">No active requirement templates found. Add templates in Program Setup.</p>
        )}
        {selectedRequirementTemplates.length ? (
          <div className="pl-template-override-list">
            {selectedRequirementTemplates.map((template) => {
              const override = form.requirementTemplateOverrides?.[template.id] || createRequirementTemplateOverride(template);
              return (
                <article key={`${template.id}-override`} className="pl-template-override-card">
                  <strong>{template.name}</strong>
                  <small>
                    Accepted documents inherited from template: {formatDocumentTypeList(override.acceptedDocumentTypes, 'Not specified')} · {override.allowMultipleFiles ? 'Multiple files allowed' : 'One document only'}
                  </small>
                  <div className="pl-template-override-row">
                    <label className="pl-template-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(override.isRequired)}
                        disabled={contentDisabled}
                        onChange={(event) => updateTemplateOverride(template.id, { isRequired: event.target.checked })}
                      />
                      Required
                    </label>
                    <label className="pl-template-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(override.allowMultipleFiles)}
                        disabled={contentDisabled}
                        onChange={(event) => updateTemplateOverride(template.id, { allowMultipleFiles: event.target.checked })}
                      />
                      Allow multiple files
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        <FormField
          label="Other attachment requirements (optional)"
          type="textarea"
          value={form.requirementsCustom || ''}
          onChange={(v) => syncRequirements(selectedRequirementTemplateIds, v)}
          placeholder={`Supporting Affidavit\nCertificate of Employment`}
          disabled={contentDisabled}
        />
      </div>

      <div className="pl-form-section">
        <span className="pl-form-section-label">Eligibility rules</span>
        <div className="pl-form-grid">
          <FormField label="Minimum age" type="number" value={form.minAge} onChange={(v) => onFieldChange('minAge', v)} disabled={contentDisabled} />
          <FormField label="Maximum age" type="number" value={form.maxAge} onChange={(v) => onFieldChange('maxAge', v)} disabled={contentDisabled} />
          <FormField label="Minimum personal income" type="number" value={form.minPersonalIncome} onChange={(v) => onFieldChange('minPersonalIncome', v)} disabled={contentDisabled} />
          <FormField label="Maximum personal income" type="number" value={form.maxPersonalIncome} onChange={(v) => onFieldChange('maxPersonalIncome', v)} disabled={contentDisabled} />
          <FormField label="Minimum household income" type="number" value={form.minHouseholdIncome} onChange={(v) => onFieldChange('minHouseholdIncome', v)} disabled={contentDisabled} />
          <FormField label="Maximum household income" type="number" value={form.maxHouseholdIncome} onChange={(v) => onFieldChange('maxHouseholdIncome', v)} disabled={contentDisabled} />
        </div>
        <div className="pl-sector-grid">
          {[
            ['requiresSeniorCitizen', 'Senior citizen'], ['requiresPwd', 'PWD'],
            ['requiresSoloParent', 'Solo parent'], ['requiresFarmer', 'Farmer'],
            ['requiresFisherfolk', 'Fisherfolk'], ['requiresOutOfSchoolYouth', 'Out-of-school youth'],
            ['requiresIndigenousPeoples', 'Indigenous peoples'], ['requiresOfwFamily', 'OFW family'],
            ['requiresUnemployed', 'Unemployed'],
          ].map(([field, label]) => (
            <label className={`pl-sector-option${form[field] ? ' is-checked' : ''}`} key={field}>
              <input checked={Boolean(form[field])} disabled={contentDisabled} onChange={(e) => onFieldChange(field, e.target.checked)} type="checkbox" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <FormField label="Eligibility notes" type="textarea" value={form.eligibilityNotes} onChange={(v) => onFieldChange('eligibilityNotes', v)} placeholder="Optional special case conditions or reminders" disabled={contentDisabled} />
      </div>

      <div className="pl-form-section">
        <span className="pl-form-section-label">Internal reference attachments</span>
        <label className="pl-upload-field">
          <span>Internal reference attachments</span>
          <input multiple onChange={onInternalDocumentUpload} type="file" disabled={contentDisabled} />
          <small>Upload program briefs, evaluation sheets, poster artwork, or other internal files.</small>
          <strong>{form.internalDocumentNames || 'No files selected'}</strong>
        </label>
        <FormField label="Internal attachment remarks" value={form.internalDocumentRemarks} onChange={(v) => onFieldChange('internalDocumentRemarks', v)} placeholder="Optional notes for uploaded internal files" disabled={contentDisabled} />
      </div>

      <div className="pl-form-note">
        <strong>Listing note</strong>
        <p>This editor keeps schedule, eligibility, attachments, and image upload in one place so the listings table stays focused.</p>
        {readOnly ? <p>This applicant-facing listing belongs to another office, so it stays read-only in your workspace.</p> : null}
        {!readOnly && !permissions.canEditContent ? <p>Program drafting and applicant-facing content are locked for your current staff role.</p> : null}
        {!readOnly && permissions.canEditRelease && !permissions.canEditContent ? <p>Listing status is editable for your current staff role.</p> : null}
        {linkedApplications ? <p>Linked application records: {linkedApplications}. Delete is disabled while application records exist.</p> : null}
      </div>
    </div>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */
export default function ProgramListingsScreen({ session, data, actions, navigate }) {
  const programs = [...(data?.programs || [])].sort((l, r) => {
    const ls = getDisplayStatus(l), rs = getDisplayStatus(r);
    if (ls === 'Archived' && rs !== 'Archived') return 1;
    if (rs === 'Archived' && ls !== 'Archived') return -1;
    return l.title.localeCompare(r.title);
  });
  const ownedPrograms = programs.filter((p) => isProgramOwnedBySessionOffice(p, session));
  const applicationCounts = programs.reduce((sum, p) => {
    sum[p.id] = data.applications.filter((a) => a.programId === p.id).length;
    return sum;
  }, {});
  const getApplicantCount = (p) => Math.max(p.applicants || 0, applicationCounts[p.id] || 0);
  const activeCategories = (data.categories || []).filter((c) => c.isActive !== false);
  const activeSectors = (data.sectors || []).filter((s) => s.isActive !== false);
  const categoryOptions = getTaxonomyOptions(activeCategories, programs.map((p) => p.category));
  const sectorOptions = getTaxonomyOptions(activeSectors, programs.flatMap((p) => p.sectors || p.sector || []));
  const [liveRequirementTemplates, setLiveRequirementTemplates] = useState([]);
  const [hasLoadedLiveRequirementTemplates, setHasLoadedLiveRequirementTemplates] = useState(false);
  const requirementTemplateSource = useMemo(
    () => (hasLoadedLiveRequirementTemplates ? liveRequirementTemplates : (data.requirementTemplates || [])),
    [hasLoadedLiveRequirementTemplates, liveRequirementTemplates, data.requirementTemplates]
  );
  const requirementTemplateView = useMemo(
    () => resolveRequirementTemplateView(requirementTemplateSource),
    [requirementTemplateSource]
  );
  const requirementTemplates = requirementTemplateView.templates;
  const usingInactiveRequirementTemplateFallback = requirementTemplateView.usingInactiveFallback;
  const categoryFilterOptions = [{ label: 'All categories', value: 'all' }, ...categoryOptions];
  const canEditContent = canComposeProgramContent(session);
  const canEditRelease = canSetProgramRelease(session);
  const canViewApplicantQueue = canReviewApplicants(session);
  const staffRoleLabel = getAccountRoleLabel(session);
  const roleAccessNote = canEditContent
    ? `${staffRoleLabel} access can draft and post program content.`
    : canEditRelease
      ? `${staffRoleLabel} access can update listing status only.`
      : `${staffRoleLabel} access is read-only in this workspace.`;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProgramId, setSelectedProgramId] = useState(programs[0]?.id || '');
  const [form, setForm] = useState(() => createForm(data, session, null, requirementTemplates));
  const lastFormSeedRef = useRef('');
  const routeState = getProgramListingsRouteState();

  useEffect(() => {
    let isMounted = true;
    const shouldLoadTemplates = routeState.mode === 'create' || routeState.mode === 'edit';

    if (!shouldLoadTemplates) {
      return undefined;
    }

    listProgramRecords()
      .then((records) => {
        if (!isMounted) {
          return;
        }
        setLiveRequirementTemplates(records?.requirementTemplates || []);
        setHasLoadedLiveRequirementTemplates(true);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setHasLoadedLiveRequirementTemplates(true);
      });

    return () => {
      isMounted = false;
    };
  }, [routeState.mode, routeState.programId]);

  useEffect(() => {
    if (!programs.length) return;
    if (!programs.some((p) => p.id === selectedProgramId)) setSelectedProgramId(programs[0].id);
  }, [programs, selectedProgramId]);

  const query = search.trim().toLowerCase();
  const filteredPrograms = programs.filter((p) => {
    const ds = getDisplayStatus(p);
    if (statusFilter !== 'all' && ds !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (!query) return true;
    return [p.title, p.category, p.sector, p.programType, ds, p.summary].some((v) =>
      String(v || '').toLowerCase().includes(query)
    );
  });

  const selectedProgram = routeState.mode === 'edit'
    ? programs.find((p) => p.id === routeState.programId) || null
    : programs.find((p) => p.id === selectedProgramId) || null;
  const selectedProgramApplications = selectedProgram ? applicationCounts[selectedProgram.id] || 0 : 0;
  const isSelectedProgramOwned = selectedProgram ? isProgramOwnedBySessionOffice(selectedProgram, session) : false;
  const canModifySelectedProgram = isSelectedProgramOwned && (canEditContent || canEditRelease);

  useEffect(() => {
    const templateKey = requirementTemplates.map((template) => template.id).join('|');
    const selectedProgramKey = selectedProgram
      ? `${selectedProgram.id}:${selectedProgram.updatedAt || selectedProgram.updated_at || ''}`
      : 'none';
    const modeKey = `${routeState.mode}:${routeState.programId || ''}`;
    const seedKey = `${modeKey}:${selectedProgramKey}:${templateKey}:${hasLoadedLiveRequirementTemplates ? 'live' : 'seed'}`;

    if (lastFormSeedRef.current === seedKey) {
      return;
    }

    if (routeState.mode === 'create') {
      setForm(createForm(data, session, null, requirementTemplates));
      lastFormSeedRef.current = seedKey;
      return;
    }

    if (routeState.mode === 'edit' && selectedProgram) {
      setForm(createForm(data, session, selectedProgram, requirementTemplates));
      lastFormSeedRef.current = seedKey;
    }
  }, [
    routeState.mode,
    routeState.programId,
    selectedProgram,
    selectedProgram?.id,
    selectedProgram?.updatedAt,
    selectedProgram?.updated_at,
    data,
    session,
    requirementTemplates,
    hasLoadedLiveRequirementTemplates,
  ]);

  const totalApplicants = programs.reduce((sum, p) => sum + getApplicantCount(p), 0);
  const activePrograms = programs.filter((p) => !p.archived && ['Open', 'Upcoming'].includes(p.status)).length;
  const programsWithImages = programs.filter((p) => p.imageReference || p.coverImageUrl || p.coverImagePath).length;

  const onFieldChange = (field, value) => setForm((curr) => ({ ...curr, [field]: value }));
  const onImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Image upload failed.'));
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) return;
    setForm((curr) => ({ ...curr, imageReference: dataUrl, coverImagePath: '', imageName: file.name, imageFile: file }));
  };
  const onInternalDocumentUpload = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setForm((curr) => ({ ...curr, internalDocumentFiles: files, internalDocumentNames: files.map((f) => f.name).join(', ') }));
  };

  const openProgramListingsIndex = () => navigate('/personnel/program-listings');
  const openCreatePage = () => {
    if (!canEditContent) return;
    setForm(createForm(data, session, null, requirementTemplates));
    navigate('/personnel/program-listings/new');
  };
  const openDetailsPage = (program) => {
    setSelectedProgramId(program.id);
    setForm(createForm(data, session, program, requirementTemplates));
    navigate(`/personnel/program-listings/edit/${program.id}`);
  };

  const handleCreate = () => {
    actions.requestConfirmation({
      title: 'Publish program?', message: 'Review the listing details before publishing this applicant-facing program.',
      confirmLabel: 'Publish Program',
      onConfirm: async () => {
        const selectedTemplateIds = String(form.requirementTemplateIds || '').split(',').filter(Boolean);
        const selectedTemplates = requirementTemplates
          .filter((t) => selectedTemplateIds.includes(t.id))
          .map((template) => {
            const override = form.requirementTemplateOverrides?.[template.id] || {};
            return {
              ...template,
              ...override,
              acceptedDocumentTypes: uniqueDocumentTypes(
                template.acceptedDocumentTypes || template.accepted_document_types || []
              ),
              expectedDocumentType: uniqueDocumentTypes(
                template.acceptedDocumentTypes || template.accepted_document_types || []
              )[0] || '',
            };
          });
        const result = await actions.createProgram({
          ...form,
          requirementTemplates: selectedTemplates,
          requirementTemplateOverrides: form.requirementTemplateOverrides || {},
        });
        if (result?.ok) {
          await actions.refreshProgramRecords?.();
          openProgramListingsIndex();
        }
      },
    });
  };
  const handleUpdate = () => {
    if (!selectedProgram) return;
    actions.requestConfirmation({
      title: 'Save program changes?', message: 'Make sure the updated program details are correct before saving them.',
      confirmLabel: 'Save Changes',
      onConfirm: async () => {
        const selectedTemplateIds = String(form.requirementTemplateIds || '').split(',').filter(Boolean);
        const selectedTemplates = requirementTemplates
          .filter((t) => selectedTemplateIds.includes(t.id))
          .map((template) => {
            const override = form.requirementTemplateOverrides?.[template.id] || {};
            return {
              ...template,
              ...override,
              acceptedDocumentTypes: uniqueDocumentTypes(
                template.acceptedDocumentTypes || template.accepted_document_types || []
              ),
              expectedDocumentType: uniqueDocumentTypes(
                template.acceptedDocumentTypes || template.accepted_document_types || []
              )[0] || '',
            };
          });
        const result = await actions.updateProgram(selectedProgram.id, {
          ...form,
          requirementTemplates: selectedTemplates,
          requirementTemplateOverrides: form.requirementTemplateOverrides || {},
        });
        if (result?.ok) {
          await actions.refreshProgramRecords?.();
          openProgramListingsIndex();
        }
      },
    });
  };
  const handleArchive = () => {
    if (!selectedProgram) return;
    actions.requestConfirmation({
      title: 'Archive program?', message: 'Archived programs are removed from the regular applicant view.',
      confirmLabel: 'Archive Program', tone: 'danger',
      onConfirm: () => { const result = actions.archiveProgram(selectedProgram.id); if (result?.ok) openProgramListingsIndex(); },
    });
  };
  const handleDelete = () => {
    if (!selectedProgram) return;
    actions.requestConfirmation({
      title: 'Delete program?', message: 'Delete this program only if you are certain it should be removed from the workspace.',
      confirmLabel: 'Delete Program', tone: 'danger',
      onConfirm: () => { const result = actions.deleteProgram(selectedProgram.id); if (result?.ok) openProgramListingsIndex(); },
    });
  };

  return (
    <>
      <style>{PL_STYLES}</style>
      <div className="pl-shell">

        {/* ── Stats ── */}
        <section className="pl-stats">
          <StatCard icon="list"         label="Available Listings"     value={programs.length}      detail="Applicant-facing directory"        />
          <StatCard icon="office"       label="Managed by Your Office" value={ownedPrograms.length} detail={session.office}      mod="blue"  />
          <StatCard icon="check-circle" label="Open or Upcoming"       value={activePrograms}        detail="Active listings"     mod="green" />
          <StatCard icon="users"        label="Applicant Activity"     value={totalApplicants}       detail={`${programsWithImages} listings with visuals`} mod="amber" />
        </section>

        {/* ── Toolbar ── */}
        <div className="pl-toolbar">
          <div className="pl-search-shell">
            <span className="pl-search-icon"><Icon name="search" size={15} /></span>
            <input
              className="pl-search-input"
              placeholder="Search title, category, sector, type, or status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
            />
          </div>
          <div className="pl-filter-row">
            <div className="pl-select-group">
              <label className="pl-select-label" htmlFor="pl-status-filter">Status</label>
              <select id="pl-status-filter" className="pl-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="pl-select-group">
              <label className="pl-select-label" htmlFor="pl-category-filter">Category</label>
              <select id="pl-category-filter" className="pl-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categoryFilterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Main panel ── */}
        <div className="pl-panel">
          <div className="pl-panel-top">
            <div>
              <span className="pl-eyebrow">Published Records</span>
              <h2 className="pl-panel-title">
                {routeState.mode === 'create' ? 'Add Program Listing'
                  : routeState.mode === 'edit' ? (selectedProgram?.title || 'Edit Program')
                  : 'Program Listings'}
              </h2>
              {routeState.mode === 'index' ? (
                <p className="pl-panel-subtitle">
                  Search the current applicant-facing listings, then open any row to edit. Listings from other offices stay read-only.
                </p>
              ) : null}
            </div>
            <div className="pl-panel-top-actions">
              {routeState.mode === 'index' ? (
                <button className="pl-add-btn" disabled={!canEditContent} onClick={openCreatePage} type="button">
                  + Add Program
                </button>
              ) : null}
              {routeState.mode === 'create' ? (
                <>
                  <button className="pl-back-btn" onClick={openProgramListingsIndex} type="button">Cancel</button>
                  <button className="pl-primary-btn" disabled={!canEditContent} onClick={handleCreate} type="button">Publish Program</button>
                </>
              ) : null}
              {routeState.mode === 'edit' && selectedProgram ? (
                <>
                  {isSelectedProgramOwned && canEditContent ? (
                    !selectedProgram.archived
                      ? <button className="pl-back-btn" onClick={handleArchive} type="button">Archive</button>
                      : <StatusPill status="Archived" />
                  ) : (
                    <StatusPill status={canModifySelectedProgram ? 'Limited Edit' : 'Read Only'} />
                  )}
                  {isSelectedProgramOwned && canEditContent ? (
                    <button className="pl-delete-btn" disabled={selectedProgramApplications > 0} onClick={handleDelete} type="button">Delete</button>
                  ) : null}
                  <button className="pl-back-btn" onClick={openProgramListingsIndex} type="button">← Back</button>
                  {canModifySelectedProgram ? <button className="pl-primary-btn" onClick={handleUpdate} type="button">Save Changes</button> : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="pl-panel-body">

            {/* Info banner (index only) */}
            {routeState.mode === 'index' ? (
              <div className="pl-info-banner">
                <strong>{programs.length} applicant-facing listings available</strong>
                <p>These records use the same availability source shown on the applicant side. Listings outside your office remain visible for alignment but open read-only.</p>
                <p>{roleAccessNote}{!canViewApplicantQueue ? ' Applicant review stays locked for your role.' : ''}</p>
              </div>
            ) : null}

            {/* Table */}
            {routeState.mode === 'index' && filteredPrograms.length ? (
              <div className="pl-table">
                <div className="pl-table-head">
                  <span>Program</span>
                  <span>Category</span>
                  <span>Application Window</span>
                  <span>Applicants</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <div className="pl-table-body">
                  {filteredPrograms.map((program) => (
                    <article className="pl-table-row" key={program.id}>
                      <div className="pl-program-col">
                        <div className="pl-program-copy">
                          <strong className="pl-program-title">{program.title}</strong>
                          <p className="pl-program-type">{program.programType || 'Government assistance program'}</p>
                          <small className="pl-program-meta">{program.office} · {program.sector} · {program.municipality}</small>
                        </div>
                      </div>
                      <div className="pl-cell">
                        <strong>{program.category}</strong>
                        <small>{program.sector}</small>
                      </div>
                      <div className="pl-cell">
                        <strong>{formatWindow(program)}</strong>
                        <small>Deadline {formatDate(program.deadline)}</small>
                      </div>
                      <div className="pl-cell">
                        <strong>{getApplicantCount(program)}</strong>
                        <small>{program.maxBeneficiaries || program.slots || 0} beneficiaries max</small>
                      </div>
                      <div className="pl-cell">
                        <StatusPill status={getDisplayStatus(program)} />
                      </div>
                      <div className="pl-action-cell">
                        <button className="pl-view-btn" onClick={() => openDetailsPage(program)} type="button">View</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {routeState.mode === 'index' && !filteredPrograms.length ? (
              <EmptyState title="No programs matched" text="Try a different search term or adjust the filters to view the office program listings." />
            ) : null}

            {/* Create form */}
            {routeState.mode === 'create' ? (
              <ProgramForm
                categories={categoryOptions} sectors={sectorOptions} form={form}
                linkedApplications={0} office={session.office} municipality={session.municipality}
                permissions={{ canEditContent, canEditRelease }}
                requirementTemplates={requirementTemplates}
                usingInactiveRequirementTemplateFallback={usingInactiveRequirementTemplateFallback}
                onFieldChange={onFieldChange} onImageUpload={onImageUpload} onInternalDocumentUpload={onInternalDocumentUpload}
              />
            ) : null}

            {/* Edit form */}
            {routeState.mode === 'edit' ? (
              selectedProgram ? (
                <ProgramForm
                  categories={categoryOptions} sectors={sectorOptions} form={form}
                  linkedApplications={selectedProgramApplications}
                  office={selectedProgram.office || session.office}
                  municipality={selectedProgram.municipality || session.municipality}
                  permissions={{ canEditContent, canEditRelease }}
                  requirementTemplates={requirementTemplates}
                  usingInactiveRequirementTemplateFallback={usingInactiveRequirementTemplateFallback}
                  onFieldChange={onFieldChange} onImageUpload={onImageUpload} onInternalDocumentUpload={onInternalDocumentUpload}
                  readOnly={!isSelectedProgramOwned}
                />
              ) : (
                <EmptyState title="Program not found" text="The selected program editor could not be loaded." />
              )
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const PL_STYLES = `
  /* Shell */
  .pl-shell {
    display: grid;
    gap: 14px;
    padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
    box-sizing: border-box;
    font-family: var(--pf-font-body, system-ui, sans-serif);
    color: #1a3356;
  }

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  .pl-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 1100px) { .pl-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px)  { .pl-stats { grid-template-columns: 1fr; } }

  .pl-stat {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(15,47,99,.04);
  }
  .pl-stat-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: #eef4ff; border: 1px solid #c8d8f5; color: #2a4e8c;
    display: grid; place-items: center; flex-shrink: 0;
  }
  .pl-stat-icon--blue  { background: #eef4ff; border-color: #c8d8f5; color: #2a4e8c; }
  .pl-stat-icon--green { background: #f0faf5; border-color: #9ed0b5; color: #1a7f4e; }
  .pl-stat-icon--amber { background: #fff8e6; border-color: #efd488; color: #9a6700; }

  .pl-stat-label  { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #7a8fa6; margin-bottom: 2px; }
  .pl-stat-val    { display: block; font-size: 1.75rem; font-weight: 700; line-height: 1; color: #0f2f63; letter-spacing: -.03em; margin-bottom: 3px; }
  .pl-stat-val--blue  { color: #2a4e8c; }
  .pl-stat-val--green { color: #1a7f4e; }
  .pl-stat-val--amber { color: #9a6700; }
  .pl-stat-detail { display: block; font-size: 0.76rem; color: #7a8fa6; }

  /* ── Toolbar ───────────────────────────────────────────────────────────── */
  .pl-toolbar {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    padding: 14px 16px;
    display: grid;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(15,47,99,.04);
  }
  .pl-search-shell {
    display: flex; align-items: center; gap: 10px;
    background: #f8fafd; border: 1px solid #d7dde8; border-radius: 9px;
    padding: 0 14px; height: 42px;
  }
  .pl-search-icon { color: #7a8fa6; flex-shrink: 0; }
  .pl-search-input {
    flex: 1; border: none; outline: none; background: transparent;
    font: inherit; font-size: .92rem; color: #1a3356;
  }
  .pl-search-input::placeholder { color: #a0b0c4; }
  .pl-filter-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .pl-select-group { display: grid; gap: 4px; flex: 1; min-width: 160px; }
  .pl-select-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: #7a8fa6; }
  .pl-select {
    padding: 8px 12px; border: 1px solid #d7dde8; border-radius: 8px;
    background: #f8fafd; font: inherit; font-size: .88rem; color: #1a3356; font-weight: 600;
    cursor: pointer; transition: border-color .15s; appearance: auto;
  }
  .pl-select:hover { border-color: #a8c4f0; }
  .pl-select:focus { outline: none; border-color: #2a4e8c; }

  /* ── Panel ─────────────────────────────────────────────────────────────── */
  .pl-panel {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(15,47,99,.05);
    overflow: hidden;
  }
  .pl-panel-top {
    padding: 16px 20px;
    background: #f8fafd;
    border-bottom: 1px solid #e8ecf2;
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .pl-panel-top-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
  .pl-panel-body { padding: 20px; display: grid; gap: 16px; }
  .pl-eyebrow { display: block; font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #7a8fa6; margin-bottom: 3px; }
  .pl-panel-title { margin: 0; font-size: 1rem; font-weight: 700; color: #0f2f63; line-height: 1.2; }
  .pl-panel-subtitle { margin: 4px 0 0; font-size: .84rem; color: #4a5e7a; }

  /* Buttons */
  .pl-add-btn {
    background: #0f2f63; color: #ffffff; border: none;
    border-radius: 9px; padding: 9px 18px;
    font: inherit; font-size: .86rem; font-weight: 700; cursor: pointer; white-space: nowrap;
    transition: background .15s;
  }
  .pl-add-btn:hover:not(:disabled) { background: #1a4a8a; }
  .pl-add-btn:disabled { opacity: .5; cursor: not-allowed; }
  .pl-primary-btn {
    background: #0f2f63; color: #ffffff; border: none;
    border-radius: 9px; padding: 9px 18px;
    font: inherit; font-size: .86rem; font-weight: 700; cursor: pointer;
    transition: background .15s;
  }
  .pl-primary-btn:hover:not(:disabled) { background: #1a4a8a; }
  .pl-primary-btn:disabled { opacity: .5; cursor: not-allowed; }
  .pl-back-btn {
    background: #ffffff; color: #2a4e8c;
    border: 1px solid #c8d8f5; border-radius: 9px; padding: 8px 16px;
    font: inherit; font-size: .84rem; font-weight: 700; cursor: pointer; white-space: nowrap;
    transition: background .15s, border-color .15s;
  }
  .pl-back-btn:hover { background: #eef4ff; border-color: #a8c4f0; }
  .pl-delete-btn {
    background: #fff3f2; color: #9b4f1a;
    border: 1px solid #f5c4a8; border-radius: 9px; padding: 8px 16px;
    font: inherit; font-size: .84rem; font-weight: 700; cursor: pointer;
    transition: background .15s, border-color .15s;
  }
  .pl-delete-btn:hover:not(:disabled) { background: #fee8e3; border-color: #e0a080; }
  .pl-delete-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Info banner */
  .pl-info-banner {
    background: #f8fafd;
    border: 1px solid #e8ecf2;
    border-left: 3px solid #2a4e8c;
    border-radius: 0 9px 9px 0;
    padding: 12px 16px;
    display: grid;
    gap: 4px;
  }
  .pl-info-banner strong { font-size: .88rem; font-weight: 700; color: #0f2f63; display: block; }
  .pl-info-banner p { margin: 0; font-size: .82rem; color: #4a5e7a; line-height: 1.5; }

  /* ── Table ─────────────────────────────────────────────────────────────── */
  .pl-table { border: 1px solid #d7dde8; border-radius: 10px; overflow: hidden; }
  .pl-table-head {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(140px, .65fr) minmax(200px, .9fr) minmax(110px, .5fr) minmax(130px, .6fr) 90px;
    gap: 12px;
    padding: 10px 16px;
    background: #f8fafd; border-bottom: 1px solid #e8ecf2;
    font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #7a8fa6;
    align-items: center;
  }
  .pl-table-body { display: grid; }
  .pl-table-row {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(140px, .65fr) minmax(200px, .9fr) minmax(110px, .5fr) minmax(130px, .6fr) 90px;
    gap: 12px;
    padding: 14px 16px;
    align-items: center;
    border-bottom: 1px solid #e8ecf2;
    background: #ffffff;
    transition: background .12s;
  }
  .pl-table-row:last-child { border-bottom: none; }
  .pl-table-row:hover { background: #f8fafd; }

  @media (max-width: 1100px) {
    .pl-table-head { display: none; }
    .pl-table-head,
    .pl-table-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pl-action-cell { justify-content: flex-start; }
  }
  @media (max-width: 640px) {
    .pl-table-row { grid-template-columns: 1fr; }
  }

  .pl-program-col {
    display: block;
    align-items: center;
    min-width: 0;
  }
  .pl-program-copy { display: grid; gap: 3px; min-width: 0; }
  .pl-program-title { font-size: .92rem; font-weight: 700; color: #0f2f63; line-height: 1.25; display: block; margin-bottom: 2px; }
  .pl-program-type  { font-size: .78rem; color: #4a5e7a; margin: 0; line-height: 1.4; }
  .pl-program-meta  { font-size: .74rem; color: #7a8fa6; display: block; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pl-cell { min-width: 0; display: grid; gap: 3px; align-content: center; }
  .pl-cell strong  { display: block; font-size: .86rem; font-weight: 700; color: #1a3356; line-height: 1.3; }
  .pl-cell small,
  .pl-cell p       { display: block; font-size: .76rem; color: #7a8fa6; margin: 0; line-height: 1.4; }

  .pl-action-cell { display: flex; justify-content: flex-end; align-items: center; }
  .pl-view-btn {
    background: #ffffff; color: #2a4e8c;
    border: 1px solid #c8d8f5; border-radius: 7px; padding: 6px 14px;
    font: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; white-space: nowrap;
    transition: background .15s, border-color .15s;
  }
  .pl-view-btn:hover { background: #eef4ff; border-color: #a8c4f0; }

  /* ── Form shell ────────────────────────────────────────────────────────── */
  .pl-form-shell { display: grid; gap: 14px; }

  .pl-form-section {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    overflow: hidden;
  }
  .pl-form-section-label {
    display: block;
    padding: 10px 16px;
    background: #f8fafd;
    border-bottom: 1px solid #e8ecf2;
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #7a8fa6;
  }
  .pl-form-section > .pl-form-grid,
  .pl-form-section > .pl-sector-grid,
  .pl-form-section > .pl-upload-field,
  .pl-form-section > div,
  .pl-form-section > label,
  .pl-form-section > p { padding: 14px 16px; }
  .pl-form-section > * + * { border-top: 1px solid #e8ecf2; }

  .pl-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .pl-form-grid--triple {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 1160px) { .pl-form-grid--triple { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .pl-form-grid--single { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); max-width: 50%; }
  @media (max-width: 820px) { .pl-form-grid { grid-template-columns: 1fr; } .pl-form-grid--single { max-width: 100%; } }

  .pl-sector-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  @media (max-width: 820px) { .pl-sector-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .pl-sector-grid { grid-template-columns: 1fr; } }

  .pl-sector-option {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 11px;
    border: 1px solid #d7dde8; border-radius: 8px;
    background: #ffffff; font-weight: 600; font-size: .86rem; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .pl-sector-option:hover { border-color: #a8c4f0; background: #f8fafd; }
  .pl-sector-option.is-checked { border-color: #2a4e8c; background: #eef4ff; color: #0f2f63; }
  .pl-sector-option input { width: 15px; height: 15px; flex-shrink: 0; accent-color: #2a4e8c; }

  .pl-req-empty { margin: 0; color: #7a8fa6; font-size: .86rem; line-height: 1.5; }
  .pl-template-override-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 14px 16px;
    max-height: 36rem;
    overflow-y: auto;
    overflow-x: hidden;
    align-content: start;
  }
  @media (max-width: 980px) { .pl-template-override-list { grid-template-columns: 1fr; } }
  .pl-template-override-card {
    border: 1px solid #d7dde8;
    border-radius: 10px;
    background: #f8fafd;
    padding: 10px 12px;
    display: grid;
    gap: 8px;
  }
  .pl-template-override-card strong {
    font-size: .86rem;
    color: #1a3356;
  }
  .pl-template-override-card small {
    font-size: .76rem;
    color: #5a7090;
    line-height: 1.45;
  }
  .pl-template-override-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .pl-template-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: .76rem;
    color: #2a4e8c;
    font-weight: 700;
  }
  .pl-template-toggle input {
    width: 14px;
    height: 14px;
    accent-color: #2a4e8c;
  }
  .pl-template-doc-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  @media (max-width: 960px) { .pl-template-doc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 620px) { .pl-template-doc-grid { grid-template-columns: 1fr; } }
  .pl-template-doc-option {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: .74rem;
    color: #1a3356;
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 7px;
    padding: 6px 8px;
  }
  .pl-template-doc-option input {
    width: 14px;
    height: 14px;
    accent-color: #2a4e8c;
    flex-shrink: 0;
  }

  /* Upload grid & fields */
  .pl-upload-grid {
    display: grid;
    grid-template-columns: minmax(260px, .85fr) minmax(0, 1.15fr);
    gap: 12px;
    align-items: stretch;
  }
  @media (max-width: 820px) { .pl-upload-grid { grid-template-columns: 1fr; } }

  .pl-preview-card {
    border: 1px solid #d7dde8; border-radius: 12px; overflow: hidden;
    display: grid; background: #ffffff;
  }
  .pl-cover-preview {
    height: 168px; display: grid; place-items: center;
    background: #f4f7fb; border-bottom: 1px solid #e8ecf2; overflow: hidden;
  }
  .pl-cover-preview img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .pl-preview-caption {
    display: grid; gap: 4px; padding: 12px 14px;
  }
  .pl-preview-caption strong { display: block; font-size: .86rem; font-weight: 700; color: #1a3356; }
  .pl-preview-caption p { margin: 0; font-size: .78rem; color: #7a8fa6; line-height: 1.5; }

  .pl-upload-field {
    display: grid; gap: 8px;
    padding: 14px 16px;
    border: 1px solid #d7dde8; border-radius: 12px;
    background: #ffffff; cursor: pointer;
  }
  .pl-upload-field span { font-size: .8rem; font-weight: 700; color: #4a5e7a; }
  .pl-upload-field input[type="file"] {
    width: 100%; padding: 10px 12px;
    border-radius: 8px; border: 1.5px dashed #c8d8f5;
    background: #f8fafd; font: inherit; font-size: .84rem; cursor: pointer;
  }
  .pl-upload-field input[type="file"]:disabled { opacity: .55; cursor: not-allowed; }
  .pl-upload-field small { font-size: .76rem; color: #7a8fa6; line-height: 1.45; }
  .pl-upload-field strong { display: block; font-size: .84rem; font-weight: 700; color: #1a3356; }

  /* Form note */
  .pl-form-note {
    background: #f8fafd; border: 1px solid #e8ecf2;
    border-left: 3px solid #2a4e8c;
    border-radius: 0 9px 9px 0;
    padding: 12px 16px; display: grid; gap: 4px;
  }
  .pl-form-note strong { font-size: .86rem; font-weight: 700; color: #0f2f63; display: block; }
  .pl-form-note p { margin: 0; font-size: .80rem; color: #4a5e7a; line-height: 1.5; }
`;
