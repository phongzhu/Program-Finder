import { useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  EmptyState,
  FormField,
  ManagementCellStack,
  ManagementFilterGrid,
  ManagementGrid,
  ManagementInlineGrid,
  ManagementTable,
  ManagementToolbar,
  ModalShell,
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

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const OFFICE_LEVEL_OPTIONS = [
  { label: 'Municipal', value: 'municipal' },
  { label: 'Barangay', value: 'barangay' },
];

function getMunicipalityIdFromHash() {
  const parts = window.location.hash.replace(/^#/, '').split('/').filter(Boolean);
  return parts[2] || '';
}

function getBarangayScopeFromHash() {
  const parts = window.location.hash.replace(/^#/, '').split('/').filter(Boolean);
  return parts[3] || '';
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function normalizeComparable(value) {
  return String(value || '').trim().toLowerCase();
}

function createOfficeForm(municipalityId, office = {}) {
  return {
    officeName: office.officeName || '',
    officeLevel: office.officeLevel || 'municipal',
    parentOfficeId: office.parentOfficeId || '',
    municipalityId: office.municipalityId || municipalityId || '',
    barangayId: office.barangayId || '',
    houseNumber: office.houseNumber || '',
    streetName: office.streetName || '',
    subdivisionArea: office.subdivisionArea || '',
    contactNumber: office.contactNumber || '',
    email: office.email || '',
    status: office.status || 'Active',
  };
}

export default function ViewOfficesScreen({ navigate }) {
  const municipalityId = getMunicipalityIdFromHash();
  const barangayScope = getBarangayScopeFromHash();
  const [records, setRecords] = useState({ municipalities: [], offices: [], barangays: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [officeFormOpen, setOfficeFormOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [officeForm, setOfficeForm] = useState(() => createOfficeForm(municipalityId));

  const loadRecords = async () => {
    setIsLoading(true);
    setError('');

    try {
      setRecords(await listOfficeManagementRecords());
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load municipality offices.');
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
  const barangayOptions = [
    { label: 'No barangay', value: '' },
    ...barangays.map((barangay) => ({ label: barangay.name, value: barangay.id })),
  ];
  const selectedBarangay = barangays.find((barangay) => barangay.id === barangayScope) || null;
  const isMunicipalityWideScope = barangayScope === 'municipality-wide';
  const scopeLabel = isMunicipalityWideScope
    ? 'Municipality-wide'
    : selectedBarangay?.name || 'Select a barangay';
  const scopedOffices = useMemo(() => {
    if (isMunicipalityWideScope) {
      return offices.filter((office) => !office.barangayId);
    }

    if (selectedBarangay) {
      return offices.filter((office) => office.barangayId === selectedBarangay.id);
    }

    return [];
  }, [isMunicipalityWideScope, offices, selectedBarangay]);
  const query = search.trim().toLowerCase();
  const filteredOffices = scopedOffices.filter((office) => {
    if (statusFilter !== 'all' && office.status !== statusFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      office.officeName,
      office.officeLevelLabel,
      office.barangayName || 'Municipality-wide',
      office.contactNumber,
      office.email,
      office.address,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });
  const summaryCards = [
    { label: 'Offices', value: scopedOffices.length, detail: scopeLabel },
    { label: 'Active Offices', value: scopedOffices.filter((office) => office.status === 'Active').length, detail: 'currently enabled' },
    { label: 'Scope', value: isMunicipalityWideScope ? 'Municipal' : 'Barangay', detail: municipality?.municipalityName || 'selected municipality' },
    { label: 'Total Municipality Offices', value: offices.length, detail: 'all scopes' },
  ];

  const openOfficeForm = (office = null) => {
    setEditingOffice(office);
    setOfficeForm({
      ...createOfficeForm(municipalityId, office || {}),
      ...(office ? {} : {
        barangayId: selectedBarangay?.id || '',
        officeLevel: selectedBarangay ? 'barangay' : 'municipal',
      }),
    });
    setOfficeFormOpen(true);
  };

  const saveOffice = async () => {
    if (!officeForm.officeName.trim()) {
      setError('Enter the office name before saving.');
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
      setError(
        officeForm.barangayId
          ? 'This office already exists for the selected barangay. Edit the existing office instead of creating another one.'
          : 'This municipal office already exists. Edit the existing office instead of creating another one.'
      );
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

  if (!municipalityId) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="View offices" title="Select a municipality" text="Open a municipality before viewing its offices." />
        <ActionButton tone="secondary" onClick={() => navigate('/personnel/offices-municipalities')}>Back to Municipalities</ActionButton>
      </div>
    );
  }

  if (!isLoading && (!municipality || (!selectedBarangay && !isMunicipalityWideScope))) {
    return (
      <div className="section-card">
        <SectionHeading
          eyebrow="View offices"
          title={!municipality ? 'Municipality not found' : 'Barangay not found'}
          text={!municipality
            ? 'The selected municipality could not be loaded from Supabase.'
            : 'Open offices from a specific barangay row on the municipality structure page.'}
        />
        <ActionButton tone="secondary" onClick={() => navigate(municipalityId ? `/personnel/view-municipality/${municipalityId}` : '/personnel/offices-municipalities')}>
          Back to Municipality
        </ActionButton>
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
                <ActionButton tone="ghost" onClick={() => navigate(`/personnel/view-municipality/${municipalityId}`)}>Back</ActionButton>
                <ActionButton tone="primary" onClick={() => openOfficeForm()}>Add Office</ActionButton>
              </>
            )}
          >
            <SectionHeading
              eyebrow="View offices"
              title={municipality?.municipalityName ? `${scopeLabel} offices` : 'Scoped offices'}
              text={municipality?.municipalityName
                ? `Showing only offices under ${scopeLabel} in ${municipality.municipalityName}.`
                : 'Showing offices for the selected scope.'}
            />
          </ManagementToolbar>
          {error ? <div className="pf-auth-error">{error}</div> : null}
          {isLoading ? <EmptyState title="Loading offices" text="Fetching offices linked to this municipality." /> : null}
          {municipality ? (
            <ManagementGrid>
              {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
            </ManagementGrid>
          ) : null}
        </div>

        <div className="section-card">
          <ManagementToolbar>
            <SectionHeading
              eyebrow="Office records"
              title={`Offices under ${scopeLabel}`}
              text="Use search and status filters when this barangay has many offices."
            />
          </ManagementToolbar>

          <ManagementFilterGrid>
            <FormField
              label="Search"
              onChange={setSearch}
              placeholder="Search office, barangay, contact, or address"
              value={search}
            />
            <SelectField label="Status" onChange={setStatusFilter} options={STATUS_FILTERS} value={statusFilter} />
          </ManagementFilterGrid>

          {!isLoading && filteredOffices.length ? (
            <ManagementTable compact>
              <thead>
                <tr>
                  <th>Office</th>
                  <th>Level</th>
                  <th>Barangay / Scope</th>
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
                    <td>{office.barangayName || 'Municipality-wide'}</td>
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
            <EmptyState title="No offices found" text="No offices matched this municipality and filter set." />
          ) : null}
        </div>
      </div>

      {officeFormOpen ? (
        <ModalShell
          title={editingOffice ? 'Edit office' : 'Add office'}
          onClose={() => setOfficeFormOpen(false)}
          wide
          footer={<ActionButton tone="primary" onClick={saveOffice}>Save Office</ActionButton>}
        >
          <ManagementInlineGrid>
            <FormField label="Office Name" value={officeForm.officeName} onChange={(value) => setOfficeForm({ ...officeForm, officeName: value })} />
            <SelectField label="Office Level" value={officeForm.officeLevel} onChange={(value) => setOfficeForm({ ...officeForm, officeLevel: value, barangayId: value === 'barangay' ? officeForm.barangayId : '' })} options={OFFICE_LEVEL_OPTIONS} />
            <SelectField label="Barangay" value={officeForm.barangayId} onChange={(value) => setOfficeForm({ ...officeForm, barangayId: value })} options={barangayOptions} disabled={officeForm.officeLevel !== 'barangay'} />
            <FormField label="House Number" value={officeForm.houseNumber} onChange={(value) => setOfficeForm({ ...officeForm, houseNumber: value })} />
            <FormField label="Street Name" value={officeForm.streetName} onChange={(value) => setOfficeForm({ ...officeForm, streetName: value })} />
            <FormField label="Subdivision / Area" value={officeForm.subdivisionArea} onChange={(value) => setOfficeForm({ ...officeForm, subdivisionArea: value })} />
            <FormField label="Contact Number" value={officeForm.contactNumber} onChange={(value) => setOfficeForm({ ...officeForm, contactNumber: value })} />
            <FormField label="Email" value={officeForm.email} onChange={(value) => setOfficeForm({ ...officeForm, email: value })} />
            <SelectField label="Status" value={officeForm.status} onChange={(value) => setOfficeForm({ ...officeForm, status: value })} options={STATUS_OPTIONS} />
          </ManagementInlineGrid>
        </ModalShell>
      ) : null}
    </>
  );
}
