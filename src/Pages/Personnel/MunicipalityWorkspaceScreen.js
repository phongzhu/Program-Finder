import { useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  DetailItem,
  EmptyState,
  FormField,
  ManagementCellStack,
  ManagementFilterGrid,
  ManagementGrid,
  ManagementInlineGrid,
  ManagementTable,
  ManagementToolbar,
  ModalShell as FormModalShell,
  SectionHeading,
  SelectField,
  StatusPill,
  SummaryCard,
} from 'Components/UI';
import {
  createOfficeRecord,
  listOfficeManagementRecords,
  updateOfficeRecord,
} from 'Services/Supabase/offices';
import {
  buildMunicipalityModuleData,
  formatModuleDate,
  formatModuleRelativeTime,
  getPersonnelScope,
} from 'Utils/municipalityModule';
import { getStaffRoleKey } from 'Utils/staffHierarchy';

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Archived', value: 'Archived' },
];

const INNER_TAB_OPTIONS = [
  { key: 'browser', label: 'Office Browser' },
  { key: 'pinned', label: 'Pinned Office' },
  { key: 'municipality', label: 'Municipality Insight' },
  { key: 'assignment', label: 'Assignment' },
];

const OFFICE_LEVEL_OPTIONS = [
  { label: 'Barangay', value: 'barangay' },
  { label: 'Municipal', value: 'municipal' },
];

