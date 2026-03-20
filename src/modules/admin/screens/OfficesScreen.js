import { useEffect, useState } from 'react';
import { DetailItem, EmptyState, FormField, SectionHeading, SelectField, StatusPill } from '../../../shared/components/ui';
import { buildMunicipalityModuleData, formatModuleDate, formatModuleRelativeTime } from '../../../shared/municipalityModule';

const ADMIN_TABS = [
  { key: 'municipalities', label: 'Municipalities' },
  { key: 'offices', label: 'Offices' },
  { key: 'personnel', label: 'Personnel Assignments' },
];

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Archived', value: 'Archived' },
];

const COVERAGE_FILTERS = [
  { label: 'All Records', value: 'all' },
  { label: 'With Personnel', value: 'with-personnel' },
  { label: 'Without Personnel', value: 'without-personnel' },
];

const ASSIGNMENT_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Pending', value: 'Pending' },
];

const TAB_META = {
  municipalities: {
    eyebrow: 'Municipality management',
    title: 'Bulacan municipality records',
    text: 'Keep the main page as a compact table and open municipality actions in modals.',
    searchPlaceholder: 'Search municipality name, province, or status',
  },
  offices: {
    eyebrow: 'Office management',
    title: 'All registered offices',
    text: 'Add, edit, and inspect offices in modals instead of persistent form panels.',
    searchPlaceholder: 'Search office name, municipality, type, or address',
  },
  personnel: {
    eyebrow: 'Personnel assignment management',
    title: 'Personnel access and jurisdiction',
    text: 'Review assignment records in one table and manage each record through a focused modal.',
    searchPlaceholder: 'Search name, email, municipality, office, or role',
  },
};

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createMunicipalityForm() {
  return { name: '', province: 'Bulacan', description: '', contactNumber: '', emailAddress: '' };
}

function createOfficeForm(defaultMunicipality = '') {
  return {
    name: '',
    type: 'Municipal Office',
    municipality: defaultMunicipality,
    province: 'Bulacan',
    address: '',
    contactNumber: '',
    emailAddress: '',
    officeHours: 'Mon-Fri, 8:00 AM - 5:00 PM',
    lead: '',
    description: '',
  };
}

function createAssignmentForm() {
  return {
    municipality: '',
    office: '',
    role: 'Government Personnel',
    dateAssigned: getDateInputValue(),
    accessStartDate: getDateInputValue(),
    accessEndDate: getDateInputValue(90),
    status: 'Active',
  };
}

function createPersonnelInviteForm(defaultMunicipality = '', defaultOffice = '') {
  return {
    name: '',
    email: '',
    municipality: defaultMunicipality,
    office: defaultOffice,
    accessStartDate: getDateInputValue(),
    accessEndDate: getDateInputValue(90),
  };
}

