import { useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  EmptyState,
  FormField,
  ManagementCellStack,
  ManagementGrid,
  ManagementInlineGrid,
  ManagementNote,
  ManagementTable,
  ManagementToolbar,
  ModalShell,
  SectionHeading,
  SelectField,
  StatusPill,
  SummaryCard,
} from 'Components/UI';
import {
  createBarangayRecord,
  listOfficeManagementRecords,
  updateBarangayRecord,
  updateMunicipalityRecord,
} from 'Services/Supabase/offices';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];
const TABLE_ACTIONS_STYLE = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.45rem',
  alignItems: 'center',
};

const TABLE_BUTTON_STYLE = {
  flex: '0 0 auto',
  minWidth: '6.4rem',
  padding: '0.48rem 0.7rem',
  borderRadius: '999px',
};

function getOfficesPath(municipalityId, barangayId = '') {
  return `/personnel/view-offices/${municipalityId}${barangayId ? `/${barangayId}` : ''}`;
}

function getMunicipalityIdFromHash() {
  const parts = window.location.hash.replace(/^#/, '').split('/').filter(Boolean);
  return parts[2] || '';
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function createMunicipalityForm(municipality = {}) {
  return {
    municipalityName: municipality.municipalityName || municipality.name || '',
    provinceName: municipality.provinceName || municipality.province || 'Bulacan',
    status: municipality.status || 'Active',
  };
}

function createBarangayForm(barangay = {}) {
  return {
    barangayName: barangay.barangayName || barangay.name || '',
    status: barangay.status || 'Active',
  };
}

export default function ViewMunicipalityScreen({ navigate }) {
  const municipalityId = getMunicipalityIdFromHash();
  const [records, setRecords] = useState({ municipalities: [], offices: [], barangays: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [municipalityFormOpen, setMunicipalityFormOpen] = useState(false);
  const [barangayFormOpen, setBarangayFormOpen] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState(null);
  const [municipalityForm, setMunicipalityForm] = useState(() => createMunicipalityForm());
  const [barangayForm, setBarangayForm] = useState(() => createBarangayForm());

  const loadRecords = async () => {
    setIsLoading(true);
    setError('');

    try {
      setRecords(await listOfficeManagementRecords());
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load municipality details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const municipality = records.municipalities.find((item) => item.id === municipalityId) || null;
  const barangays = useMemo(
    () => (records.barangays || []).filter((barangay) => barangay.municipalityId === municipalityId),
    [municipalityId, records.barangays]
  );
  const offices = useMemo(
    () => (records.offices || []).filter((office) => office.municipalityId === municipalityId),
    [municipalityId, records.offices]
  );
  const officesByBarangay = useMemo(() => {
    return barangays.map((barangay) => ({
      barangay,
      offices: offices.filter((office) => office.barangayId === barangay.id),
    }));
  }, [barangays, offices]);
  const municipalityWideOffices = useMemo(
    () => offices.filter((office) => !office.barangayId),
    [offices]
  );
  const editingBarangayOffices = editingBarangay
    ? offices.filter((office) => office.barangayId === editingBarangay.id)
    : [];
  const summaryCards = [
    { label: 'Barangays', value: barangays.length, detail: 'linked records' },
    { label: 'Offices', value: offices.length, detail: 'within municipality' },
    { label: 'Active Barangays', value: barangays.filter((item) => item.status === 'Active').length, detail: 'currently enabled' },
    { label: 'Active Offices', value: offices.filter((item) => item.status === 'Active').length, detail: 'currently enabled' },
  ];

  useEffect(() => {
    if (municipality) {
      setMunicipalityForm(createMunicipalityForm(municipality));
    }
  }, [municipality]);

  const openBarangayForm = (barangay = null) => {
    setEditingBarangay(barangay);
    setBarangayForm(createBarangayForm(barangay || {}));
    setBarangayFormOpen(true);
  };

  const saveMunicipality = async () => {
    if (!municipality || !municipalityForm.municipalityName.trim()) {
      setError('Enter the municipality name before saving.');
      return;
    }

    try {
      await updateMunicipalityRecord(municipality.id, municipalityForm);
      setMunicipalityFormOpen(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to update municipality.');
    }
  };

  const saveBarangay = async () => {
    if (!barangayForm.barangayName.trim()) {
      setError('Enter the barangay name before saving.');
      return;
    }

    try {
      if (editingBarangay) {
        await updateBarangayRecord(editingBarangay.id, barangayForm);
      } else {
        await createBarangayRecord({ ...barangayForm, municipalityId });
      }
      setBarangayFormOpen(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save barangay.');
    }
  };

  if (!municipalityId) {
    return (
      <>
        <div className="dashboard-grid management-shell">
          <div className="section-card">
            <ManagementToolbar actions={<ActionButton tone="secondary" onClick={() => navigate('/personnel/offices-municipalities')}>Back to Management</ActionButton>}>
              <SectionHeading
                eyebrow="View municipality"
                title="Select a municipality"
                text="Open a municipality record to edit the municipality and manage its barangays and offices."
              />
            </ManagementToolbar>
            {error ? <div className="pf-auth-error">{error}</div> : null}
            {isLoading ? <EmptyState title="Loading municipalities" text="Fetching Supabase municipality records." /> : null}
            {!isLoading && records.municipalities.length ? (
              <ManagementTable>
                  <thead>
                    <tr>
                      <th>Municipality</th>
                      <th>Province</th>
                      <th>Barangays</th>
                      <th>Offices</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.municipalities.map((item) => (
                      <tr key={item.id}>
                        <td><ManagementCellStack><strong>{item.municipalityName}</strong></ManagementCellStack></td>
                        <td>{item.provinceName}</td>
                        <td>{item.barangaysCount}</td>
                        <td>{item.officesCount}</td>
                        <td><StatusPill status={item.status} /></td>
                        <td><ActionButton compact tone="primary" onClick={() => navigate(`/personnel/view-municipality/${item.id}`)}>Open</ActionButton></td>
                      </tr>
                    ))}
                  </tbody>
              </ManagementTable>
            ) : null}
            {!isLoading && !records.municipalities.length ? (
              <EmptyState title="No municipalities found" text="Add municipalities from the Offices & Municipalities screen first." />
            ) : null}
          </div>
        </div>
      </>
    );
  }

  if (!isLoading && !municipality) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Municipality" title="Record not found" text="The selected municipality could not be loaded from Supabase." />
        <ActionButton tone="secondary" onClick={() => navigate('/personnel/offices-municipalities')}>Back to list</ActionButton>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-grid management-shell">
        <div className="section-card">
          <ManagementToolbar
            actions={(
              <>
                <ActionButton tone="ghost" onClick={() => navigate('/personnel/offices-municipalities')}>Back</ActionButton>
                <ActionButton tone="primary" onClick={() => setMunicipalityFormOpen(true)}>Edit Municipality</ActionButton>
              </>
            )}
          >
            <SectionHeading
              eyebrow="Municipality record"
              title={municipality?.municipalityName || 'Loading municipality'}
              text="Review and maintain the municipality, linked offices, and barangays from Supabase."
            />
          </ManagementToolbar>
          {error ? <div className="pf-auth-error">{error}</div> : null}
          {isLoading ? <EmptyState title="Loading municipality" text="Fetching linked Supabase records." /> : null}
          {municipality ? (
            <>
              <ManagementGrid>
                {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
              </ManagementGrid>
            </>
          ) : null}
        </div>

        <div className="section-card">
          <ManagementToolbar
            actions={(
              <>
                <ActionButton tone="primary" onClick={() => openBarangayForm()}>Add Barangay</ActionButton>
              </>
            )}
          >
            <SectionHeading
              eyebrow="Barangays and offices"
              title="Municipality structure"
              text="Barangays and their linked offices are shown together so each local office is visible beside its barangay record."
            />
          </ManagementToolbar>
          {barangays.length || municipalityWideOffices.length ? (
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
                          <small>Open this scope to review individual records.</small>
                        </ManagementCellStack>
                      </td>
                      <td>{municipalityWideOffices.length}</td>
                      <td><StatusPill status="Active" /></td>
                      <td>-</td>
                      <td>
                        <ActionButton compact tone="secondary" style={TABLE_BUTTON_STYLE} onClick={() => navigate(getOfficesPath(municipalityId, 'municipality-wide'))}>
                          View Offices
                        </ActionButton>
                      </td>
                    </tr>
                  ) : null}
                  {officesByBarangay.map(({ barangay, offices: barangayOffices }) => (
                    <tr key={barangay.id}>
                      <td>
                        <ManagementCellStack>
                          <strong>{barangay.name}</strong>
                          <small>{barangayOffices.length ? `${barangayOffices.length} linked office${barangayOffices.length === 1 ? '' : 's'}` : 'No linked offices yet'}</small>
                        </ManagementCellStack>
                      </td>
                      <td>
                        {barangayOffices.length ? (
                          <ManagementCellStack>
                            <strong>{barangayOffices.length} linked office{barangayOffices.length === 1 ? '' : 's'}</strong>
                            <small>Open this barangay to review individual records.</small>
                          </ManagementCellStack>
                        ) : (
                          <span>No offices linked</span>
                        )}
                      </td>
                      <td>{barangayOffices.length}</td>
                      <td><StatusPill status={barangay.status} /></td>
                      <td>{formatDate(barangay.createdAt)}</td>
                      <td>
                        <div style={TABLE_ACTIONS_STYLE}>
                          <ActionButton compact tone="secondary" style={TABLE_BUTTON_STYLE} onClick={() => openBarangayForm(barangay)}>Edit Barangay</ActionButton>
                          <ActionButton compact tone="primary" style={TABLE_BUTTON_STYLE} onClick={() => navigate(getOfficesPath(municipalityId, barangay.id))}>View Offices</ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </ManagementTable>
          ) : (
            <EmptyState title="No structure yet" text="Add barangays or municipality-wide offices linked to this municipality." />
          )}
        </div>
      </div>

      {municipalityFormOpen ? (
        <ModalShell
          title="Edit municipality"
          onClose={() => setMunicipalityFormOpen(false)}
          footer={<><ActionButton tone="ghost" onClick={() => setMunicipalityFormOpen(false)}>Cancel</ActionButton><ActionButton tone="primary" onClick={saveMunicipality}>Save Municipality</ActionButton></>}
        >
          <ManagementInlineGrid>
            <FormField label="Municipality Name" value={municipalityForm.municipalityName} onChange={(value) => setMunicipalityForm({ ...municipalityForm, municipalityName: value })} />
            <FormField label="Province" value={municipalityForm.provinceName} onChange={(value) => setMunicipalityForm({ ...municipalityForm, provinceName: value })} />
            <SelectField label="Status" value={municipalityForm.status} onChange={(value) => setMunicipalityForm({ ...municipalityForm, status: value })} options={STATUS_OPTIONS} />
          </ManagementInlineGrid>
        </ModalShell>
      ) : null}

      {barangayFormOpen ? (
        <ModalShell
          title={editingBarangay ? 'Edit barangay' : 'Add barangay'}
          onClose={() => setBarangayFormOpen(false)}
          footer={<><ActionButton tone="ghost" onClick={() => setBarangayFormOpen(false)}>Cancel</ActionButton><ActionButton tone="primary" onClick={saveBarangay}>Save Barangay</ActionButton></>}
        >
          <ManagementInlineGrid>
            <FormField label="Barangay Name" value={barangayForm.barangayName} onChange={(value) => setBarangayForm({ ...barangayForm, barangayName: value })} />
            <SelectField label="Status" value={barangayForm.status} onChange={(value) => setBarangayForm({ ...barangayForm, status: value })} options={STATUS_OPTIONS} />
          </ManagementInlineGrid>
          {editingBarangay ? (
            <ManagementNote>
              <strong>Offices linked to this barangay</strong>
              {editingBarangayOffices.length ? (
                <div className="management-cell-stack" style={{ marginTop: '0.65rem' }}>
                  {editingBarangayOffices.map((office) => (
                    <div className="management-cell-stack" key={office.id}>
                      <strong>{office.officeName}</strong>
                      <small>{[office.officeLevelLabel, office.contactNumber || office.email || 'No contact set'].filter(Boolean).join(' / ')}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No offices are linked to this barangay yet.</p>
              )}
            </ManagementNote>
          ) : null}
        </ModalShell>
      ) : null}

    </>
  );
}
