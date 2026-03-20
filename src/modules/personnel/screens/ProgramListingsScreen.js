import { useEffect, useState } from 'react';
import { EmptyState, FormField, SectionHeading, SelectField, StatusPill } from '../../../shared/components/ui';
import { getOfficePrograms } from './helpers';

const STATUS_FILTERS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Open', value: 'Open' },
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'Closed', value: 'Closed' },
  { label: 'Archived', value: 'Archived' },
];

const FORM_STATUS_OPTIONS = [
  { label: 'Open', value: 'Open' },
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'Closed', value: 'Closed' },
];

function formatDate(value) {
  if (!value) return 'Not set';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function formatWindow(program) {
  if (program.applicationStartDate && program.applicationEndDate) {
    return `${formatDate(program.applicationStartDate)} to ${formatDate(program.applicationEndDate)}`;
  }
  if (program.deadline) return `Deadline ${formatDate(program.deadline)}`;
  return 'Schedule to be announced';
}

function getDisplayStatus(program) {
  return program.archived ? 'Archived' : program.status || 'Open';
}

function createForm(data, session, program = null) {
  if (!program) {
    return {
      title: '',
      category: data.categories[0]?.name || '',
      sector: data.sectors[0]?.name || '',
      status: 'Open',
      programType: 'Municipal Assistance Program',
      applicationStartDate: '',
      applicationEndDate: '',
      deadline: '',
      slots: '30',
      maxBeneficiaries: '30',
      summary: '',
      objective: '',
      benefits: '',
      coverageNotes: session.municipality || '',
      submissionInstructions: '',
      additionalNotes: '',
      requirements: '',
      eligibility: '',
      attachments: '',
      imageReference: '',
      imageName: '',
    };
  }

  return {
    title: program.title || '',
    category: program.category || data.categories[0]?.name || '',
    sector: program.sector || data.sectors[0]?.name || '',
    status: program.status || 'Open',
    programType: program.programType || 'Municipal Assistance Program',
    applicationStartDate: program.applicationStartDate || '',
    applicationEndDate: program.applicationEndDate || '',
    deadline: program.deadline || '',
    slots: String(program.slots || ''),
    maxBeneficiaries: String(program.maxBeneficiaries || ''),
    summary: program.summary || program.description || '',
    objective: program.objective || '',
    benefits: program.benefits || '',
    coverageNotes: program.coverageNotes || session.municipality || '',
    submissionInstructions: program.submissionInstructions || '',
    additionalNotes: program.additionalNotes || '',
    requirements: (program.requirements || []).join('\n'),
    eligibility: (program.eligibility || []).join('\n'),
    attachments: (program.attachments || []).join('\n'),
    imageReference: program.imageReference || '',
    imageName: program.imageName || '',
  };
}

function Metric({ label, value, detail }) {
  return (
    <article className="personnel-program-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function ModalShell({ title, text, onClose, wide = false, footer, children }) {
  return (
    <div className="personnel-program-modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className={`personnel-program-modal ${wide ? 'is-wide' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="personnel-program-modal-header">
          <div>
            <strong>{title}</strong>
            {text ? <p>{text}</p> : null}
          </div>
          <button className="personnel-program-modal-close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="personnel-program-modal-body">{children}</div>
        {footer ? <div className="personnel-program-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

function ProgramForm({ form, categories, sectors, linkedApplications, onFieldChange, onImageUpload }) {
  return (
    <div className="personnel-program-form-shell">
      <div className="personnel-program-form-grid">
        <FormField label="Program title" value={form.title} onChange={(value) => onFieldChange('title', value)} placeholder="Program title" />
        <FormField label="Program type" value={form.programType} onChange={(value) => onFieldChange('programType', value)} placeholder="Scholarship, aid, livelihood, training" />
        <SelectField label="Category" value={form.category} onChange={(value) => onFieldChange('category', value)} options={categories} />
        <SelectField label="Sector" value={form.sector} onChange={(value) => onFieldChange('sector', value)} options={sectors} />
        <SelectField label="Listing status" value={form.status} onChange={(value) => onFieldChange('status', value)} options={FORM_STATUS_OPTIONS} />
        <FormField label="Slot count" type="number" value={form.slots} onChange={(value) => onFieldChange('slots', value)} placeholder="30" />
        <FormField label="Max beneficiaries" type="number" value={form.maxBeneficiaries} onChange={(value) => onFieldChange('maxBeneficiaries', value)} placeholder="30" />
        <FormField label="Application start date" type="date" value={form.applicationStartDate} onChange={(value) => onFieldChange('applicationStartDate', value)} />
        <FormField label="Application end date" type="date" value={form.applicationEndDate} onChange={(value) => onFieldChange('applicationEndDate', value)} />
        <FormField label="Deadline date" type="date" value={form.deadline} onChange={(value) => onFieldChange('deadline', value)} />
      </div>

      <div className="personnel-program-upload-grid">
        <div className="personnel-program-preview-card">
          {form.imageReference ? (
            <img alt={form.title || 'Program preview'} className="personnel-program-preview-image" src={form.imageReference} />
          ) : (
            <div className="personnel-program-preview-placeholder">
              <strong>No image uploaded yet</strong>
              <p>Upload the applicant-facing cover image for this program.</p>
            </div>
          )}
        </div>

        <label className="personnel-program-upload-field">
          <span>Program image</span>
          <input accept="image/*" onChange={onImageUpload} type="file" />
          <small>Upload an image file to use as the applicant-facing banner.</small>
          <strong>{form.imageName || 'No file selected'}</strong>
        </label>
      </div>

      <FormField label="Summary" type="textarea" value={form.summary} onChange={(value) => onFieldChange('summary', value)} />
      <FormField label="Objective" type="textarea" value={form.objective} onChange={(value) => onFieldChange('objective', value)} />
      <FormField label="Benefits" type="textarea" value={form.benefits} onChange={(value) => onFieldChange('benefits', value)} />
      <FormField label="Coverage notes" type="textarea" value={form.coverageNotes} onChange={(value) => onFieldChange('coverageNotes', value)} />
      <FormField label="Submission instructions" type="textarea" value={form.submissionInstructions} onChange={(value) => onFieldChange('submissionInstructions', value)} />
      <FormField label="Additional notes" type="textarea" value={form.additionalNotes} onChange={(value) => onFieldChange('additionalNotes', value)} />
      <FormField label="Required applicant attachments" type="textarea" value={form.requirements} onChange={(value) => onFieldChange('requirements', value)} placeholder={`Valid ID\nBarangay Certificate\nProof of residency`} />
      <FormField label="Eligibility criteria" type="textarea" value={form.eligibility} onChange={(value) => onFieldChange('eligibility', value)} placeholder={`Resident of municipality\nQualified age range\nRequired sector or case condition`} />
      <FormField label="Internal reference attachments" type="textarea" value={form.attachments} onChange={(value) => onFieldChange('attachments', value)} placeholder={`Program brief PDF\nEvaluation sheet\nPoster artwork`} />

      <div className="personnel-program-note">
        <strong>Listing note</strong>
        <p>This modal keeps schedule, eligibility, attachments, and image upload in one place so the main page can stay focused on the program table.</p>
        {linkedApplications ? <p>Linked application records: {linkedApplications}. Delete is disabled while application records exist.</p> : null}
      </div>
    </div>
  );
}

export default function ProgramListingsScreen({ session, data, actions }) {
  const programs = [...getOfficePrograms(data, session)].sort((left, right) => {
    const leftStatus = getDisplayStatus(left);
    const rightStatus = getDisplayStatus(right);
    if (leftStatus === 'Archived' && rightStatus !== 'Archived') return 1;
    if (rightStatus === 'Archived' && leftStatus !== 'Archived') return -1;
    return left.title.localeCompare(right.title);
  });

  const applicationCounts = programs.reduce((summary, program) => {
    summary[program.id] = data.applications.filter((application) => application.programId === program.id).length;
    return summary;
  }, {});

  const getApplicantCount = (program) => Math.max(program.applicants || 0, applicationCounts[program.id] || 0);
  const categoryFilterOptions = [{ label: 'All categories', value: 'all' }, ...data.categories.map((item) => ({ label: item.name, value: item.name }))];
  const categoryOptions = data.categories.map((item) => ({ label: item.name, value: item.name }));
  const sectorOptions = data.sectors.map((item) => ({ label: item.name, value: item.name }));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openModal, setOpenModal] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(programs[0]?.id || '');
  const [form, setForm] = useState(() => createForm(data, session));

  useEffect(() => {
    if (!programs.length) return;
    if (!programs.some((program) => program.id === selectedProgramId)) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  useEffect(() => {
    if (!openModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenModal(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openModal]);

  const query = search.trim().toLowerCase();
  const filteredPrograms = programs.filter((program) => {
    const displayStatus = getDisplayStatus(program);
    if (statusFilter !== 'all' && displayStatus !== statusFilter) return false;
    if (categoryFilter !== 'all' && program.category !== categoryFilter) return false;
    if (!query) return true;
    return [program.title, program.category, program.sector, program.programType, displayStatus, program.summary].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );
  });

  const selectedProgram = programs.find((program) => program.id === selectedProgramId) || null;
  const selectedProgramApplications = selectedProgram ? applicationCounts[selectedProgram.id] || 0 : 0;

  const totalApplicants = programs.reduce((sum, program) => sum + getApplicantCount(program), 0);
  const activePrograms = programs.filter((program) => !program.archived && ['Open', 'Upcoming'].includes(program.status)).length;
  const archivedPrograms = programs.filter((program) => program.archived).length;
  const programsWithImages = programs.filter((program) => program.imageReference).length;

  const onFieldChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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
    setForm((current) => ({ ...current, imageReference: dataUrl, imageName: file.name }));
  };

  const closeModal = () => setOpenModal(null);
  const openCreateModal = () => {
    setForm(createForm(data, session));
    setOpenModal('create');
  };
  const openDetailsModal = (program) => {
    setSelectedProgramId(program.id);
    setForm(createForm(data, session, program));
    setOpenModal('details');
  };

  const handleCreate = () => {
    const result = actions.createProgram(form);
    if (result?.ok) closeModal();
  };

  const handleUpdate = () => {
    if (!selectedProgram) return;
    const result = actions.updateProgram(selectedProgram.id, form);
    if (result?.ok) closeModal();
  };

  const handleArchive = () => {
    if (!selectedProgram) return;
    const result = actions.archiveProgram(selectedProgram.id);
    if (result?.ok) closeModal();
  };

  const handleDelete = () => {
    if (!selectedProgram) return;
    const result = actions.deleteProgram(selectedProgram.id);
    if (result?.ok) closeModal();
  };

  return (
    <>
      <style>{`
        .personnel-program-shell,.personnel-program-metrics,.personnel-program-toolbar,.personnel-program-table,.personnel-program-form-grid,.personnel-program-upload-grid,.personnel-program-form-shell{display:grid;gap:1rem}
        .personnel-program-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}
        .personnel-program-toolbar{grid-template-columns:minmax(0,1.2fr) repeat(2,minmax(180px,.45fr));align-items:end}
        .personnel-program-toolbar-head,.personnel-program-modal-header,.personnel-program-modal-footer,.personnel-program-modal-footer-left,.personnel-program-modal-footer-right{display:flex;gap:1rem}
        .personnel-program-toolbar-head{align-items:flex-end;justify-content:space-between;flex-wrap:wrap;margin-bottom:1rem}
        .personnel-program-metric,.personnel-program-table-row,.personnel-program-note,.personnel-program-preview-card,.personnel-program-upload-field{padding:1rem 1.05rem;border-radius:22px;border:1px solid rgba(24,111,67,.08);background:rgba(255,255,255,.95);box-shadow:var(--pf-shadow-sm)}
        .personnel-program-metric{display:grid;gap:.2rem;background:radial-gradient(circle at top right, rgba(143,225,185,.18), transparent 36%),linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(240,245,239,.95) 100%)}
        .personnel-program-metric small,.personnel-program-table-row p,.personnel-program-table-row small,.personnel-program-table-head,.personnel-program-note p,.personnel-program-modal-header p,.personnel-program-upload-field small,.personnel-program-preview-placeholder p{color:var(--pf-ink-muted)}
        .personnel-program-metric strong{display:block;margin:.18rem 0 .25rem;font-size:1.48rem;font-family:var(--pf-font-display);line-height:1.05}
        .personnel-program-metric span{font-weight:700;color:var(--pf-ink-soft)}
        .personnel-program-note{background:rgba(30,125,77,.06)}
        .personnel-program-note strong{display:block;margin-bottom:.25rem}
        .personnel-program-table{gap:.85rem}
        .personnel-program-table-head,.personnel-program-table-row{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(140px,.75fr) minmax(220px,1fr) minmax(100px,.55fr) 120px 96px;align-items:start;gap:1rem}
        .personnel-program-table-head{padding:0 .35rem;font-size:.76rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .personnel-program-table-row{background:linear-gradient(180deg, rgba(248,251,247,.98) 0%, rgba(239,244,238,.94) 100%)}
        .personnel-program-table-row strong,.personnel-program-upload-field strong,.personnel-program-preview-placeholder strong{display:block;margin-bottom:.2rem}
        .personnel-program-table-row p,.personnel-program-table-row small,.personnel-program-preview-placeholder p{margin:0;line-height:1.5}
        .personnel-program-table-program{display:grid;grid-template-columns:72px minmax(0,1fr);gap:.85rem;align-items:start}
        .personnel-program-table-thumb{width:72px;height:72px;border-radius:18px;overflow:hidden;background:linear-gradient(135deg, rgba(30,125,77,.24) 0%, rgba(18,32,25,.16) 100%);border:1px solid rgba(24,111,67,.08)}
        .personnel-program-table-thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .personnel-program-table-thumb.is-empty{display:grid;place-items:center;color:var(--pf-accent-dark);font-size:.72rem;font-weight:800;text-align:center;padding:.5rem}
        .personnel-program-table-action{display:flex;justify-content:flex-end}
        .personnel-program-modal-backdrop{position:fixed;inset:0;z-index:85;display:grid;place-items:center;padding:1.25rem;background:rgba(10,20,15,.5);backdrop-filter:blur(10px)}
        .personnel-program-modal{width:min(100%,50rem);max-height:min(92vh,60rem);overflow:auto;border-radius:28px;background:linear-gradient(180deg, rgba(252,253,251,.99) 0%, rgba(240,245,239,.98) 100%);border:1px solid rgba(18,32,25,.08);box-shadow:0 28px 90px rgba(10,20,15,.22)}
        .personnel-program-modal.is-wide{width:min(100%,68rem)}
        .personnel-program-modal-header,.personnel-program-modal-footer{align-items:flex-start;justify-content:space-between;padding:1.2rem 1.35rem}
        .personnel-program-modal-header{border-bottom:1px solid rgba(18,32,25,.08)}
        .personnel-program-modal-header strong{font-size:1.2rem}
        .personnel-program-modal-body{display:grid;gap:1rem;padding:1.25rem 1.35rem}
        .personnel-program-modal-footer{border-top:1px solid rgba(18,32,25,.08);flex-wrap:wrap}
        .personnel-program-modal-footer-left,.personnel-program-modal-footer-right{align-items:center;flex-wrap:wrap}
        .personnel-program-modal-close,.personnel-program-delete-button{padding:.7rem .95rem;border-radius:14px;font-weight:700;border:1px solid rgba(18,32,25,.08);background:#fff}
        .personnel-program-delete-button{color:#9e4f44;background:rgba(195,86,75,.08);border-color:rgba(195,86,75,.18)}
        .personnel-program-delete-button:disabled{opacity:.55;cursor:not-allowed}
        .personnel-program-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .personnel-program-upload-grid{grid-template-columns:minmax(280px,.9fr) minmax(0,1.1fr);align-items:stretch}
        .personnel-program-preview-card,.personnel-program-upload-field{display:grid;gap:.75rem}
        .personnel-program-preview-card{min-height:15rem;padding:0;overflow:hidden}
        .personnel-program-preview-image{width:100%;height:100%;object-fit:cover;display:block}
        .personnel-program-preview-placeholder{display:grid;align-content:center;justify-items:center;min-height:15rem;padding:1.25rem;text-align:center;background:linear-gradient(135deg, rgba(30,125,77,.12) 0%, rgba(18,32,25,.08) 100%)}
        .personnel-program-upload-field input[type="file"]{width:100%;padding:.9rem;border-radius:16px;border:1px dashed rgba(24,111,67,.22);background:rgba(255,255,255,.92)}
        @media (max-width:1180px){.personnel-program-metrics,.personnel-program-toolbar,.personnel-program-form-grid,.personnel-program-upload-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.personnel-program-table-head,.personnel-program-table-row{grid-template-columns:repeat(2,minmax(0,1fr))}.personnel-program-table-action{justify-content:flex-start}}
        @media (max-width:820px){.personnel-program-metrics,.personnel-program-toolbar,.personnel-program-form-grid,.personnel-program-upload-grid,.personnel-program-table-head,.personnel-program-table-row,.personnel-program-table-program{grid-template-columns:1fr}.personnel-program-table-head{display:none}.personnel-program-modal-backdrop{padding:.75rem}.personnel-program-modal-header,.personnel-program-modal-footer{flex-direction:column;align-items:stretch}}
      `}</style>

      <div className="dashboard-grid personnel-program-shell">
        <div className="section-card">
          <SectionHeading eyebrow="Office programs" title="Program listings" text="Manage the applicant-facing programs published by your office through a cleaner table, filters, and modal-based actions." />
          <div className="personnel-program-metrics">
            <Metric label="Office Listings" value={programs.length} detail={session.office} />
            <Metric label="Open or Upcoming" value={activePrograms} detail="Active applicant-facing listings" />
            <Metric label="Archived Listings" value={archivedPrograms} detail="Removed from regular view" />
            <Metric label="Applicant Activity" value={totalApplicants} detail={`${programsWithImages} listings with visuals`} />
          </div>
        </div>

        <div className="section-card">
          <div className="personnel-program-toolbar-head">
            <div>
              <SectionHeading eyebrow="Published records" title="Office program table" text="Search the current listings, filter them by status or category, then open any row in a modal to edit, archive, or delete." />
            </div>
            <button className="primary-button" onClick={openCreateModal} type="button">Add Program</button>
          </div>

          <div className="personnel-program-toolbar">
            <FormField label="Search programs" value={search} onChange={setSearch} placeholder="Search title, category, sector, type, or status" />
            <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
            <SelectField label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categoryFilterOptions} />
          </div>

          <div className="personnel-program-note">
            <strong>{programs.length} seeded office listings available</strong>
            <p>This office already includes placeholder program rows with real image URLs so the table, modals, and applicant-facing preview data are easier to evaluate.</p>
          </div>

          {filteredPrograms.length ? (
            <div className="personnel-program-table">
              <div className="personnel-program-table-head">
                <span>Program</span>
                <span>Category</span>
                <span>Application Window</span>
                <span>Applicants</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {filteredPrograms.map((program) => (
                <article className="personnel-program-table-row" key={program.id}>
                  <div className="personnel-program-table-program">
                    <div className={`personnel-program-table-thumb ${program.imageReference ? '' : 'is-empty'}`}>
                      {program.imageReference ? <img alt={program.title} src={program.imageReference} /> : <span>No image</span>}
                    </div>
                    <div>
                      <strong>{program.title}</strong>
                      <p>{program.programType || 'Government assistance program'}</p>
                      <small>{program.sector} · {program.municipality}</small>
                    </div>
                  </div>
                  <div>
                    <strong>{program.category}</strong>
                    <small>{program.sector}</small>
                  </div>
                  <div>
                    <strong>{formatWindow(program)}</strong>
                    <small>Deadline {formatDate(program.deadline)}</small>
                  </div>
                  <div>
                    <strong>{getApplicantCount(program)}</strong>
                    <small>{program.maxBeneficiaries || program.slots || 0} beneficiaries max</small>
                  </div>
                  <div>
                    <StatusPill status={getDisplayStatus(program)} />
                  </div>
                  <div className="personnel-program-table-action">
                    <button className="secondary-button" onClick={() => openDetailsModal(program)} type="button">View</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No programs matched" text="Try a different search term or adjust the filters to view the office program listings." />
          )}
        </div>
      </div>

      {openModal === 'create' ? (
        <ModalShell
          title="Add program listing"
          text="Create a new applicant-facing listing from a modal so the main workspace stays centered on the program table."
          wide
          onClose={closeModal}
          footer={
            <>
              <div className="personnel-program-modal-footer-left">
                <button className="secondary-button" onClick={closeModal} type="button">Cancel</button>
              </div>
              <div className="personnel-program-modal-footer-right">
                <button className="primary-button" onClick={handleCreate} type="button">Publish Program</button>
              </div>
            </>
          }
        >
          <ProgramForm categories={categoryOptions} sectors={sectorOptions} form={form} linkedApplications={0} onFieldChange={onFieldChange} onImageUpload={onImageUpload} />
        </ModalShell>
      ) : null}

      {openModal === 'details' && selectedProgram ? (
        <ModalShell
          title={selectedProgram.title}
          text="Review the full listing here, then edit the program, archive it, or remove it if no application records are attached."
          wide
          onClose={closeModal}
          footer={
            <>
              <div className="personnel-program-modal-footer-left">
                {!selectedProgram.archived ? (
                  <button className="secondary-button" onClick={handleArchive} type="button">Archive</button>
                ) : (
                  <StatusPill status="Archived" />
                )}
                <button className="personnel-program-delete-button" disabled={selectedProgramApplications > 0} onClick={handleDelete} type="button">
                  Delete
                </button>
              </div>
              <div className="personnel-program-modal-footer-right">
                <button className="secondary-button" onClick={closeModal} type="button">Cancel</button>
                <button className="primary-button" onClick={handleUpdate} type="button">Save Changes</button>
              </div>
            </>
          }
        >
          <ProgramForm categories={categoryOptions} sectors={sectorOptions} form={form} linkedApplications={selectedProgramApplications} onFieldChange={onFieldChange} onImageUpload={onImageUpload} />
        </ModalShell>
      ) : null}
    </>
  );
}