function SummaryCard({ label, value, detail }) {
  return (
    <article className="location-summary-card">
      <small>{detail}</small>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function ActionButton({ children, tone = 'ghost', compact = false, ...props }) {
  return (
    <button className={`location-action-button tone-${tone} ${compact ? 'is-compact' : ''}`} type="button" {...props}>
      {children}
    </button>
  );
}

function ActivityList({ items }) {
  if (!items.length) {
    return <EmptyState title="No recent activity" text="Related updates will appear here once activity is recorded." />;
  }

  return (
    <div className="stack-list compact">
      {items.map((item) => (
        <article className="location-mini-card" key={item.id}>
          <div className="location-list-title">
            <strong>{item.actor}</strong>
            <small>{item.scope}</small>
          </div>
          <p>{item.detail}</p>
          <small>{formatModuleRelativeTime(item.time)}</small>
        </article>
      ))}
    </div>
  );
}

function ModalShell({ title, text, wide = false, onClose, children, footer }) {
  return (
    <div className="location-modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className={`location-modal ${wide ? 'is-wide' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="location-modal-header">
          <div>
            <strong>{title}</strong>
            {text ? <p>{text}</p> : null}
          </div>
          <button className="location-modal-close" onClick={onClose} type="button">Close</button>
        </div>
        <div className="location-modal-body">{children}</div>
        {footer ? <div className="location-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

function matchesCoverage(count, filterValue) {
  if (filterValue === 'all') return true;
  return filterValue === 'with-personnel' ? count > 0 : count === 0;
}

export default function OfficesScreen({ data, actions }) {
  const moduleData = buildMunicipalityModuleData(data);
  const municipalityOptions = moduleData.municipalities.map((item) => ({ label: item.name, value: item.name }));
  const officeTypeOptions = [...new Set(moduleData.offices.map((item) => item.type).filter(Boolean))].map((item) => ({
    label: item,
    value: item,
  }));

  const [activeTab, setActiveTab] = useState('municipalities');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [officeTypeFilter, setOfficeTypeFilter] = useState('all');
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(moduleData.municipalities[0]?.id || '');
  const [selectedOfficeId, setSelectedOfficeId] = useState(moduleData.offices[0]?.id || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(moduleData.personnelAssignments[0]?.id || '');
  const [openModal, setOpenModal] = useState(null);
  const [municipalityEditingId, setMunicipalityEditingId] = useState(null);
  const [officeEditingId, setOfficeEditingId] = useState(null);
  const [municipalityForm, setMunicipalityForm] = useState(createMunicipalityForm());
  const [officeForm, setOfficeForm] = useState(createOfficeForm(moduleData.municipalities[0]?.name || ''));
  const [assignmentForm, setAssignmentForm] = useState(createAssignmentForm());
  const [inviteForm, setInviteForm] = useState(createPersonnelInviteForm(moduleData.municipalities[0]?.name || '', ''));

  useEffect(() => {
    if (moduleData.municipalities.length && !moduleData.municipalities.some((item) => item.id === selectedMunicipalityId)) {
      setSelectedMunicipalityId(moduleData.municipalities[0].id);
    }
    if (moduleData.offices.length && !moduleData.offices.some((item) => item.id === selectedOfficeId)) {
      setSelectedOfficeId(moduleData.offices[0].id);
    }
    if (moduleData.personnelAssignments.length && !moduleData.personnelAssignments.some((item) => item.id === selectedAssignmentId)) {
      setSelectedAssignmentId(moduleData.personnelAssignments[0].id);
    }
  }, [moduleData.municipalities, moduleData.offices, moduleData.personnelAssignments, selectedMunicipalityId, selectedOfficeId, selectedAssignmentId]);

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

  const selectedMunicipality = moduleData.municipalities.find((item) => item.id === selectedMunicipalityId) || null;
  const selectedOffice = moduleData.offices.find((item) => item.id === selectedOfficeId) || null;
  const selectedAssignment = moduleData.personnelAssignments.find((item) => item.id === selectedAssignmentId) || null;
  const tabMeta = TAB_META[activeTab];
  const query = search.trim().toLowerCase();

  const filteredMunicipalities = moduleData.municipalities.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!matchesCoverage(item.assignedPersonnelCount, coverageFilter)) return false;
    if (!query) return true;
    return [item.name, item.province, item.status].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const filteredOffices = moduleData.offices.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (officeTypeFilter !== 'all' && item.type !== officeTypeFilter) return false;
    if (!matchesCoverage(item.personnelAssigned, coverageFilter)) return false;
    if (!query) return true;
    return [item.name, item.type, item.municipality, item.address].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const filteredAssignments = moduleData.personnelAssignments.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!query) return true;
    return [item.fullName, item.email, item.assignedMunicipality, item.assignedOffice, item.role].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );
  });

  const assignmentOfficeOptions = moduleData.offices
    .filter((item) => !assignmentForm.municipality || item.municipality === assignmentForm.municipality)
    .map((item) => ({ label: item.name, value: item.name }));

  const inviteOfficeOptions = moduleData.offices
    .filter((item) => !inviteForm.municipality || item.municipality === inviteForm.municipality)
    .map((item) => ({ label: item.name, value: item.name }));

  const syncOfficeProvince = (municipalityName) =>
    moduleData.municipalities.find((item) => item.name === municipalityName)?.province || 'Bulacan';

  const summaryCards = [
    { label: 'Total Municipalities', value: moduleData.summary.totalMunicipalities, detail: 'Bulacan LGUs' },
    { label: 'Total Offices', value: moduleData.summary.totalOffices, detail: 'registered offices' },
    { label: 'Active Municipalities', value: moduleData.summary.activeMunicipalities, detail: 'enabled records' },
    { label: 'Active Offices', value: moduleData.summary.activeOffices, detail: 'operational offices' },
    { label: 'Total Personnel Assigned', value: moduleData.summary.totalPersonnelAssigned, detail: 'with assignment scope' },
    { label: 'Unassigned Personnel', value: moduleData.summary.unassignedPersonnel, detail: 'needs placement' },
    {
      label: 'Municipality with Most Offices',
      value: moduleData.summary.municipalityWithMostOffices?.name || 'N/A',
      detail: `${moduleData.summary.municipalityWithMostOffices?.officesCount || 0} offices`,
    },
    {
      label: 'Recently Updated Offices',
      value: moduleData.summary.recentlyUpdatedOffices.length,
      detail: moduleData.summary.recentlyUpdatedOffices.map((item) => item.name).join(', ') || 'No updates',
    },
  ];

  const resetMunicipalityForm = () => {
    setMunicipalityEditingId(null);
    setMunicipalityForm(createMunicipalityForm());
  };

  const resetOfficeForm = (municipalityName = selectedMunicipality?.name || moduleData.municipalities[0]?.name || '') => {
    setOfficeEditingId(null);
    setOfficeForm(createOfficeForm(municipalityName));
  };

  const dismissModal = () => {
    setOpenModal(null);
    resetMunicipalityForm();
    resetOfficeForm();
    setAssignmentForm(createAssignmentForm());
    setInviteForm(createPersonnelInviteForm(selectedMunicipality?.name || moduleData.municipalities[0]?.name || '', ''));
  };

  const openMunicipalityView = (item) => {
    setSelectedMunicipalityId(item.id);
    setOpenModal('municipality-view');
  };

  const openMunicipalityForm = (item = null) => {
    if (item) {
      setSelectedMunicipalityId(item.id);
      setMunicipalityEditingId(item.id);
      setMunicipalityForm({
        name: item.name,
        province: item.province,
        description: item.description,
        contactNumber: item.contactNumber,
        emailAddress: item.emailAddress,
      });
    } else {
      resetMunicipalityForm();
    }
    setOpenModal('municipality-form');
  };

  const openOfficeView = (item) => {
    setSelectedOfficeId(item.id);
    setOpenModal('office-view');
  };

  const openOfficeForm = (item = null, municipalityName = '') => {
    if (item) {
      setSelectedOfficeId(item.id);
      setOfficeEditingId(item.id);
      setOfficeForm({
        name: item.name,
        type: item.type,
        municipality: item.municipality,
        province: item.province,
        address: item.address,
        contactNumber: item.contactNumber,
        emailAddress: item.emailAddress,
        officeHours: item.officeHours,
        lead: item.lead,
        description: item.description,
      });
    } else {
      const nextMunicipality = municipalityName || selectedMunicipality?.name || moduleData.municipalities[0]?.name || '';
      setOfficeEditingId(null);
      setOfficeForm({
        ...createOfficeForm(nextMunicipality),
        municipality: nextMunicipality,
        province: syncOfficeProvince(nextMunicipality),
      });
    }
    setOpenModal('office-form');
  };

  const openAssignmentManage = (item) => {
    setSelectedAssignmentId(item.id);
    setAssignmentForm({
      municipality: item.assignedMunicipality === 'Unassigned' ? '' : item.assignedMunicipality,
      office: item.assignedOffice === 'Unassigned' ? '' : item.assignedOffice,
      role: item.role,
      dateAssigned: item.dateAssigned,
      accessStartDate: item.accessStartDate || getDateInputValue(),
      accessEndDate: item.accessEndDate || getDateInputValue(90),
      status: item.status,
    });
    setOpenModal('assignment-manage');
  };

  const openAssignmentCreate = (municipalityName = '', officeName = '') => {
    setInviteForm(createPersonnelInviteForm(municipalityName || selectedMunicipality?.name || moduleData.municipalities[0]?.name || '', officeName));
    setOpenModal('assignment-create');
  };

  const handleMunicipalitySubmit = () => {
    if (municipalityEditingId) actions.updateMunicipality(municipalityEditingId, municipalityForm);
    else actions.addMunicipality(municipalityForm);
    dismissModal();
  };

  const handleOfficeSubmit = () => {
    if (officeEditingId) actions.updateOffice(officeEditingId, officeForm);
    else actions.addOffice(officeForm);
    dismissModal();
  };

  const handleAssignmentSubmit = () => {
    if (!selectedAssignment) return;
    actions.updatePersonnelAssignment(selectedAssignment.id, assignmentForm);
    dismissModal();
  };

  const handleCreatePersonnel = () => {
    const result = actions.createUserAccount({ ...inviteForm, role: 'personnel', office: inviteForm.office });
    if (result?.ok) dismissModal();
  };

  return (
    <>
      <style>{`
        .location-summary-grid,.location-filter-grid,.location-tab-strip,.location-toolbar,.location-toolbar-actions,.location-action-row,.location-stat-strip,.location-modal-panels,.location-inline-grid{display:grid;gap:1rem}
        .location-summary-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
        .location-summary-card,.location-mini-card,.location-stat-chip{padding:1rem 1.05rem;border-radius:20px;background:rgba(255,255,255,.94);border:1px solid rgba(18,32,25,.08);box-shadow:var(--pf-shadow-sm)}
        .location-summary-card{display:grid;gap:.2rem;background:radial-gradient(circle at top right, rgba(143,225,185,.18), transparent 38%),linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(232,239,231,.94) 100%)}
        .location-summary-card small,.location-mini-card small,.location-stat-chip small{color:var(--pf-ink-muted)}
        .location-summary-card strong{font-family:var(--pf-font-display);font-size:1.45rem;line-height:1.1}
        .location-summary-card span{font-weight:700;color:var(--pf-ink-soft)}
        .location-toolbar{grid-template-columns:minmax(0,1fr) auto;align-items:end;margin-bottom:1rem}
        .location-toolbar-actions{grid-auto-flow:column;grid-auto-columns:max-content;align-items:center;gap:.75rem}
        .location-filter-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:1rem}
        .location-tab-strip{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:1.2rem}
        .location-tab{padding:.8rem 1rem;border-radius:999px;background:rgba(30,125,77,.08);border:1px solid rgba(24,111,67,.12);color:var(--accent-deep);font-weight:700}
        .location-tab.is-active{background:linear-gradient(135deg,var(--pf-accent) 0%,var(--pf-accent-dark) 100%);color:#fff;border-color:transparent}
        .location-table-shell{overflow:auto;border-radius:22px;border:1px solid rgba(18,32,25,.08);background:linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(246,249,245,.96) 100%);box-shadow:var(--pf-shadow-sm)}
        .location-table{width:100%;min-width:980px;border-collapse:separate;border-spacing:0}
        .location-table th,.location-table td{padding:1rem .95rem;text-align:left;vertical-align:top;border-bottom:1px solid rgba(18,32,25,.08)}
        .location-table th{background:rgba(236,243,235,.96);color:var(--pf-ink-soft);font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
        .location-table tbody tr:last-child td{border-bottom:none}
        .location-table tbody tr:hover td{background:rgba(30,125,77,.03)}
        .location-cell-stack{display:grid;gap:.25rem}.location-cell-stack small{color:var(--pf-ink-muted)}
        .location-action-row{grid-auto-flow:column;grid-auto-columns:max-content;align-items:center;gap:.55rem}
        .location-action-button{padding:.74rem .9rem;border-radius:14px;font-weight:700;border:1px solid rgba(18,32,25,.08)}
        .location-action-button.is-compact{padding:.55rem .72rem;border-radius:12px;font-size:.82rem}
        .location-action-button.tone-primary{background:linear-gradient(135deg,var(--pf-accent) 0%,var(--pf-accent-dark) 100%);color:#fff;border-color:transparent}
        .location-action-button.tone-secondary{background:rgba(30,125,77,.08);color:var(--pf-accent-dark)}
        .location-action-button.tone-danger{background:rgba(191,77,70,.12);color:#9b3b35}
        .location-action-button.tone-ghost{background:#fff;color:var(--pf-ink)}
        .location-note,.location-mini-card{padding:.95rem 1rem;border-radius:18px;background:rgba(30,125,77,.06);border:1px solid rgba(24,111,67,.08)}
        .location-note p,.location-mini-card p,.location-modal-header p{margin:.35rem 0 0;color:var(--pf-ink-muted)}
        .location-stat-strip{grid-template-columns:repeat(4,minmax(0,1fr))}
        .location-stat-chip{display:grid;gap:.2rem;padding:.9rem 1rem}.location-stat-chip strong{font-size:1.15rem}
        .location-inline-grid,.location-modal-panels{grid-template-columns:repeat(2,minmax(0,1fr))}
        .location-list-title{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}
        .location-modal-backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:1.25rem;background:rgba(10,20,15,.5);backdrop-filter:blur(10px)}
        .location-modal{width:min(100%,46rem);max-height:min(92vh,60rem);overflow:auto;border-radius:28px;background:linear-gradient(180deg, rgba(252,253,251,.99) 0%, rgba(240,245,239,.98) 100%);border:1px solid rgba(18,32,25,.08);box-shadow:0 28px 90px rgba(10,20,15,.22)}
        .location-modal.is-wide{width:min(100%,64rem)}
        .location-modal-header,.location-modal-footer{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.2rem 1.35rem}
        .location-modal-header{border-bottom:1px solid rgba(18,32,25,.08)}.location-modal-footer{border-top:1px solid rgba(18,32,25,.08);flex-wrap:wrap;justify-content:flex-end}
        .location-modal-header strong{font-size:1.2rem}
        .location-modal-close{padding:.65rem .9rem;border-radius:12px;border:1px solid rgba(18,32,25,.08);background:#fff;font-weight:700}
        .location-modal-body{display:grid;gap:1rem;padding:1.25rem 1.35rem}
        @media (max-width:1180px){.location-summary-grid,.location-filter-grid,.location-stat-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.location-toolbar,.location-inline-grid,.location-modal-panels{grid-template-columns:1fr}.location-toolbar-actions,.location-action-row{grid-auto-flow:row;grid-auto-columns:1fr}}
        @media (max-width:820px){.location-summary-grid,.location-filter-grid,.location-stat-strip,.location-tab-strip,.location-inline-grid{grid-template-columns:1fr}.location-modal-backdrop{padding:.75rem}.location-modal-header,.location-modal-footer{align-items:stretch;flex-direction:column}}
      `}</style>

      <div className="dashboard-grid">
        <div className="section-card">
          <SectionHeading eyebrow="Main control center" title="Municipality and offices module" text="Manage Bulacan municipalities, offices, and personnel assignments from a cleaner control surface." />
          <div className="location-summary-grid">
            {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
          </div>
        </div>

        <div className="section-card">
          <div className="location-toolbar">
            <SectionHeading eyebrow={tabMeta.eyebrow} title={tabMeta.title} text={tabMeta.text} />
            <div className="location-toolbar-actions">
              {activeTab === 'municipalities' ? <ActionButton tone="primary" onClick={() => openMunicipalityForm()}>Add Municipality</ActionButton> : null}
              {activeTab === 'offices' ? <ActionButton tone="primary" onClick={() => openOfficeForm()}>Add Office</ActionButton> : null}
              {activeTab === 'personnel' ? <ActionButton tone="primary" onClick={() => openAssignmentCreate()}>Add Personnel</ActionButton> : null}
            </div>
          </div>

          <div className="location-filter-grid">
            <FormField label="Search" value={search} onChange={setSearch} placeholder={tabMeta.searchPlaceholder} />
            <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
            {activeTab === 'offices' ? (
              <SelectField label="Office Type" value={officeTypeFilter} onChange={setOfficeTypeFilter} options={[{ label: 'All Office Types', value: 'all' }, ...officeTypeOptions]} />
            ) : null}
            {activeTab !== 'personnel' ? (
              <SelectField label="Personnel Coverage" value={coverageFilter} onChange={setCoverageFilter} options={COVERAGE_FILTERS} />
            ) : null}
          </div>

          <div className="location-tab-strip">
            {ADMIN_TABS.map((tab) => (
              <button key={tab.key} className={`location-tab ${activeTab === tab.key ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.key)} type="button">
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'municipalities' ? (
            filteredMunicipalities.length ? (
              <div className="location-table-shell">
                <table className="location-table">
                  <thead>
                    <tr>
                      <th>Municipality ID</th><th>Municipality</th><th>Province</th><th>Offices</th><th>Personnel</th><th>Status</th><th>Date Created</th><th>Last Updated</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMunicipalities.map((item) => (
                      <tr key={item.id}>
                        <td>{item.municipalityId}</td>
                        <td><div className="location-cell-stack"><strong>{item.name}</strong><small>{item.emailAddress}</small></div></td>
                        <td>{item.province}</td>
                        <td>{item.officesCount}</td>
                        <td>{item.assignedPersonnelCount}</td>
                        <td><StatusPill status={item.status} /></td>
                        <td>{formatModuleDate(item.createdAt)}</td>
                        <td>{formatModuleDate(item.updatedAt)}</td>
                        <td>
                          <div className="location-action-row">
                            <ActionButton compact tone="primary" onClick={() => openMunicipalityView(item)}>View</ActionButton>
                            <ActionButton compact tone="secondary" onClick={() => openMunicipalityForm(item)}>Manage</ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="No municipalities found" text="Adjust the search or filters to see municipality records." />
          ) : null}

          {activeTab === 'offices' ? (
            filteredOffices.length ? (
              <div className="location-table-shell">
                <table className="location-table">
                  <thead>
                    <tr>
                      <th>Office ID</th><th>Office</th><th>Type</th><th>Municipality</th><th>Contact</th><th>Programs</th><th>Personnel</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOffices.map((item) => (
                      <tr key={item.id}>
                        <td>{item.officeId}</td>
                        <td><div className="location-cell-stack"><strong>{item.name}</strong><small>{item.address}</small></div></td>
                        <td>{item.type}</td>
                        <td>{item.municipality}</td>
                        <td><div className="location-cell-stack"><strong>{item.contactNumber}</strong><small>{item.emailAddress}</small></div></td>
                        <td>{item.programsAssigned}</td>
                        <td>{item.personnelAssigned}</td>
                        <td><StatusPill status={item.status} /></td>
                        <td>
                          <div className="location-action-row">
                            <ActionButton compact tone="primary" onClick={() => openOfficeView(item)}>View</ActionButton>
                            <ActionButton compact tone="secondary" onClick={() => openOfficeForm(item)}>Edit</ActionButton>
                            <ActionButton compact tone="danger" onClick={() => actions.archiveOffice(item.id)}>Archive</ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="No offices found" text="Refine the search or filters to display office records." />
          ) : null}

          {activeTab === 'personnel' ? (
            filteredAssignments.length ? (
              <div className="location-table-shell">
                <table className="location-table">
                  <thead>
                    <tr>
                      <th>Personnel ID</th><th>Full Name</th><th>Email</th><th>Municipality</th><th>Office</th><th>Role</th><th>Status</th><th>Date Assigned</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((item) => (
                      <tr key={item.id}>
                        <td>{item.personnelId}</td>
                        <td><div className="location-cell-stack"><strong>{item.fullName}</strong><small>{item.username}</small></div></td>
                        <td>{item.email}</td>
                        <td>{item.assignedMunicipality}</td>
                        <td>{item.assignedOffice}</td>
                        <td>{item.role}</td>
                        <td><StatusPill status={item.status} /></td>
                        <td>{formatModuleDate(item.dateAssigned)}</td>
                        <td>
                          <div className="location-action-row">
                            <ActionButton compact tone="primary" onClick={() => openAssignmentManage(item)}>Manage</ActionButton>
                            <ActionButton compact tone="ghost" onClick={() => actions.resetUserCredentials(item.id)}>Reset</ActionButton>
                            <ActionButton compact tone="danger" onClick={() => actions.removePersonnelAssignment(item.id)}>Remove</ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="No personnel assignments found" text="Search results and status filters affect the list shown here." />
          ) : null}
        </div>
      </div>

      {openModal === 'municipality-view' && selectedMunicipality ? (
        <ModalShell
          title={selectedMunicipality.name}
          text="The table stays minimal while this modal holds the municipality summary."
          wide
          onClose={dismissModal}
          footer={
            <>
              <ActionButton tone="secondary" onClick={() => openMunicipalityForm(selectedMunicipality)}>Manage Municipality</ActionButton>
              <ActionButton tone="ghost" onClick={() => openOfficeForm(null, selectedMunicipality.name)}>Add Office</ActionButton>
              <ActionButton tone="ghost" onClick={() => openAssignmentCreate(selectedMunicipality.name)}>Assign Personnel</ActionButton>
            </>
          }
        >
          <div className="location-stat-strip">
            <article className="location-stat-chip"><small>Offices</small><strong>{selectedMunicipality.officesCount}</strong></article>
            <article className="location-stat-chip"><small>Personnel</small><strong>{selectedMunicipality.assignedPersonnelCount}</strong></article>
            <article className="location-stat-chip"><small>Programs</small><strong>{selectedMunicipality.linkedPrograms.length}</strong></article>
            <article className="location-stat-chip"><small>Applications</small><strong>{selectedMunicipality.totalApplications}</strong></article>
          </div>
          <div className="location-inline-grid">
            <DetailItem label="Province" value={selectedMunicipality.province} />
            <DetailItem label="Status" value={selectedMunicipality.status} />
            <DetailItem label="Contact Number" value={selectedMunicipality.contactNumber} />
            <DetailItem label="Email Address" value={selectedMunicipality.emailAddress} />
          </div>
          <div className="location-note"><strong>Description</strong><p>{selectedMunicipality.description}</p></div>
          <div className="location-modal-panels">
            <div className="stack-list compact">
              {selectedMunicipality.offices.length ? selectedMunicipality.offices.map((item) => (
                <article className="location-mini-card" key={item.id}>
                  <div className="location-list-title"><strong>{item.name}</strong><StatusPill status={item.status} /></div>
                  <p>{item.type}</p>
                </article>
              )) : <EmptyState title="No offices yet" text="Add an office from this municipality modal when needed." />}
            </div>
            <div className="stack-list compact">
              {selectedMunicipality.assignedPersonnel.length ? selectedMunicipality.assignedPersonnel.map((item) => (
                <article className="location-mini-card" key={item.id}>
                  <div className="location-list-title"><strong>{item.fullName}</strong><StatusPill status={item.status} /></div>
                  <p>{item.assignedOffice}</p>
                </article>
              )) : <EmptyState title="No personnel assigned" text="Assignment records will appear here once personnel are linked to this municipality." />}
            </div>
          </div>
          <ActivityList items={selectedMunicipality.recentActivity} />
        </ModalShell>
      ) : null}

      {openModal === 'municipality-form' ? (
        <ModalShell
          title={municipalityEditingId ? 'Manage municipality' : 'Add municipality'}
          text="Editing is now done in a dedicated modal for a cleaner module layout."
          onClose={dismissModal}
          footer={
            <>
              {municipalityEditingId && selectedMunicipality ? (
                <ActionButton tone="ghost" onClick={() => actions.toggleMunicipalityStatus(selectedMunicipality.id)}>
                  {selectedMunicipality.status === 'Active' ? 'Deactivate Municipality' : 'Activate Municipality'}
                </ActionButton>
              ) : null}
              {municipalityEditingId && selectedMunicipality ? (
                <ActionButton
                  tone="danger"
                  onClick={() => {
                    actions.archiveMunicipality(selectedMunicipality.id);
                    dismissModal();
                  }}
                >
                  Archive Municipality
                </ActionButton>
              ) : null}
              <ActionButton tone="ghost" onClick={dismissModal}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={handleMunicipalitySubmit}>
                {municipalityEditingId ? 'Save Municipality' : 'Add Municipality'}
              </ActionButton>
            </>
          }
        >
          <div className="profile-grid">
            <FormField label="Municipality name" value={municipalityForm.name} onChange={(value) => setMunicipalityForm({ ...municipalityForm, name: value })} />
            <FormField label="Province" value={municipalityForm.province} onChange={(value) => setMunicipalityForm({ ...municipalityForm, province: value })} />
            <FormField label="Contact number" value={municipalityForm.contactNumber} onChange={(value) => setMunicipalityForm({ ...municipalityForm, contactNumber: value })} />
            <FormField label="Email address" value={municipalityForm.emailAddress} onChange={(value) => setMunicipalityForm({ ...municipalityForm, emailAddress: value })} />
          </div>
          <FormField label="Description" type="textarea" value={municipalityForm.description} onChange={(value) => setMunicipalityForm({ ...municipalityForm, description: value })} />
        </ModalShell>
      ) : null}

      {openModal === 'office-view' && selectedOffice ? (
        <ModalShell
          title={selectedOffice.name}
          text="Office details, assignments, and activity are grouped here instead of taking permanent page space."
          wide
          onClose={dismissModal}
          footer={
            <>
              <ActionButton tone="secondary" onClick={() => openOfficeForm(selectedOffice)}>Edit Office</ActionButton>
              <ActionButton tone="ghost" onClick={() => openAssignmentCreate(selectedOffice.municipality, selectedOffice.name)}>Assign Personnel</ActionButton>
              <ActionButton tone="ghost" onClick={() => actions.toggleOfficeStatus(selectedOffice.id)}>
                {selectedOffice.status === 'Active' ? 'Deactivate Office' : 'Activate Office'}
              </ActionButton>
            </>
          }
        >
          <div className="location-stat-strip">
            <article className="location-stat-chip"><small>Programs</small><strong>{selectedOffice.programsAssigned}</strong></article>
            <article className="location-stat-chip"><small>Personnel</small><strong>{selectedOffice.personnelAssigned}</strong></article>
            <article className="location-stat-chip"><small>Applications</small><strong>{selectedOffice.applicationsReceived}</strong></article>
            <article className="location-stat-chip"><small>Status</small><strong>{selectedOffice.status}</strong></article>
          </div>
          <div className="location-inline-grid">
            <DetailItem label="Office Type" value={selectedOffice.type} />
            <DetailItem label="Assigned Municipality" value={selectedOffice.municipality} />
            <DetailItem label="Contact Number" value={selectedOffice.contactNumber} />
            <DetailItem label="Email Address" value={selectedOffice.emailAddress} />
            <DetailItem label="Office Hours" value={selectedOffice.officeHours} />
            <DetailItem label="Lead / Focal Person" value={selectedOffice.lead} />
          </div>
          <div className="location-note"><strong>Address</strong><p>{selectedOffice.address}</p></div>
          <div className="location-modal-panels">
            <div className="stack-list compact">
              {selectedOffice.assignedPersonnel.length ? selectedOffice.assignedPersonnel.map((item) => (
                <article className="location-mini-card" key={item.id}>
                  <div className="location-list-title"><strong>{item.name}</strong><StatusPill status={item.status} /></div>
                  <p>{item.email}</p>
                </article>
              )) : <EmptyState title="No assigned personnel" text="Assign personnel to this office from the modal action above." />}
            </div>
            <div className="stack-list compact">
              {selectedOffice.applicationSummary.length ? selectedOffice.applicationSummary.map((item) => (
                <article className="location-mini-card" key={item.status}>
                  <div className="location-list-title"><strong>{item.status}</strong><span>{item.count}</span></div>
                </article>
              )) : <EmptyState title="No application activity" text="Application counts will appear once submissions are routed to this office." />}
            </div>
          </div>
          <ActivityList items={selectedOffice.recentActivity} />
        </ModalShell>
      ) : null}

      {openModal === 'office-form' ? (
        <ModalShell
          title={officeEditingId ? 'Edit office' : 'Add office'}
          text="Office creation and editing now happen in a single modal."
          onClose={dismissModal}
          footer={
            <>
              <ActionButton tone="ghost" onClick={dismissModal}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={handleOfficeSubmit}>{officeEditingId ? 'Save Office' : 'Add Office'}</ActionButton>
            </>
          }
        >
          <div className="profile-grid">
            <FormField label="Office name" value={officeForm.name} onChange={(value) => setOfficeForm({ ...officeForm, name: value })} />
            <FormField label="Office type" value={officeForm.type} onChange={(value) => setOfficeForm({ ...officeForm, type: value })} />
            <SelectField
              label="Assigned municipality"
              value={officeForm.municipality}
              onChange={(value) => setOfficeForm({ ...officeForm, municipality: value, province: syncOfficeProvince(value) })}
              options={municipalityOptions}
            />
            <FormField label="Office address" value={officeForm.address} onChange={(value) => setOfficeForm({ ...officeForm, address: value })} />
            <FormField label="Contact number" value={officeForm.contactNumber} onChange={(value) => setOfficeForm({ ...officeForm, contactNumber: value })} />
            <FormField label="Email address" value={officeForm.emailAddress} onChange={(value) => setOfficeForm({ ...officeForm, emailAddress: value })} />
            <FormField label="Office hours" value={officeForm.officeHours} onChange={(value) => setOfficeForm({ ...officeForm, officeHours: value })} />
            <FormField label="Lead / focal person" value={officeForm.lead} onChange={(value) => setOfficeForm({ ...officeForm, lead: value })} />
          </div>
          <FormField label="Description" type="textarea" value={officeForm.description} onChange={(value) => setOfficeForm({ ...officeForm, description: value })} />
        </ModalShell>
      ) : null}

      {openModal === 'assignment-manage' && selectedAssignment ? (
        <ModalShell
          title={`Manage assignment: ${selectedAssignment.fullName}`}
          text="Update municipality scope, office scope, role, and access dates in one modal."
          onClose={dismissModal}
          footer={
            <>
              <ActionButton tone="danger" onClick={() => { actions.removePersonnelAssignment(selectedAssignment.id); dismissModal(); }}>Remove Assignment</ActionButton>
              <ActionButton tone="ghost" onClick={() => actions.resetUserCredentials(selectedAssignment.id)}>Reset Credentials</ActionButton>
              <ActionButton tone="ghost" onClick={() => actions.toggleUserStatus(selectedAssignment.id)}>
                {selectedAssignment.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
              </ActionButton>
              <ActionButton tone="primary" onClick={handleAssignmentSubmit}>Save Assignment</ActionButton>
            </>
          }
        >
          <div className="location-inline-grid">
            <DetailItem label="Email / Username" value={`${selectedAssignment.email} | ${selectedAssignment.username}`} />
            <DetailItem label="Invite Status" value={selectedAssignment.inviteStatus} />
          </div>
          <div className="profile-grid">
            <SelectField
              label="Assigned municipality"
              value={assignmentForm.municipality}
              onChange={(value) => {
                const hasOffice = moduleData.offices.some((item) => item.name === assignmentForm.office && item.municipality === value);
                setAssignmentForm({ ...assignmentForm, municipality: value, office: hasOffice ? assignmentForm.office : '' });
              }}
              options={municipalityOptions}
            />
            <SelectField label="Assigned office" value={assignmentForm.office} onChange={(value) => setAssignmentForm({ ...assignmentForm, office: value })} options={[{ label: 'Unassigned office', value: '' }, ...assignmentOfficeOptions]} />
            <FormField label="Role" value={assignmentForm.role} onChange={(value) => setAssignmentForm({ ...assignmentForm, role: value })} />
            <SelectField label="Status" value={assignmentForm.status} onChange={(value) => setAssignmentForm({ ...assignmentForm, status: value })} options={ASSIGNMENT_STATUS_OPTIONS} />
            <FormField label="Date assigned" type="date" value={assignmentForm.dateAssigned} onChange={(value) => setAssignmentForm({ ...assignmentForm, dateAssigned: value })} />
            <FormField label="Access start date" type="date" value={assignmentForm.accessStartDate} onChange={(value) => setAssignmentForm({ ...assignmentForm, accessStartDate: value })} />
            <FormField label="Access end date" type="date" value={assignmentForm.accessEndDate} onChange={(value) => setAssignmentForm({ ...assignmentForm, accessEndDate: value })} />
          </div>
        </ModalShell>
      ) : null}

      {openModal === 'assignment-create' ? (
        <ModalShell
          title="Add personnel assignment"
          text="Provision personnel access through a modal for a simpler page layout."
          onClose={dismissModal}
          footer={
            <>
              <ActionButton tone="ghost" onClick={dismissModal}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={handleCreatePersonnel}>Add Personnel</ActionButton>
            </>
          }
        >
          <div className="location-note">
            <strong>Gmail notice</strong>
            <p>The invite uses Gmail and a temporary password is queued automatically for delivery.</p>
          </div>
          <div className="profile-grid">
            <FormField label="Full name" value={inviteForm.name} onChange={(value) => setInviteForm({ ...inviteForm, name: value })} />
            <FormField label="Gmail address" type="email" value={inviteForm.email} onChange={(value) => setInviteForm({ ...inviteForm, email: value })} placeholder="name@gmail.com" />
            <SelectField
              label="Assigned municipality"
              value={inviteForm.municipality}
              onChange={(value) => {
                const hasOffice = moduleData.offices.some((item) => item.name === inviteForm.office && item.municipality === value);
                setInviteForm({ ...inviteForm, municipality: value, office: hasOffice ? inviteForm.office : '' });
              }}
              options={municipalityOptions}
            />
            <SelectField label="Assigned office" value={inviteForm.office} onChange={(value) => setInviteForm({ ...inviteForm, office: value })} options={[{ label: 'Optional office assignment', value: '' }, ...inviteOfficeOptions]} />
            <FormField label="Access start date" type="date" value={inviteForm.accessStartDate} onChange={(value) => setInviteForm({ ...inviteForm, accessStartDate: value })} />
            <FormField label="Access end date" type="date" value={inviteForm.accessEndDate} onChange={(value) => setInviteForm({ ...inviteForm, accessEndDate: value })} />
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