function createOfficeForm(municipalityId = '', barangayId = '', office = {}) {
  return {
    officeName: office.officeName || office.name || '',
    officeLevel: office.officeLevel || 'barangay',
    parentOfficeId: office.parentOfficeId || '',
    municipalityId: office.municipalityId || municipalityId || '',
    barangayId: office.barangayId || barangayId || '',
    houseNumber: office.houseNumber || '',
    streetName: office.streetName || '',
    subdivisionArea: office.subdivisionArea || '',
    contactNumber: office.contactNumber || '',
    email: office.email || office.emailAddress || '',
    status: office.status || 'Active',
  };
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function getOfficesPath(municipalityId, barangayId = '') {
  return `/personnel/view-offices/${municipalityId}${barangayId ? `/${barangayId}` : ''}`;
}

function normalizeComparable(value) {
  return String(value || '').trim().toLowerCase();
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 15 4.25 4.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6.75 9.75 5.25 5.25 5.25-5.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M5.75 20.25h12.5M7 20.25V5.75a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14.5M9.25 8.5h1.5M13.25 8.5h1.5M9.25 12h1.5M13.25 12h1.5M11 20.25v-3.5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ScopeMetric({ label, value, detail }) {
  return (
    <article className="personnel-scope-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function ScopeTabButton({ label, note, isActive, onClick }) {
  return (
    <button
      aria-selected={isActive}
      className={`personnel-scope-tab-button${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <strong>{label}</strong>
      <span>{note}</span>
    </button>
  );
}

function ScopeSearchField({ label, value, onChange, placeholder }) {
  return (
    <label className="personnel-scope-control personnel-scope-control-search">
      <span className="personnel-scope-control-label">{label}</span>
      <span className="personnel-scope-search-shell">
        <span className="personnel-scope-search-icon">
          <SearchIcon />
        </span>
        <input
          className="personnel-scope-control-input"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </span>
    </label>
  );
}

function ScopeSelect({ label, value, onChange, options }) {
  return (
    <label className="personnel-scope-control">
      <span className="personnel-scope-control-label">{label}</span>
      <span className="personnel-scope-select-shell">
        <select className="personnel-scope-control-select" onChange={(event) => onChange(event.target.value)} value={value}>
          {options.map((option) => (
            <option key={`${option.value}-${option.label}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="personnel-scope-select-icon">
          <ChevronDownIcon />
        </span>
      </span>
    </label>
  );
}

function SummaryBars({ items, emptyText }) {
  const rows = items.filter((item) => item.count > 0);
  const maxValue = Math.max(...rows.map((item) => item.count), 1);

  if (!rows.length) {
    return <p className="body-text">{emptyText}</p>;
  }

  return (
    <div className="personnel-scope-summary-bars">
      {rows.map((item) => (
        <div className="personnel-scope-summary-row" key={item.status}>
          <div className="personnel-scope-summary-copy">
            <strong>{item.status}</strong>
            <span>{item.count} record{item.count === 1 ? '' : 's'}</span>
          </div>
          <div className="personnel-scope-summary-track">
            <span className="personnel-scope-summary-fill" style={{ width: `${Math.max(8, Math.round((item.count / maxValue) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalShell({ title, text, onClose, children }) {
  return (
    <div className="personnel-scope-modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="personnel-scope-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="personnel-scope-modal-header">
          <div>
            <strong>{title}</strong>
            {text ? <p>{text}</p> : null}
          </div>
          <button className="personnel-scope-modal-close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="personnel-scope-modal-body">{children}</div>
      </div>
    </div>
  );
}

function ActivityList({ items, emptyTitle, emptyText }) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <div className="personnel-scope-activity-list">
      {items.map((item) => (
        <article className="personnel-scope-activity-card" key={item.id}>
          <div className="personnel-scope-activity-head">
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

function OfficeCard({ office, isAssigned, isSelected, onSelect, onOpen }) {
  return (
    <article className={`personnel-scope-office-card${isSelected ? ' is-selected' : ''}`}>
      <div className="personnel-scope-office-card-head">
        <div className="personnel-scope-office-card-ident">
          <span className="personnel-scope-office-card-icon">
            <BuildingIcon />
          </span>
          <div className="personnel-scope-office-card-title-row">
            <strong>{office.name}</strong>
            {isAssigned ? <span className="personnel-scope-inline-pill">Assigned office</span> : null}
          </div>
          <p>{office.type} • Updated {formatModuleRelativeTime(office.updatedAt)}</p>
        </div>
        <StatusPill status={office.status} />
      </div>

      <p className="personnel-scope-office-card-description">{office.description}</p>

      <div className="personnel-scope-chip-row">
        <span className="personnel-scope-chip is-soft">{office.municipality}</span>
        <span className="personnel-scope-chip is-soft">{office.officeHours}</span>
      </div>

      <div className="personnel-scope-card-stats">
        <div className="personnel-scope-card-stat">
          <small>Programs</small>
          <strong>{office.programsAssigned}</strong>
        </div>
        <div className="personnel-scope-card-stat">
          <small>Applications</small>
          <strong>{office.applicationsReceived}</strong>
        </div>
        <div className="personnel-scope-card-stat">
          <small>Staff</small>
          <strong>{office.personnelAssigned}</strong>
        </div>
      </div>

      <div className="personnel-scope-card-contact">
        <span>{office.address}</span>
        <span>{office.contactNumber}</span>
        <span>{office.emailAddress}</span>
      </div>

      <div className="personnel-scope-card-actions">
        <button className="personnel-scope-card-button" onClick={onSelect} type="button">
          {isSelected ? 'Pinned office' : 'Pin office'}
        </button>
        <button className="personnel-scope-card-button is-primary" onClick={onOpen} type="button">
          Open pinned view
        </button>
      </div>
    </article>
  );
}

function BarangayOfficeWorkspace({ scope, session }) {
  const assignedOffice = scope.assignedOffice;
  const assignedMunicipalityName = scope.municipality?.name || session.municipality || '';
  const assignedBarangayName = session.barangay || assignedOffice?.barangay || '';
  const staffRole = getStaffRoleKey(session);
  const canCreateOffice = staffRole === 'barangay_captain';
  const [records, setRecords] = useState({ municipalities: [], offices: [], barangays: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [officeFormOpen, setOfficeFormOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [officeForm, setOfficeForm] = useState(() => createOfficeForm());

  const loadRecords = async () => {
    setIsLoading(true);
    setError('');

    try {
      setRecords(await listOfficeManagementRecords());
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load barangay offices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const municipalityRecord = records.municipalities.find(
    (municipality) => municipality.municipalityName === assignedMunicipalityName || municipality.name === assignedMunicipalityName
  ) || null;
  const barangayRecord = records.barangays.find((barangay) => (
    (municipalityRecord ? barangay.municipalityId === municipalityRecord.id : barangay.municipality === assignedMunicipalityName) &&
    (barangay.name === assignedBarangayName || barangay.barangayName === assignedBarangayName)
  )) || null;
  const barangayOffices = records.offices.filter((office) => {
    if (barangayRecord) {
      return office.barangayId === barangayRecord.id;
    }

    return office.municipalityName === assignedMunicipalityName && office.barangayName === assignedBarangayName;
  });
  const query = search.trim().toLowerCase();
  const filteredOffices = barangayOffices.filter((office) => {
    if (statusFilter !== 'all' && office.status !== statusFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      office.officeName,
      office.officeLevelLabel,
      office.address,
      office.contactNumber,
      office.email,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });
  const summaryCards = [
    { label: 'Barangay Offices', value: barangayOffices.length, detail: assignedBarangayName || 'assigned barangay' },
    { label: 'Active Offices', value: barangayOffices.filter((office) => office.status === 'Active').length, detail: 'currently enabled' },
    { label: 'Municipality', value: assignedMunicipalityName || 'Not set', detail: 'assigned scope' },
    { label: 'Barangay', value: assignedBarangayName || 'Not set', detail: 'office scope' },
  ];
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];
  const formStatusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];
  const barangayOptions = [
    { label: assignedBarangayName || 'Assigned barangay', value: barangayRecord?.id || '' },
  ];

  const openOfficeForm = (office = null) => {
    setEditingOffice(office);
    setOfficeForm(createOfficeForm(municipalityRecord?.id || assignedOffice?.municipalityId || '', barangayRecord?.id || assignedOffice?.barangayId || '', office || {}));
    setOfficeFormOpen(true);
  };

  const saveOffice = async () => {
    if (!officeForm.officeName.trim()) {
      setError('Enter the office name before saving.');
      return;
    }

    if (!officeForm.municipalityId || !officeForm.barangayId) {
      setError('This account needs a valid assigned municipality and barangay before creating offices.');
      return;
    }

    const duplicateOffice = records.offices.find((office) => (
      office.id !== editingOffice?.id &&
      office.municipalityId === officeForm.municipalityId &&
      (office.barangayId || '') === (officeForm.barangayId || '') &&
      normalizeComparable(office.officeLevel) === normalizeComparable(officeForm.officeLevel) &&
      normalizeComparable(office.officeName) === normalizeComparable(officeForm.officeName)
    ));

    if (duplicateOffice) {
      setError('This office already exists for the selected barangay. Edit the existing office instead of creating another one.');
      return;
    }

    try {
      if (editingOffice) {
        await updateOfficeRecord(editingOffice.id, officeForm);
      } else {
        await createOfficeRecord(officeForm);
      }
      setOfficeFormOpen(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save office.');
    }
  };

  return (
    <>
      <div className="dashboard-grid management-shell">
        <div className="section-card">
          <ManagementToolbar actions={canCreateOffice ? <ActionButton tone="primary" onClick={() => openOfficeForm()}>Add Office</ActionButton> : null}>
            <SectionHeading
              eyebrow="Barangay workspace"
              title={`${assignedBarangayName || 'Barangay'} offices`}
              text={`Manage offices under ${assignedBarangayName || 'your barangay'} in ${assignedMunicipalityName || 'your assigned municipality'}.`}
            />
          </ManagementToolbar>
          {error ? <div className="pf-auth-error">{error}</div> : null}
          {isLoading ? <EmptyState title="Loading barangay offices" text="Fetching offices linked to your assigned barangay." /> : null}
          <ManagementGrid>
            {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
          </ManagementGrid>
        </div>

        <div className="section-card">
          <ManagementToolbar>
            <SectionHeading
              eyebrow="Office records"
              title="Offices under your barangay"
              text="Only offices linked to your assigned barangay are shown here."
            />
          </ManagementToolbar>

          <ManagementFilterGrid>
            <FormField label="Search" onChange={setSearch} placeholder="Search office, contact, or address" value={search} />
            <SelectField label="Status" onChange={setStatusFilter} options={statusOptions} value={statusFilter} />
          </ManagementFilterGrid>

          {!isLoading && filteredOffices.length ? (
            <ManagementTable compact>
              <thead>
                <tr>
                  <th>Office</th>
                  <th>Level</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffices.map((office) => (
                  <tr key={office.id}>
                    <td>
                      <ManagementCellStack>
                        <strong>{office.officeName}</strong>
                        <small>{office.address || 'No address set'}</small>
                      </ManagementCellStack>
                    </td>
                    <td>{office.officeLevelLabel}</td>
                    <td>
                      <ManagementCellStack>
                        <strong>{office.contactNumber || 'Not set'}</strong>
                        <small>{office.email || 'No email set'}</small>
                      </ManagementCellStack>
                    </td>
                    <td><StatusPill status={office.status} /></td>
                    <td>{formatDate(office.updatedAt || office.createdAt)}</td>
                    <td>
                      <ActionButton compact tone="secondary" style={{ borderRadius: '999px', minWidth: '6.4rem' }} onClick={() => openOfficeForm(office)}>
                        Edit Office
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ManagementTable>
          ) : null}

          {!isLoading && !filteredOffices.length ? (
            <EmptyState
              title="No offices found"
              text={canCreateOffice ? 'Add the first office for this barangay or adjust the filters.' : 'No office records are linked to your assigned barangay yet.'}
            />
          ) : null}
        </div>
      </div>

      {officeFormOpen ? (
        <FormModalShell
          title={editingOffice ? 'Edit office' : 'Add office'}
          onClose={() => setOfficeFormOpen(false)}
          wide
          footer={<ActionButton tone="primary" onClick={saveOffice}>Save Office</ActionButton>}
        >
          <ManagementInlineGrid>
            <FormField label="Office Name" value={officeForm.officeName} onChange={(value) => setOfficeForm({ ...officeForm, officeName: value })} />
            <SelectField label="Office Level" value={officeForm.officeLevel} onChange={(value) => setOfficeForm({ ...officeForm, officeLevel: value })} options={OFFICE_LEVEL_OPTIONS} />
            <SelectField label="Barangay" value={officeForm.barangayId} onChange={(value) => setOfficeForm({ ...officeForm, barangayId: value })} options={barangayOptions} disabled />
            <FormField label="House Number" value={officeForm.houseNumber} onChange={(value) => setOfficeForm({ ...officeForm, houseNumber: value })} />
            <FormField label="Street Name" value={officeForm.streetName} onChange={(value) => setOfficeForm({ ...officeForm, streetName: value })} />
            <FormField label="Subdivision / Area" value={officeForm.subdivisionArea} onChange={(value) => setOfficeForm({ ...officeForm, subdivisionArea: value })} />
            <FormField label="Contact Number" value={officeForm.contactNumber} onChange={(value) => setOfficeForm({ ...officeForm, contactNumber: value })} />
            <FormField label="Email" value={officeForm.email} onChange={(value) => setOfficeForm({ ...officeForm, email: value })} />
            <SelectField label="Status" value={officeForm.status} onChange={(value) => setOfficeForm({ ...officeForm, status: value })} options={formStatusOptions} />
          </ManagementInlineGrid>
        </FormModalShell>
      ) : null}
    </>
  );
}

function MunicipalDirectoryWorkspace({ data, navigate, scope, session }) {
  const [records, setRecords] = useState({ municipalities: [], offices: [], barangays: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    listOfficeManagementRecords()
      .then((nextRecords) => {
        if (isMounted) {
          setRecords(nextRecords);
          setError('');
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setRecords({ municipalities: [], offices: [], barangays: [] });
          setError(loadError?.message || 'Unable to load municipality records.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackMunicipality = scope.municipality || null;
  const assignedMunicipality = useMemo(() => {
    const sessionMunicipality = normalizeComparable(session?.municipality);
    const sessionOffice = normalizeComparable(session?.office);
    const fallbackMunicipalityName = normalizeComparable(fallbackMunicipality?.name);

    return (
      records.municipalities.find((municipality) => normalizeComparable(municipality.municipalityName || municipality.name) === sessionMunicipality) ||
      records.municipalities.find((municipality) => normalizeComparable(municipality.municipalityName || municipality.name) === fallbackMunicipalityName) ||
      records.municipalities.find((municipality) =>
        records.offices.some((office) => {
          const officeName = normalizeComparable(office.officeName || office.name);
          return (
            office.municipalityId === municipality.id &&
            sessionOffice &&
            (officeName === sessionOffice || sessionOffice.includes(officeName) || officeName.includes(sessionOffice))
          );
        })
      ) ||
      null
    );
  }, [fallbackMunicipality, records.municipalities, records.offices, session?.municipality, session?.office]);

  const localMunicipality = assignedMunicipality || fallbackMunicipality;
  const municipalityId = localMunicipality?.id || localMunicipality?.municipalityId || '';
  const municipalityName = localMunicipality?.municipalityName || localMunicipality?.name || session?.municipality || '';
  const municipalityBarangays = useMemo(() => {
    if (municipalityId) {
      return records.barangays.filter((barangay) => barangay.municipalityId === municipalityId);
    }

    return (data.barangays || []).filter((barangay) => normalizeComparable(barangay.municipality) === normalizeComparable(municipalityName));
  }, [data.barangays, municipalityId, municipalityName, records.barangays]);

  const municipalityOffices = useMemo(() => {
    if (municipalityId) {
      return records.offices.filter((office) => office.municipalityId === municipalityId);
    }

    return scope.officesInMunicipality || [];
  }, [municipalityId, records.offices, scope.officesInMunicipality]);

  const officesByBarangay = useMemo(
    () =>
      municipalityBarangays.map((barangay) => ({
        barangay,
        offices: municipalityOffices.filter((office) => office.barangayId === barangay.id || normalizeComparable(office.barangayName || office.barangay) === normalizeComparable(barangay.name || barangay.barangayName)),
      })),
    [municipalityBarangays, municipalityOffices]
  );
  const municipalityWideOffices = municipalityOffices.filter((office) => !office.barangayId);
  const summaryCards = [
    { label: 'Municipality', value: municipalityName || 'Not assigned', detail: localMunicipality?.provinceName || localMunicipality?.province || 'Bulacan' },
    { label: 'Barangays', value: municipalityBarangays.length, detail: 'under your municipality' },
    { label: 'Offices', value: municipalityOffices.length, detail: 'visible in your scope' },
    { label: 'Active Offices', value: municipalityOffices.filter((office) => office.status === 'Active').length, detail: 'currently enabled' },
  ];

  if (isLoading) {
    return (
      <div className="section-card">
        <EmptyState title="Loading municipality" text="Fetching barangays and offices under your assigned municipality." />
      </div>
    );
  }

  if (!localMunicipality) {
    return (
      <div className="section-card">
        <SectionHeading
          eyebrow="Municipality management"
          title="No municipality assigned"
          text="This municipal account has no linked municipal office in profiles.office_id, so the app cannot determine which municipality's barangays to show."
        />
        {error ? <div className="pf-auth-error">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="dashboard-grid management-shell">
      <div className="section-card">
        <ManagementToolbar
          actions={municipalityId ? (
            <ActionButton tone="primary" onClick={() => navigate(`/personnel/view-municipality/${municipalityId}`)}>
              View Municipality
            </ActionButton>
          ) : null}
        >
          <SectionHeading
            eyebrow="Municipality management"
            title={`${municipalityName} municipality`}
            text="Review barangays and linked offices under your assigned municipality. Open a barangay to add or edit its offices."
          />
        </ManagementToolbar>
        {error ? <div className="pf-auth-error">{error}</div> : null}
        <ManagementGrid>
          {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
        </ManagementGrid>
      </div>

      <div className="section-card">
        <ManagementToolbar
          actions={municipalityId ? (
            <ActionButton tone="secondary" onClick={() => navigate(getOfficesPath(municipalityId, 'municipality-wide'))}>
              View Municipal Offices
            </ActionButton>
          ) : null}
        >
          <SectionHeading
            eyebrow="Barangays and offices"
            title="Municipality structure"
            text="Barangays are listed with their linked offices so the municipality team can manage local offices at a lower scope."
          />
        </ManagementToolbar>

        {municipalityBarangays.length || municipalityWideOffices.length ? (
          <ManagementTable compact>
            <thead>
              <tr>
                <th>Barangay / Scope</th>
                <th>Linked Offices</th>
                <th>Office Count</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {municipalityWideOffices.length ? (
                <tr>
                  <td>
                    <ManagementCellStack>
                      <strong>Municipality-wide</strong>
                      <small>Offices not assigned to a barangay</small>
                    </ManagementCellStack>
                  </td>
                  <td>
                    <ManagementCellStack>
                      <strong>{municipalityWideOffices.length} linked office{municipalityWideOffices.length === 1 ? '' : 's'}</strong>
                      <small>Open this scope to review individual office records.</small>
                    </ManagementCellStack>
                  </td>
                  <td>{municipalityWideOffices.length}</td>
                  <td><StatusPill status="Active" /></td>
                  <td>-</td>
                  <td>
                    <ActionButton compact tone="primary" onClick={() => navigate(getOfficesPath(municipalityId, 'municipality-wide'))}>
                      View Offices
                    </ActionButton>
                  </td>
                </tr>
              ) : null}
              {officesByBarangay.map(({ barangay, offices }) => (
                <tr key={barangay.id}>
                  <td>
                    <ManagementCellStack>
                      <strong>{barangay.name || barangay.barangayName}</strong>
                      <small>{offices.length ? `${offices.length} linked office${offices.length === 1 ? '' : 's'}` : 'No linked offices yet'}</small>
                    </ManagementCellStack>
                  </td>
                  <td>
                    <ManagementCellStack>
                      <strong>{offices.length ? `${offices.length} linked office${offices.length === 1 ? '' : 's'}` : 'No offices linked'}</strong>
                      <small>Open this barangay to add, edit, or review offices.</small>
                    </ManagementCellStack>
                  </td>
                  <td>{offices.length}</td>
                  <td><StatusPill status={barangay.status || 'Active'} /></td>
                  <td>{formatDate(barangay.createdAt || barangay.created_at)}</td>
                  <td>
                    <ActionButton compact tone="primary" onClick={() => navigate(getOfficesPath(municipalityId, barangay.id))}>
                      View Offices
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </ManagementTable>
        ) : (
          <EmptyState title="No barangays found" text="No barangay records are linked to this municipality yet." />
        )}
      </div>
    </div>
  );
}

export default function MunicipalityWorkspaceScreen({ data, navigate, session }) {
  const moduleData = buildMunicipalityModuleData(data);
  const scope = getPersonnelScope(moduleData, session);
  const municipality = scope.municipality;
  const assignedOffice = scope.assignedOffice;
  const staffRole = getStaffRoleKey(session);

  const offices = [...scope.officesInMunicipality].sort((left, right) => {
    if (left.id === assignedOffice?.id) {
      return -1;
    }

    if (right.id === assignedOffice?.id) {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });

  const officeTypeOptions = [
    { label: 'All office types', value: 'all' },
    ...[...new Set(offices.map((office) => office.type).filter(Boolean))].map((type) => ({
      label: type,
      value: type,
    })),
  ];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openModal, setOpenModal] = useState(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState(assignedOffice?.id || offices[0]?.id || '');
  const [activeInnerTab, setActiveInnerTab] = useState('browser');

  useEffect(() => {
    if (!offices.length) {
      return;
    }

    if (!offices.some((office) => office.id === selectedOfficeId)) {
      setSelectedOfficeId(assignedOffice?.id || offices[0].id);
    }
  }, [assignedOffice?.id, offices, selectedOfficeId]);

  useEffect(() => {
    if (!openModal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenModal(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openModal]);

  if (staffRole === 'barangay_captain' || staffRole === 'barangay_secretary') {
    return <BarangayOfficeWorkspace scope={scope} session={session} />;
  }

  if (staffRole === 'municipal_mayor' || staffRole === 'municipal_secretary') {
    return <MunicipalDirectoryWorkspace data={data} navigate={navigate} scope={scope} session={session} />;
  }

  if (!municipality) {
    return (
      <div className="section-card">
        <EmptyState
          title="No municipality assigned"
          text="This personnel account does not have an assigned municipality yet. Assign a municipality from the captain workspace first."
        />
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredOffices = offices.filter((office) => {
    if (statusFilter !== 'all' && office.status !== statusFilter) {
      return false;
    }

    if (typeFilter !== 'all' && office.type !== typeFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [office.name, office.type, office.address, office.contactNumber, office.emailAddress].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );
  });

  const selectedOffice = filteredOffices.length
    ? filteredOffices.find((office) => office.id === selectedOfficeId) || filteredOffices[0]
    : null;

  const scopeMetrics = [
    {
      label: 'Assigned Municipality',
      value: municipality.name,
      detail: municipality.province,
    },
    {
      label: 'Assigned Office',
      value: assignedOffice?.name || 'Municipality-wide',
      detail: assignedOffice?.type || 'Municipality scope only',
    },
    {
      label: 'Visible Offices',
      value: offices.length,
      detail: `${offices.filter((office) => office.status === 'Active').length} active offices`,
    },
    {
      label: 'Programs in Scope',
      value: scope.programsInMunicipality,
      detail: `${municipality.totalApplications} linked applications`,
    },
  ];
  const currentAccessLabel = scope.assignment?.assignedOffice || assignedOffice?.name || 'Municipality-wide';
  const activeOfficeCount = offices.filter((office) => office.status === 'Active').length;
  const selectedOfficeActivity = selectedOffice?.recentActivity || [];
  const selectedOfficeSummary = (selectedOffice?.applicationSummary || []).filter((item) => item.count > 0);
  const selectedOfficeProgramsPreview = selectedOffice?.programsHandled.slice(0, 4) || [];
  const selectedOfficePersonnelPreview = selectedOffice?.assignedPersonnel.slice(0, 4) || [];
  const municipalityOfficePreview = municipality.offices.slice(0, 6);
  const municipalityProgramPreview = municipality.linkedPrograms.slice(0, 6);
  const activeFilterCount = Number(Boolean(query)) + Number(statusFilter !== 'all') + Number(typeFilter !== 'all');
  const municipalityActivePrograms = municipality.linkedPrograms.filter((program) =>
    ['Open', 'Upcoming'].includes(program.status)
  ).length;
  const innerTabs = INNER_TAB_OPTIONS.map((tab) => ({
    ...tab,
    note:
      tab.key === 'browser'
        ? `${filteredOffices.length} visible`
        : tab.key === 'pinned'
          ? selectedOffice?.name || 'No office selected'
          : tab.key === 'municipality'
            ? `${municipality.officesCount} offices tracked`
            : currentAccessLabel,
  }));

  return (
    <>
      <style>{`
        .personnel-scope-shell,
        .personnel-scope-metrics,
        .personnel-scope-summary,
        .personnel-scope-toolbar,
        .personnel-scope-table,
        .personnel-scope-activity-list,
        .personnel-scope-modal-grid {
          display:grid;
          gap:1rem;
        }
        .personnel-scope-summary {
          grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);
        }
        .personnel-scope-summary-card,
        .personnel-scope-metric,
        .personnel-scope-assignment,
        .personnel-scope-table-row,
        .personnel-scope-activity-card,
        .personnel-scope-note {
          padding:1rem 1.05rem;
          border-radius:22px;
          border:1px solid rgba(24,111,67,.08);
          background:rgba(255,255,255,.95);
          box-shadow:var(--pf-shadow-sm);
        }
        .personnel-scope-summary-card,
        .personnel-scope-assignment {
          display:grid;
          gap:1rem;
          background:linear-gradient(180deg, rgba(248,251,247,.98) 0%, rgba(239,244,238,.95) 100%);
        }
        .personnel-scope-summary-card {
          align-content:space-between;
        }
        .personnel-scope-summary-actions,
        .personnel-scope-chip-row,
        .personnel-scope-table-head,
        .personnel-scope-table-row,
        .personnel-scope-activity-head {
          display:flex;
          gap:.8rem;
        }
        .personnel-scope-summary-actions {
          flex-wrap:wrap;
        }
        .personnel-scope-chip-row {
          flex-wrap:wrap;
        }
        .personnel-scope-chip {
          display:inline-flex;
          align-items:center;
          gap:.35rem;
          padding:.55rem .85rem;
          border-radius:999px;
          background:rgba(22,89,177,.09);
          color:var(--pf-accent-dark);
          font-size: 1.375rem;
          font-weight:800;
        }
        .personnel-scope-metrics {
          grid-template-columns:repeat(4,minmax(0,1fr));
        }
        .personnel-scope-metric {
          display:grid;
          gap:.2rem;
          background:
            radial-gradient(circle at top right, rgba(244,197,66,.18), transparent 36%),
            linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(240,245,239,.95) 100%);
        }
        .personnel-scope-metric small,
        .personnel-scope-assignment p,
        .personnel-scope-table-row p,
        .personnel-scope-table-row small,
        .personnel-scope-table-head,
        .personnel-scope-activity-card p,
        .personnel-scope-modal-header p,
        .personnel-scope-note p {
          color:var(--pf-ink-muted);
        }
        .personnel-scope-metric strong {
          font-family:var(--pf-font-display);
          font-size: 1.375rem;
          line-height:1.05;
        }
        .personnel-scope-metric span {
          font-weight:700;
          color:var(--pf-ink-soft);
        }
        .personnel-scope-note {
          background:rgba(22,89,177,.06);
        }
        .personnel-scope-note strong {
          display:block;
          margin-bottom:.25rem;
        }
        .personnel-scope-toolbar {
          grid-template-columns:minmax(0,1.2fr) repeat(2,minmax(180px,.4fr));
        }
        .personnel-scope-table {
          gap:.85rem;
        }
        .personnel-scope-table-head,
        .personnel-scope-table-row {
          display:grid;
          grid-template-columns:minmax(0,1.5fr) minmax(150px,.8fr) minmax(190px,1fr) minmax(120px,.65fr) 120px 96px;
          align-items:start;
          gap:1rem;
        }
        .personnel-scope-table-head {
          padding:0 .35rem;
          font-size: 1.375rem;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .personnel-scope-table-row {
          background:linear-gradient(180deg, rgba(248,251,247,.98) 0%, rgba(239,244,238,.94) 100%);
        }
        .personnel-scope-table-row strong,
        .personnel-scope-activity-card strong {
          display:block;
          margin-bottom:.2rem;
        }
        .personnel-scope-table-row p,
        .personnel-scope-table-row small,
        .personnel-scope-activity-card p,
        .personnel-scope-activity-card small {
          margin:0;
          line-height:1.5;
        }
        .personnel-scope-table-actions {
          display:flex;
          justify-content:flex-end;
        }
        .personnel-scope-inline-pill {
          display:inline-flex;
          align-items:center;
          margin-top:0;
          padding:.28rem .65rem;
          border-radius:999px;
          background:rgba(22,89,177,.12);
          color:var(--pf-accent-dark);
          font-size: 1.375rem;
          font-weight:800;
        }
        .personnel-scope-hero,
        .personnel-scope-main,
        .personnel-scope-bottom,
        .personnel-scope-office-grid,
        .personnel-scope-glance-grid,
        .personnel-scope-preview-grid,
        .personnel-scope-card-stats,
        .personnel-scope-subsection {
          display:grid;
          gap:1rem;
        }
        .personnel-scope-hero {
          grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);
          padding:0;
          overflow:hidden;
          background:
            radial-gradient(circle at top right, rgba(198,59,61,.22), transparent 30%),
            radial-gradient(circle at bottom left, rgba(116,209,154,.14), transparent 34%),
            linear-gradient(135deg, #0b1f17 0%, #133126 54%, #1c6944 100%);
          border:1px solid rgba(24,111,67,.16);
          box-shadow:0 22px 54px rgba(8,33,23,.22);
        }
        .personnel-scope-hero-copy,
        .personnel-scope-hero-side {
          display:grid;
          gap:1rem;
          padding:1.45rem 1.5rem;
          position:relative;
          z-index:1;
        }
        .personnel-scope-hero-copy {
          align-content:space-between;
        }
        .personnel-scope-hero-side {
          align-content:start;
          background:linear-gradient(180deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.08) 100%);
          border-left:1px solid rgba(255,255,255,.08);
          backdrop-filter:blur(10px);
        }
        .personnel-scope-hero-eyebrow,
        .personnel-scope-section-eyebrow {
          margin:0;
          font-size: 1.375rem;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .personnel-scope-hero-eyebrow {
          color:#ff9c9c;
        }
        .personnel-scope-section-eyebrow {
          color:var(--pf-accent-dark);
        }
        .personnel-scope-hero-title,
        .personnel-scope-section-title {
          margin:0;
          font-family:var(--pf-font-display);
          letter-spacing:-.04em;
          line-height:1.02;
        }
        .personnel-scope-hero-title {
          color:#fff;
          font-size:clamp(2rem,4vw,3rem);
        }
        .personnel-scope-section-title {
          color:var(--pf-ink);
          font-size: 1.375rem;
        }
        .personnel-scope-hero-text,
        .personnel-scope-section-text,
        .personnel-scope-hero-side-text,
        .personnel-scope-card-contact {
          margin:0;
          line-height:1.6;
        }
        .personnel-scope-hero-text,
        .personnel-scope-hero-side-text {
          color:rgba(243,255,247,.76);
        }
        .personnel-scope-section-text,
        .personnel-scope-card-contact {
          color:var(--pf-ink-muted);
        }
        .personnel-scope-hero .personnel-scope-chip {
          border:1px solid rgba(255,255,255,.12);
          background:rgba(255,255,255,.1);
          color:#f3fff7;
        }
        .personnel-scope-chip.is-soft {
          border:1px solid rgba(24,111,67,.1);
          background:rgba(22,89,177,.08);
          color:var(--pf-accent-dark);
        }
        .personnel-scope-hero-actions,
        .personnel-scope-card-actions,
        .personnel-scope-panel-head,
        .personnel-scope-subtitle-row,
        .personnel-scope-office-card-head,
        .personnel-scope-office-card-title-row {
          display:flex;
          gap:.75rem;
        }
        .personnel-scope-hero-actions,
        .personnel-scope-card-actions {
          flex-wrap:wrap;
        }
        .personnel-scope-panel-head,
        .personnel-scope-subtitle-row,
        .personnel-scope-office-card-head {
          justify-content:space-between;
          align-items:flex-start;
        }
        .personnel-scope-office-card-title-row {
          align-items:center;
          flex-wrap:wrap;
        }
        .personnel-scope-hero-button,
        .personnel-scope-card-button {
          font-weight:800;
        }
        .personnel-scope-hero-button {
          padding:.82rem 1rem;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.16);
          background:rgba(255,255,255,.12);
          color:#fff;
        }
        .personnel-scope-hero-button.is-secondary {
          background:rgba(255,255,255,.05);
        }
        .personnel-scope-hero-side-label {
          margin:0;
          font-size: 1.375rem;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#ff9c9c;
        }
        .personnel-scope-hero-side-title {
          margin:0;
          color:#fff;
          font-family:var(--pf-font-display);
          font-size:1.8rem;
          line-height:1;
        }
        .personnel-scope-hero-side-grid {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:.8rem;
        }
        .personnel-scope-hero-side-item,
        .personnel-scope-card-stat,
        .personnel-scope-glance-card {
          display:grid;
          gap:.24rem;
          padding:.8rem .9rem;
          border-radius:18px;
          border:1px solid rgba(24,111,67,.08);
          background:rgba(255,255,255,.82);
        }
        .personnel-scope-hero-side-item {
          background:rgba(255,255,255,.08);
          border-color:rgba(255,255,255,.08);
          box-shadow:none;
        }
        .personnel-scope-hero-side-item small,
        .personnel-scope-card-stat small,
        .personnel-scope-glance-card small {
          font-size: 1.375rem;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .personnel-scope-hero-side-item small {
          color:rgba(243,255,247,.65);
        }
        .personnel-scope-card-stat small,
        .personnel-scope-glance-card small {
          color:var(--pf-ink-muted);
        }
        .personnel-scope-hero-side-item strong,
        .personnel-scope-card-stat strong,
        .personnel-scope-glance-card strong {
          font-family:var(--pf-font-display);
          line-height:1.02;
        }
        .personnel-scope-hero-side-item strong {
          color:#fff;
          font-size: 1.375rem;
        }
        .personnel-scope-card-stat strong,
        .personnel-scope-glance-card strong {
          color:var(--pf-ink);
          font-size: 1.375rem;
        }
        .personnel-scope-main {
          grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);
        }
        .personnel-scope-bottom {
          grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);
        }
        .personnel-scope-count-pill {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:.65rem .95rem;
          border-radius:999px;
          background:rgba(22,89,177,.08);
          color:var(--pf-accent-dark);
          font-size: 1.375rem;
          font-weight:800;
          white-space:nowrap;
        }
        .personnel-scope-office-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
        .personnel-scope-office-card {
          display:grid;
          gap:.9rem;
          background:linear-gradient(180deg, rgba(248,251,247,.98) 0%, rgba(239,244,238,.94) 100%);
        }
        .personnel-scope-office-card.is-selected {
          border-color:rgba(24,111,67,.22);
          box-shadow:0 18px 34px rgba(12,44,28,.1);
        }
        .personnel-scope-card-stats {
          grid-template-columns:repeat(3,minmax(0,1fr));
        }
        .personnel-scope-card-button {
          flex:1 1 9rem;
          padding:.8rem .95rem;
          border-radius:16px;
          border:1px solid rgba(24,111,67,.12);
          background:rgba(255,255,255,.86);
          color:var(--accent-deep);
        }
        .personnel-scope-card-button.is-primary {
          background:linear-gradient(135deg, var(--pf-accent) 0%, var(--pf-accent-dark) 100%);
          border-color:transparent;
          color:#fff;
        }
        .personnel-scope-preview-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
        .personnel-scope-modal-backdrop {
          position:fixed;
          inset:0;
          z-index:85;
          display:grid;
          place-items:center;
          padding:1.25rem;
          background:rgba(10,20,15,.5);
          backdrop-filter:blur(10px);
        }
        .personnel-scope-modal {
          width:min(100%,60rem);
          max-height:min(92vh,60rem);
          overflow:auto;
          border-radius:28px;
          background:linear-gradient(180deg, rgba(252,253,251,.99) 0%, rgba(240,245,239,.98) 100%);
          border:1px solid rgba(18,32,25,.08);
          box-shadow:0 28px 90px rgba(10,20,15,.22);
        }
        .personnel-scope-modal-header {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:1rem;
          padding:1.2rem 1.35rem;
          border-bottom:1px solid rgba(18,32,25,.08);
        }
        .personnel-scope-modal-header strong {
          font-size: 1.375rem;
        }
        .personnel-scope-modal-close {
          padding:.65rem .9rem;
          border-radius:12px;
          border:1px solid rgba(18,32,25,.08);
          background:#fff;
          font-weight:700;
        }
        .personnel-scope-modal-body {
          display:grid;
          gap:1rem;
          padding:1.25rem 1.35rem 1.35rem;
        }
        .personnel-scope-modal-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
        .personnel-scope-activity-head {
          justify-content:space-between;
          align-items:flex-start;
        }
        @media (max-width:1180px) {
          .personnel-scope-hero,
          .personnel-scope-main,
          .personnel-scope-bottom,
          .personnel-scope-metrics,
          .personnel-scope-toolbar,
          .personnel-scope-office-grid,
          .personnel-scope-modal-grid {
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .personnel-scope-hero {
            grid-template-columns:1fr;
          }
          .personnel-scope-main,
          .personnel-scope-bottom {
            grid-template-columns:1fr;
          }
        }
        @media (max-width:820px) {
          .personnel-scope-hero,
          .personnel-scope-main,
          .personnel-scope-bottom,
          .personnel-scope-metrics,
          .personnel-scope-toolbar,
          .personnel-scope-office-grid,
          .personnel-scope-glance-grid,
          .personnel-scope-preview-grid,
          .personnel-scope-modal-grid,
          .personnel-scope-hero-side-grid,
          .personnel-scope-card-stats {
            grid-template-columns:1fr;
          }
          .personnel-scope-modal-backdrop {
            padding:.75rem;
          }
          .personnel-scope-modal-header {
            flex-direction:column;
            align-items:stretch;
          }
          .personnel-scope-hero-side {
            border-left:none;
            border-top:1px solid rgba(255,255,255,.08);
          }
        }
        .personnel-scope-shell {
          gap:1.15rem;
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero,
        .personnel-scope-hero {
          position:relative;
          isolation:isolate;
          border-radius:28px;
          background:
            radial-gradient(circle at top right, rgba(198,59,61,.22), transparent 30%),
            radial-gradient(circle at bottom left, rgba(116,209,154,.14), transparent 34%),
            linear-gradient(135deg, #0b1f17 0%, #133126 54%, #1c6944 100%);
          border:1px solid rgba(24,111,67,.16);
          box-shadow:0 22px 54px rgba(8,33,23,.22);
        }
        .personnel-scope-hero::after {
          content:'';
          position:absolute;
          inset:0;
          background:
            linear-gradient(120deg, rgba(255,255,255,.04), transparent 36%),
            radial-gradient(circle at top right, rgba(255,255,255,.14), transparent 34%);
          pointer-events:none;
        }
        .personnel-scope-hero > * {
          position:relative;
          z-index:1;
        }
        .personnel-scope-metric,
        .personnel-scope-office-card,
        .personnel-scope-glance-card,
        .personnel-scope-note,
        .personnel-scope-activity-card,
        .personnel-scope-detail-grid .detail-item {
          box-shadow:0 14px 32px rgba(10,33,22,.07);
        }
        .personnel-scope-metric {
          min-height:136px;
          align-content:start;
        }
        .dashboard-shell-staff .section-card.personnel-scope-spotlight,
        .personnel-scope-spotlight {
          background:
            radial-gradient(circle at top right, rgba(244,197,66,.16), transparent 28%),
            linear-gradient(180deg, rgba(249,252,248,.99) 0%, rgba(239,245,239,.96) 100%);
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-eyebrow,
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side-label {
          color:#ff9c9c;
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-title,
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side-title {
          color:#fff;
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-text,
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side-text,
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side-item small {
          color:rgba(243,255,247,.76);
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-chip {
          border:1px solid rgba(255,255,255,.12);
          background:rgba(255,255,255,.1);
          color:#f3fff7;
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-button {
          border:1px solid rgba(255,255,255,.16);
          background:rgba(255,255,255,.12);
          color:#fff;
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-button.is-secondary {
          background:rgba(255,255,255,.05);
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side {
          background:linear-gradient(180deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.08) 100%);
          border-left:1px solid rgba(255,255,255,.08);
          backdrop-filter:blur(10px);
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side-item {
          background:rgba(255,255,255,.08);
          border-color:rgba(255,255,255,.08);
          box-shadow:none;
        }
        .dashboard-shell-staff .section-card.personnel-scope-hero .personnel-scope-hero-side-item strong {
          color:#fff;
        }
        .personnel-scope-main {
          grid-template-columns:minmax(0,1.22fr) minmax(340px,.78fr);
          align-items:start;
        }
        .personnel-scope-bottom {
          align-items:start;
        }
        .personnel-scope-tab-shell {
          display:grid;
          gap:1rem;
        }
        .personnel-scope-tab-row {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:.8rem;
        }
        .personnel-scope-tab-button {
          display:grid;
          gap:.28rem;
          padding:1rem 1.05rem;
          border-radius:20px;
          border:1px solid rgba(24,111,67,.1);
          background:rgba(255,255,255,.82);
          text-align:left;
          transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
        }
        .personnel-scope-tab-button strong {
          color:var(--pf-ink);
          font-size: 1.375rem;
          line-height:1.2;
        }
        .personnel-scope-tab-button span {
          color:var(--pf-ink-muted);
          font-size: 1.375rem;
          line-height:1.45;
        }
        .personnel-scope-tab-button:hover {
          transform:translateY(-1px);
          box-shadow:0 12px 24px rgba(10,33,22,.08);
        }
        .personnel-scope-tab-button.is-active {
          border-color:rgba(24,111,67,.2);
          background:
            radial-gradient(circle at top right, rgba(244,197,66,.18), transparent 36%),
            linear-gradient(180deg, rgba(248,251,247,.98) 0%, rgba(235,244,236,.96) 100%);
          box-shadow:0 16px 34px rgba(10,33,22,.1);
        }
        .personnel-scope-tab-button.is-active strong {
          color:var(--pf-accent-dark);
        }
        .personnel-scope-tab-button.is-active span {
          color:var(--pf-ink-soft);
        }
        .personnel-scope-tab-panel {
          display:grid;
          gap:1rem;
        }
        .personnel-scope-tab-card {
          display:grid;
          gap:1rem;
          padding:1.1rem;
          border-radius:24px;
          border:1px solid rgba(24,111,67,.08);
          background:rgba(255,255,255,.72);
        }
        .personnel-scope-tab-card.personnel-scope-spotlight {
          position:static;
          top:auto;
        }
        .personnel-scope-toolbar-shell {
          display:grid;
          gap:.85rem;
          padding:1rem 1.05rem;
          border-radius:24px;
          border:1px solid rgba(24,111,67,.1);
          background:
            radial-gradient(circle at top right, rgba(244,197,66,.14), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(242,247,241,.96) 100%);
        }
        .personnel-scope-toolbar {
          grid-template-columns:minmax(0,1.45fr) repeat(2,minmax(180px,.48fr));
          align-items:end;
          gap:.85rem;
        }
        .personnel-scope-control {
          display:grid;
          gap:.4rem;
        }
        .personnel-scope-control-label {
          font-size: 1.375rem;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:var(--pf-ink-muted);
        }
        .personnel-scope-search-shell,
        .personnel-scope-select-shell {
          position:relative;
          display:flex;
          align-items:center;
          min-height:54px;
          border-radius:18px;
          border:1px solid rgba(24,111,67,.1);
          background:rgba(255,255,255,.92);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.7);
        }
        .personnel-scope-search-shell:focus-within,
        .personnel-scope-select-shell:focus-within {
          border-color:rgba(24,111,67,.22);
          box-shadow:0 0 0 4px rgba(22,89,177,.08);
        }
        .personnel-scope-search-icon,
        .personnel-scope-select-icon {
          display:grid;
          place-items:center;
          width:42px;
          color:var(--pf-accent-dark);
          opacity:.7;
          pointer-events:none;
          flex-shrink:0;
        }
        .personnel-scope-search-icon svg,
        .personnel-scope-select-icon svg,
        .personnel-scope-office-card-icon svg,
        .personnel-scope-spotlight-mark svg {
          width:18px;
          height:18px;
        }
        .personnel-scope-control-input,
        .personnel-scope-control-select {
          width:100%;
          min-height:54px;
          border:none;
          outline:none;
          background:transparent;
          color:var(--pf-ink);
          font:inherit;
        }
        .personnel-scope-control-input {
          padding:0 1rem 0 .1rem;
        }
        .personnel-scope-control-select {
          appearance:none;
          padding:0 2.7rem 0 1rem;
        }
        .personnel-scope-clear-button {
          min-height:54px;
          padding:0 1rem;
          border-radius:18px;
          border:1px solid rgba(24,111,67,.12);
          background:rgba(22,89,177,.08);
          color:var(--pf-accent-dark);
          font-weight:800;
        }
        .personnel-scope-toolbar-foot {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:.8rem;
          flex-wrap:wrap;
        }
        .personnel-scope-toolbar-foot-actions {
          display:flex;
          align-items:center;
          gap:.75rem;
          flex-wrap:wrap;
          justify-content:flex-end;
        }
        .personnel-scope-toolbar-foot p {
          margin:0;
          color:var(--pf-ink-muted);
          line-height:1.55;
        }
        .personnel-scope-toolbar-badge {
          display:inline-flex;
          align-items:center;
          padding:.55rem .85rem;
          border-radius:999px;
          background:rgba(22,89,177,.1);
          color:var(--pf-accent-dark);
          font-size: 1.375rem;
          font-weight:800;
          letter-spacing:.04em;
          text-transform:uppercase;
        }
        .personnel-scope-office-grid {
          gap:1rem;
        }
        .personnel-scope-office-card {
          padding:1.1rem 1.1rem 1rem;
          border-radius:24px;
          transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .personnel-scope-office-card:hover {
          transform:translateY(-2px);
          box-shadow:0 18px 40px rgba(10,33,22,.1);
        }
        .personnel-scope-office-card.is-selected {
          border-color:rgba(24,111,67,.22);
          box-shadow:0 20px 44px rgba(10,33,22,.12);
          background:
            radial-gradient(circle at top right, rgba(244,197,66,.18), transparent 35%),
            linear-gradient(180deg, rgba(248,251,247,.98) 0%, rgba(236,244,236,.96) 100%);
        }
        .personnel-scope-office-card-ident {
          display:grid;
          grid-template-columns:auto 1fr;
          gap:.75rem;
          align-items:start;
        }
        .personnel-scope-office-card-icon,
        .personnel-scope-spotlight-mark {
          display:grid;
          place-items:center;
          width:40px;
          height:40px;
          border-radius:14px;
          background:rgba(22,89,177,.1);
          color:var(--pf-accent-dark);
          flex-shrink:0;
        }
        .personnel-scope-office-card-description {
          margin:0;
          color:var(--pf-ink-soft);
          line-height:1.58;
        }
        .personnel-scope-card-contact {
          display:grid;
          gap:.25rem;
          font-size: 1.375rem;
        }
        .personnel-scope-card-button {
          min-height:48px;
          border-radius:16px;
        }
        .personnel-scope-spotlight {
          position:sticky;
          top:1rem;
          align-self:start;
          gap:1rem;
        }
        .personnel-scope-spotlight-head,
        .personnel-scope-spotlight-copy {
          display:flex;
          gap:.9rem;
        }
        .personnel-scope-spotlight-head {
          align-items:flex-start;
          justify-content:space-between;
        }
        .personnel-scope-spotlight-copy {
          flex:1;
          min-width:0;
        }
        .personnel-scope-spotlight-panel {
          display:grid;
          gap:.85rem;
          padding:1rem;
          border-radius:20px;
          border:1px solid rgba(24,111,67,.08);
          background:rgba(255,255,255,.82);
        }
        .personnel-scope-spotlight-stack {
          display:grid;
          gap:.85rem;
        }
        .personnel-scope-detail-grid {
          gap:.85rem;
        }
        .personnel-scope-detail-grid .detail-item {
          background:rgba(255,255,255,.82);
          border:1px solid rgba(24,111,67,.08);
        }
        .personnel-scope-summary-bars {
          display:grid;
          gap:.75rem;
        }
        .personnel-scope-summary-row {
          display:grid;
          gap:.35rem;
        }
        .personnel-scope-summary-copy {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:.75rem;
          font-size: 1.375rem;
        }
        .personnel-scope-summary-copy strong {
          color:var(--pf-ink);
        }
        .personnel-scope-summary-copy span {
          color:var(--pf-ink-muted);
        }
        .personnel-scope-summary-track {
          height:9px;
          border-radius:999px;
          background:rgba(18,32,25,.08);
          overflow:hidden;
        }
        .personnel-scope-summary-fill {
          display:block;
          height:100%;
          border-radius:999px;
          background:linear-gradient(90deg, rgba(22,89,177,.42) 0%, rgba(22,89,177,.96) 100%);
        }
        .personnel-scope-activity-list {
          gap:.8rem;
        }
        .personnel-scope-activity-card {
          position:relative;
          padding:1rem 1rem 1rem 1.1rem;
          border-radius:20px;
          background:rgba(255,255,255,.84);
        }
        .personnel-scope-activity-card::before {
          content:'';
          position:absolute;
          left:.9rem;
          top:1.05rem;
          bottom:1.05rem;
          width:2px;
          border-radius:999px;
          background:linear-gradient(180deg, rgba(22,89,177,.28) 0%, rgba(22,89,177,.05) 100%);
        }
        .personnel-scope-activity-card > * {
          position:relative;
          padding-left:1rem;
        }
        .personnel-scope-activity-head small {
          font-weight:700;
        }
        .personnel-scope-count-pill {
          padding:.72rem 1rem;
          border:1px solid rgba(24,111,67,.12);
          background:rgba(22,89,177,.08);
        }
        @media (max-width:1180px) {
          .personnel-scope-tab-row {
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .personnel-scope-toolbar {
            grid-template-columns:minmax(0,1fr) repeat(2,minmax(180px,1fr));
          }
          .personnel-scope-clear-button {
            width:100%;
            justify-content:center;
            text-align:center;
          }
          .personnel-scope-spotlight {
            position:static;
          }
        }
        @media (max-width:820px) {
          .personnel-scope-tab-row {
            grid-template-columns:1fr;
          }
          .personnel-scope-toolbar,
          .personnel-scope-toolbar-shell {
            grid-template-columns:1fr;
          }
          .personnel-scope-office-card-ident {
            grid-template-columns:1fr;
          }
          .personnel-scope-spotlight-head,
          .personnel-scope-spotlight-copy,
          .personnel-scope-summary-copy,
          .personnel-scope-toolbar-foot,
          .personnel-scope-toolbar-foot-actions {
            display:grid;
          }
        }
      `}</style>

      <div className="dashboard-grid personnel-scope-shell">
        <div className="section-card personnel-scope-hero">
          <div className="personnel-scope-hero-copy">
            <div className="personnel-scope-subsection">
              <p className="personnel-scope-hero-eyebrow">Municipality workspace</p>
              <h1 className="personnel-scope-hero-title">{municipality.name}</h1>
              <p className="personnel-scope-hero-text">
                View the offices inside your assigned scope, keep one office pinned for quick review, and open deeper municipality or office records without losing context.
              </p>
            </div>

            <div className="personnel-scope-chip-row">
              <span className="personnel-scope-chip">{municipality.province}</span>
              <span className="personnel-scope-chip">{currentAccessLabel}</span>
              <span className="personnel-scope-chip">{scope.assignment?.role || session.title}</span>
            </div>

            <div className="personnel-scope-hero-actions">
              <button className="personnel-scope-hero-button" onClick={() => setOpenModal('municipality')} type="button">
                View municipality
              </button>
              {selectedOffice ? (
                <button className="personnel-scope-hero-button is-secondary" onClick={() => setOpenModal('office')} type="button">
                  Open selected office
                </button>
              ) : null}
            </div>
          </div>

          <aside className="personnel-scope-hero-side">
            <p className="personnel-scope-hero-side-label">Current access</p>
            <h2 className="personnel-scope-hero-side-title">{currentAccessLabel}</h2>
            <p className="personnel-scope-hero-side-text">{scope.assignment?.role || session.title}</p>

            <div className="personnel-scope-hero-side-grid">
              <article className="personnel-scope-hero-side-item">
                <small>Status</small>
                <strong>{scope.assignment?.status || 'Active'}</strong>
              </article>
              <article className="personnel-scope-hero-side-item">
                <small>Active offices</small>
                <strong>{activeOfficeCount}</strong>
              </article>
              <article className="personnel-scope-hero-side-item">
                <small>Access start</small>
                <strong>{formatModuleDate(scope.assignment?.accessStartDate || scope.assignment?.dateAssigned)}</strong>
              </article>
              <article className="personnel-scope-hero-side-item">
                <small>Access end</small>
                <strong>{formatModuleDate(scope.assignment?.accessEndDate)}</strong>
              </article>
            </div>
          </aside>
        </div>

        <div className="personnel-scope-metrics">
          {scopeMetrics.map((metric) => (
            <ScopeMetric key={metric.label} {...metric} />
          ))}
        </div>

        <div className="section-card personnel-scope-tab-shell">
          <div className="personnel-scope-panel-head">
            <div className="personnel-scope-subsection">
              <p className="personnel-scope-section-eyebrow">Workspace panels</p>
              <h2 className="personnel-scope-section-title">Switch the municipality view</h2>
              <p className="personnel-scope-section-text">
                Use the inner tabs to focus on one workspace panel at a time and keep the municipality page cleaner and easier to scan.
              </p>
            </div>
          </div>

          <div className="personnel-scope-tab-row" role="tablist" aria-label="Municipality workspace sections">
            {innerTabs.map((tab) => (
              <ScopeTabButton
                isActive={activeInnerTab === tab.key}
                key={tab.key}
                label={tab.label}
                note={tab.note}
                onClick={() => setActiveInnerTab(tab.key)}
              />
            ))}
          </div>

          <div className="personnel-scope-tab-panel">
            {activeInnerTab === 'browser' ? (
              <div className="personnel-scope-tab-card">
                <div className="personnel-scope-panel-head">
                  <div className="personnel-scope-subsection">
                    <p className="personnel-scope-section-eyebrow">Office browser</p>
                    <h2 className="personnel-scope-section-title">Explore offices in scope</h2>
                    <p className="personnel-scope-section-text">
                      Search and filter municipality offices, then pin one office for quick review.
                    </p>
                  </div>
                  <span className="personnel-scope-count-pill">{filteredOffices.length} visible</span>
                </div>

                <div className="personnel-scope-toolbar-shell">
                  <div className="personnel-scope-toolbar">
                    <ScopeSearchField
                      label="Search offices"
                      onChange={setSearch}
                      placeholder="Search office name, contact number, address, or email"
                      value={search}
                    />
                    <ScopeSelect label="Status" onChange={setStatusFilter} options={STATUS_OPTIONS} value={statusFilter} />
                    <ScopeSelect label="Office type" onChange={setTypeFilter} options={officeTypeOptions} value={typeFilter} />
                  </div>

                  <div className="personnel-scope-toolbar-foot">
                    <p>
                      Showing {filteredOffices.length} of {offices.length} offices inside {municipality.name}.
                    </p>
                    <div className="personnel-scope-toolbar-foot-actions">
                      {activeFilterCount ? (
                        <button
                          className="personnel-scope-clear-button"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                            setTypeFilter('all');
                          }}
                          type="button"
                        >
                          Clear filters
                        </button>
                      ) : null}
                      <span className="personnel-scope-toolbar-badge">Read-only municipality scope</span>
                    </div>
                  </div>
                </div>

                {filteredOffices.length ? (
                  <div className="personnel-scope-office-grid">
                    {filteredOffices.map((office) => (
                      <OfficeCard
                        key={office.id}
                        office={office}
                        isAssigned={office.id === assignedOffice?.id}
                        isSelected={office.id === selectedOffice?.id}
                        onSelect={() => setSelectedOfficeId(office.id)}
                        onOpen={() => {
                          setSelectedOfficeId(office.id);
                          setActiveInnerTab('pinned');
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No offices matched"
                    text="Try a different search term or reset the filters to view the offices available under your municipality."
                  />
                )}
              </div>
            ) : null}

            {activeInnerTab === 'pinned' ? (
              <div className="personnel-scope-tab-card personnel-scope-spotlight">
                {selectedOffice ? (
                  <>
                    <div className="personnel-scope-spotlight-head">
                      <div className="personnel-scope-spotlight-copy">
                        <span className="personnel-scope-spotlight-mark">
                          <BuildingIcon />
                        </span>
                        <div className="personnel-scope-subsection">
                          <p className="personnel-scope-section-eyebrow">Pinned office</p>
                          <h3 className="personnel-scope-section-title">{selectedOffice.name}</h3>
                          <p className="personnel-scope-section-text">{selectedOffice.description}</p>
                        </div>
                      </div>
                      <StatusPill status={selectedOffice.status} />
                    </div>

                    <div className="personnel-scope-chip-row">
                      <span className="personnel-scope-chip is-soft">{selectedOffice.type}</span>
                      <span className="personnel-scope-chip is-soft">{selectedOffice.contactNumber}</span>
                      <span className="personnel-scope-chip is-soft">{selectedOffice.emailAddress}</span>
                    </div>

                    <div className="detail-grid personnel-scope-detail-grid">
                      <DetailItem label="Lead" value={selectedOffice.lead} />
                      <DetailItem label="Office Hours" value={selectedOffice.officeHours} />
                      <DetailItem label="Municipality" value={selectedOffice.municipality} />
                      <DetailItem label="Address" value={selectedOffice.address} />
                    </div>

                    <div className="personnel-scope-glance-grid">
                      <article className="personnel-scope-glance-card">
                        <small>Programs</small>
                        <strong>{selectedOffice.programsAssigned}</strong>
                        <span>linked listings</span>
                      </article>
                      <article className="personnel-scope-glance-card">
                        <small>Applications</small>
                        <strong>{selectedOffice.applicationsReceived}</strong>
                        <span>records received</span>
                      </article>
                      <article className="personnel-scope-glance-card">
                        <small>Staff</small>
                        <strong>{selectedOffice.personnelAssigned}</strong>
                        <span>assigned personnel</span>
                      </article>
                      <article className="personnel-scope-glance-card">
                        <small>Updated</small>
                        <strong>{formatModuleDate(selectedOffice.updatedAt)}</strong>
                        <span>{formatModuleRelativeTime(selectedOffice.updatedAt)}</span>
                      </article>
                    </div>

                    <div className="personnel-scope-spotlight-panel">
                      <div className="personnel-scope-subtitle-row">
                        <strong>Application mix</strong>
                        <button className="secondary-button" onClick={() => setOpenModal('office')} type="button">
                          Full details
                        </button>
                      </div>
                      <SummaryBars items={selectedOfficeSummary} emptyText="No applications are linked to this office yet." />
                    </div>

                    <div className="personnel-scope-spotlight-stack">
                      <div className="personnel-scope-note">
                        <strong>Programs linked</strong>
                        <div className="tag-cloud">
                          {selectedOfficeProgramsPreview.length ? (
                            selectedOfficeProgramsPreview.map((program) => (
                              <span className="tag-chip" key={`selected-office-program-${program.id}`}>
                                {program.title}
                              </span>
                            ))
                          ) : (
                            <p>No programs are currently linked to this office.</p>
                          )}
                        </div>
                      </div>

                      <div className="personnel-scope-note">
                        <strong>Assigned personnel</strong>
                        <div className="tag-cloud">
                          {selectedOfficePersonnelPreview.length ? (
                            selectedOfficePersonnelPreview.map((person) => (
                              <span className="tag-chip" key={`selected-office-person-${person.id}`}>
                                {person.name}
                              </span>
                            ))
                          ) : (
                            <p>No personnel accounts are assigned to this office yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="personnel-scope-subsection">
                      <strong>Recent office activity</strong>
                      <ActivityList
                        items={selectedOfficeActivity}
                        emptyTitle="No office activity yet"
                        emptyText="Recent office activity will appear here once related records are updated."
                      />
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="No office selected"
                    text="Pin an office from the Office Browser tab to inspect its details, application mix, and recent activity here."
                  />
                )}
              </div>
            ) : null}

            {activeInnerTab === 'municipality' ? (
              <div className="personnel-scope-tab-card">
                <div className="personnel-scope-panel-head">
                  <div className="personnel-scope-subsection">
                    <p className="personnel-scope-section-eyebrow">Municipality insight</p>
                    <h3 className="personnel-scope-section-title">{municipality.name}</h3>
                    <p className="personnel-scope-section-text">{municipality.description}</p>
                  </div>
                  <button className="secondary-button" onClick={() => setOpenModal('municipality')} type="button">
                    View municipality
                  </button>
                </div>

                <div className="personnel-scope-glance-grid">
                  <article className="personnel-scope-glance-card">
                    <small>Offices</small>
                    <strong>{municipality.officesCount}</strong>
                    <span>inside your municipality</span>
                  </article>
                  <article className="personnel-scope-glance-card">
                    <small>Active offices</small>
                    <strong>{activeOfficeCount}</strong>
                    <span>currently visible</span>
                  </article>
                  <article className="personnel-scope-glance-card">
                    <small>Programs</small>
                    <strong>{municipality.linkedPrograms.length}</strong>
                    <span>{municipalityActivePrograms} still active</span>
                  </article>
                  <article className="personnel-scope-glance-card">
                    <small>Personnel</small>
                    <strong>{municipality.assignedPersonnelCount}</strong>
                    <span>assigned accounts</span>
                  </article>
                </div>

                <div className="personnel-scope-preview-grid">
                  <div className="personnel-scope-note">
                    <strong>Offices in scope</strong>
                    <div className="tag-cloud">
                      {municipalityOfficePreview.length ? (
                        municipalityOfficePreview.map((office) => (
                          <span className="tag-chip" key={`municipality-preview-office-${office.id}`}>
                            {office.name}
                          </span>
                        ))
                      ) : (
                        <p>No office records are currently linked to this municipality.</p>
                      )}
                    </div>
                  </div>

                  <div className="personnel-scope-note">
                    <strong>Programs in scope</strong>
                    <div className="tag-cloud">
                      {municipalityProgramPreview.length ? (
                        municipalityProgramPreview.map((program) => (
                          <span className="tag-chip" key={`municipality-preview-program-${program.id}`}>
                            {program.title}
                          </span>
                        ))
                      ) : (
                        <p>No programs are linked to this municipality yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="personnel-scope-subsection">
                  <strong>Recent municipality activity</strong>
                  <ActivityList
                    items={municipality.recentActivity}
                    emptyTitle="No municipality activity yet"
                    emptyText="Recent municipality activity will appear here once records and linked actions are updated."
                  />
                </div>
              </div>
            ) : null}

            {activeInnerTab === 'assignment' ? (
              <div className="personnel-scope-tab-card">
                <div className="personnel-scope-panel-head">
                  <div className="personnel-scope-subsection">
                    <p className="personnel-scope-section-eyebrow">Assignment</p>
                    <h3 className="personnel-scope-section-title">Account scope</h3>
                    <p className="personnel-scope-section-text">
                      Quick reference for the municipality and office currently tied to your personnel account.
                    </p>
                  </div>
                </div>

                <div className="detail-grid personnel-scope-detail-grid">
                  <DetailItem label="Personnel Name" value={scope.assignment?.fullName || session.name} />
                  <DetailItem label="Role" value={scope.assignment?.role || session.title} />
                  <DetailItem label="Assigned Office" value={currentAccessLabel} />
                  <DetailItem label="Account Status" value={scope.assignment?.status || 'Active'} />
                  <DetailItem label="Access Start" value={formatModuleDate(scope.assignment?.accessStartDate || scope.assignment?.dateAssigned)} />
                  <DetailItem label="Access End" value={formatModuleDate(scope.assignment?.accessEndDate)} />
                </div>

                <div className="personnel-scope-note">
                  <strong>Scope note</strong>
                  <p>
                    This page is designed for quick monitoring only. Office creation, reassignment, archival, and municipality-wide structural changes remain
                    managed from the captain workspace.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {openModal === 'municipality' ? (
        <ModalShell
          title={municipality.name}
          text="Municipality details are opened in a modal so the main page can stay focused on the office directory."
          onClose={() => setOpenModal(null)}
        >
          <div className="detail-grid">
            <DetailItem label="Province" value={municipality.province} />
            <DetailItem label="Status" value={municipality.status} />
            <DetailItem label="Contact Number" value={municipality.contactNumber} />
            <DetailItem label="Email Address" value={municipality.emailAddress} />
            <DetailItem label="Offices Under Municipality" value={municipality.officesCount} />
            <DetailItem label="Assigned Personnel" value={municipality.assignedPersonnelCount} />
            <DetailItem label="Linked Programs" value={municipality.linkedPrograms.length} />
            <DetailItem label="Applications" value={municipality.totalApplications} />
            <DetailItem label="Created" value={formatModuleDate(municipality.createdAt)} />
            <DetailItem label="Last Updated" value={formatModuleDate(municipality.updatedAt)} />
          </div>

          <div className="personnel-scope-note">
            <strong>Municipality Description</strong>
            <p>{municipality.description}</p>
          </div>

          <div className="personnel-scope-modal-grid">
            <div className="personnel-scope-note">
              <strong>Offices Under This Municipality</strong>
              <div className="tag-cloud">
                {municipality.offices.length ? (
                  municipality.offices.map((office) => (
                    <span className="tag-chip" key={`municipality-office-${office.id}`}>
                      {office.name}
                    </span>
                  ))
                ) : (
                  <p>No office records are currently linked to this municipality.</p>
                )}
              </div>
            </div>

            <div className="personnel-scope-note">
              <strong>Programs in Scope</strong>
              <div className="tag-cloud">
                {municipality.linkedPrograms.length ? (
                  municipality.linkedPrograms.map((program) => (
                    <span className="tag-chip" key={`municipality-program-${program.id}`}>
                      {program.title}
                    </span>
                  ))
                ) : (
                  <p>No programs are linked to this municipality yet.</p>
                )}
              </div>
            </div>
          </div>

          <ActivityList
            items={municipality.recentActivity}
            emptyTitle="No municipality activity yet"
            emptyText="Recent municipality activity will appear here once records and linked actions are updated."
          />
        </ModalShell>
      ) : null}

      {openModal === 'office' && selectedOffice ? (
        <ModalShell
          title={selectedOffice.name}
          text="Office details are available for review only from the personnel side."
          onClose={() => setOpenModal(null)}
        >
          <div className="detail-grid">
            <DetailItem label="Office Type" value={selectedOffice.type} />
            <DetailItem label="Municipality" value={selectedOffice.municipality} />
            <DetailItem label="Address" value={selectedOffice.address} />
            <DetailItem label="Contact Number" value={selectedOffice.contactNumber} />
            <DetailItem label="Email Address" value={selectedOffice.emailAddress} />
            <DetailItem label="Office Hours" value={selectedOffice.officeHours} />
            <DetailItem label="Status" value={selectedOffice.status} />
            <DetailItem label="Programs Handled" value={selectedOffice.programsAssigned} />
            <DetailItem label="Personnel Assigned" value={selectedOffice.personnelAssigned} />
            <DetailItem label="Applications Received" value={selectedOffice.applicationsReceived} />
          </div>

          <div className="personnel-scope-note">
            <strong>Office Description</strong>
            <p>{selectedOffice.description}</p>
          </div>

          <div className="personnel-scope-modal-grid">
            <div className="personnel-scope-note">
              <strong>Programs Linked to This Office</strong>
              <div className="tag-cloud">
                {selectedOffice.programsHandled.length ? (
                  selectedOffice.programsHandled.map((program) => (
                    <span className="tag-chip" key={`office-program-${program.id}`}>
                      {program.title}
                    </span>
                  ))
                ) : (
                  <p>No program listings are linked to this office yet.</p>
                )}
              </div>
            </div>

            <div className="personnel-scope-note">
              <strong>Application Status Summary</strong>
              <div className="tag-cloud">
                {selectedOffice.applicationSummary.map((item) => (
                  <span className="tag-chip" key={`office-summary-${selectedOffice.id}-${item.status}`}>
                    {item.status}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ActivityList
            items={selectedOffice.recentActivity}
            emptyTitle="No office activity yet"
            emptyText="Office-level updates will appear here once related program or application activity is tracked."
          />
        </ModalShell>
      ) : null}
    </>
  );
}


