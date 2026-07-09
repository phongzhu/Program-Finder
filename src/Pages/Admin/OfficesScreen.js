import { useEffect, useState } from 'react';
import {
  ActionButton,
  EmptyState,
  FormField,
  ModalShell,
  SelectField,
  StatusPill,
} from 'Components/UI';
import { createMunicipalityRecord, listOfficeManagementRecords } from 'Services/Supabase/offices';

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];
const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

function createMunicipalityForm() {
  return {
    municipalityName: '',
    provinceName: 'Bulacan',
    status: 'Active',
  };
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export default function OfficesScreen({ navigate }) {
  const [records, setRecords] = useState({
    offices: [],
    municipalities: [],
    summary: {
      totalOffices: 0,
      activeOffices: 0,
      totalMunicipalities: 0,
      activeMunicipalities: 0,
      totalBarangays: 0,
    },
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMunicipalityModalOpen, setMunicipalityModalOpen] = useState(false);
  const [municipalityForm, setMunicipalityForm] = useState(() => createMunicipalityForm());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextRecords = await listOfficeManagementRecords();
      setRecords(nextRecords);
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load Supabase municipality records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialRecords() {
      setIsLoading(true);
      setError('');

      try {
        const nextRecords = await listOfficeManagementRecords();
        if (isMounted) {
          setRecords(nextRecords);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || 'Unable to load Supabase municipality records.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  const query = search.trim().toLowerCase();

  const filteredMunicipalities = records.municipalities.filter((municipality) => {
    if (statusFilter !== 'all' && municipality.status !== statusFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      municipality.municipalityName,
      municipality.provinceName,
      municipality.status,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const summaryCards = [
    {
      label: 'Municipalities',
      value: records.summary.totalMunicipalities,
      detail: `${records.summary.activeMunicipalities} active`,
    },
    {
      label: 'Offices',
      value: records.summary.totalOffices,
      detail: 'managed inside each municipality',
    },
    {
      label: 'Barangays',
      value: records.summary.totalBarangays,
      detail: 'from ref_barangays',
    },
    {
      label: 'Data Source',
      value: 'Supabase',
      detail: 'ref tables',
    },
  ];

  const handleAddMunicipality = async () => {
    if (!municipalityForm.municipalityName.trim()) {
      setError('Enter the municipality name before saving.');
      return;
    }

    try {
      await createMunicipalityRecord(municipalityForm);
      setMunicipalityForm(createMunicipalityForm());
      setMunicipalityModalOpen(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to add municipality.');
    }
  };

  return (
    <>
      <style>{`
        .om-shell {
          display: grid;
          gap: 14px;
          padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
          box-sizing: border-box;
          font-family: var(--pf-font-body, system-ui, sans-serif);
          color: #1a3356;
        }
        .om-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .om-stat {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .om-stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .07em;
          color: #7a8fa6;
        }
        .om-stat-value {
          font-size: 1.75rem;
          line-height: 1;
          font-weight: 700;
          color: #0f2f63;
        }
        .om-stat-detail {
          font-size: 0.76rem;
          color: #7a8fa6;
        }
        .om-toolbar {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .om-search {
          width: 100%;
          height: 42px;
          border: 1px solid #d7dde8;
          background: #f8fafd;
          padding: 0 14px;
          font: inherit;
          font-size: .92rem;
          color: #1a3356;
          outline: none;
        }
        .om-filter-row {
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(0, 320px);
        }
        .om-select-wrap {
          display: grid;
          gap: 4px;
        }
        .om-label {
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .09em;
          color: #7a8fa6;
        }
        .om-select {
          width: 100%;
          border: 1px solid #d7dde8;
          background: #f8fafd;
          color: #1a3356;
          font: inherit;
          font-size: .88rem;
          font-weight: 600;
          height: 42px;
          padding: 0 12px;
        }
        .om-panel {
          background: #ffffff;
          border: 1px solid #d7dde8;
          box-shadow: 0 1px 4px rgba(15,47,99,.05);
          overflow: hidden;
        }
        .om-panel-top {
          padding: 16px 20px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .om-eyebrow {
          display: block;
          font-size: .67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
          margin-bottom: 3px;
        }
        .om-panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f2f63;
          line-height: 1.2;
        }
        .om-panel-subtitle {
          margin: 4px 0 0;
          font-size: .84rem;
          color: #4a5e7a;
        }
        .om-add-btn {
          background: #0f2f63;
          color: #ffffff;
          border: none;
          padding: 9px 18px;
          font: inherit;
          font-size: .86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .om-panel-body {
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .om-error {
          border: 1px solid rgba(195, 86, 75, 0.24);
          background: rgba(195, 86, 75, 0.08);
          color: #8f2f28;
          padding: 10px 12px;
          font-size: .82rem;
          line-height: 1.45;
        }
        .om-info-banner {
          background: #f8fafd;
          border: 1px solid #e8ecf2;
          border-left: 3px solid #2a4e8c;
          padding: 12px 16px;
          display: grid;
          gap: 4px;
        }
        .om-info-banner strong {
          font-size: .88rem;
          font-weight: 700;
          color: #0f2f63;
        }
        .om-info-banner p {
          margin: 0;
          font-size: .82rem;
          color: #4a5e7a;
          line-height: 1.5;
        }
        .om-table {
          border: 1px solid #d7dde8;
          overflow: hidden;
        }
        .om-table-head,
        .om-table-row {
          display: grid;
          grid-template-columns: minmax(200px, 1.2fr) minmax(140px, .8fr) minmax(90px, .45fr) minmax(90px, .45fr) minmax(120px, .7fr) minmax(140px, .8fr) 110px;
          gap: 12px;
          align-items: center;
        }
        .om-table-head {
          padding: 10px 16px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
        }
        .om-table-row {
          padding: 12px 16px;
          border-bottom: 1px solid #e8ecf2;
          background: #ffffff;
        }
        .om-table-row:last-child {
          border-bottom: 0;
        }
        .om-cell {
          min-width: 0;
          display: grid;
          gap: 3px;
        }
        .om-cell strong {
          font-size: .9rem;
          font-weight: 700;
          color: #1a3356;
          line-height: 1.28;
        }
        .om-cell small {
          margin: 0;
          color: #6d8198;
          font-size: .77rem;
          line-height: 1.45;
        }
        .om-status-cell {
          display: inline-flex;
          align-items: center;
        }
        .om-action-cell {
          display: flex;
          justify-content: flex-end;
        }
        .om-view-btn {
          border: 1px solid #c8d8f5;
          background: #fff;
          color: #2a4e8c;
          min-height: 32px;
          padding: 0 12px;
          font: inherit;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .om-modal-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 1200px) {
          .om-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .om-table-head {
            display: none;
          }
          .om-table-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .om-action-cell {
            justify-content: flex-start;
          }
        }
        @media (max-width: 760px) {
          .om-filter-row {
            grid-template-columns: 1fr;
          }
          .om-table-row {
            grid-template-columns: 1fr;
          }
          .om-stats {
            grid-template-columns: 1fr;
          }
          .om-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="om-shell">
        <section className="om-stats">
          {summaryCards.map((card) => (
            <article className="om-stat" key={card.label}>
              <span className="om-stat-label">{card.label}</span>
              <strong className="om-stat-value">{card.value}</strong>
              <small className="om-stat-detail">{card.detail}</small>
            </article>
          ))}
        </section>

        <section className="om-toolbar">
          <input
            className="om-search"
            type="text"
            placeholder="Search municipality, province, or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="om-filter-row">
            <div className="om-select-wrap">
              <label className="om-label" htmlFor="om-status-filter">Status</label>
              <select
                id="om-status-filter"
                className="om-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="om-panel">
          <div className="om-panel-top">
            <div>
              <span className="om-eyebrow">Municipality management</span>
              <h2 className="om-panel-title">Municipality records</h2>
              <p className="om-panel-subtitle">Municipality rows come from public.ref_municipalities. Open a municipality to manage linked barangays and offices.</p>
            </div>
            <button type="button" className="om-add-btn" onClick={() => setMunicipalityModalOpen(true)}>
              Add Municipality
            </button>
          </div>

          <div className="om-panel-body">
            {error ? <div className="om-error">{error}</div> : null}

            <div className="om-info-banner">
              <strong>{filteredMunicipalities.length} municipalities in current view</strong>
              <p>Open a municipality row to maintain offices and barangays while keeping directory records aligned for applicant-facing use.</p>
            </div>

            {isLoading ? <EmptyState title="Loading municipality records" text="Fetching Supabase municipality references." /> : null}

            {!isLoading && filteredMunicipalities.length ? (
              <div className="om-table">
                <div className="om-table-head">
                  <span>Municipality</span>
                  <span>Province</span>
                  <span>Barangays</span>
                  <span>Offices</span>
                  <span>Status</span>
                  <span>Created</span>
                  <span>Action</span>
                </div>
                <div>
                  {filteredMunicipalities.map((municipality) => (
                    <article className="om-table-row" key={municipality.id}>
                      <div className="om-cell">
                        <strong>{municipality.municipalityName}</strong>
                        <small>Manage linked barangays and offices</small>
                      </div>
                      <div className="om-cell">
                        <strong>{municipality.provinceName}</strong>
                        <small>Province record</small>
                      </div>
                      <div className="om-cell">
                        <strong>{municipality.barangaysCount}</strong>
                        <small>Linked barangays</small>
                      </div>
                      <div className="om-cell">
                        <strong>{municipality.officesCount}</strong>
                        <small>Linked offices</small>
                      </div>
                      <div className="om-status-cell">
                        <StatusPill status={municipality.status} />
                      </div>
                      <div className="om-cell">
                        <strong>{formatDate(municipality.createdAt) || 'Not set'}</strong>
                        <small>Created date</small>
                      </div>
                      <div className="om-action-cell">
                        <button className="om-view-btn" onClick={() => navigate(`/personnel/view-municipality/${municipality.id}`)} type="button">
                          View
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {!isLoading && !filteredMunicipalities.length ? (
              <EmptyState title="No municipalities found" text="No Supabase municipality rows matched the current filters." />
            ) : null}
          </div>
        </section>
      </div>

      {isMunicipalityModalOpen ? (
        <ModalShell
          onClose={() => setMunicipalityModalOpen(false)}
          title="Add municipality"
          text="Create a new public.ref_municipalities row."
          footer={
            <>
              <ActionButton tone="ghost" onClick={() => setMunicipalityModalOpen(false)}>Cancel</ActionButton>
              <ActionButton tone="primary" onClick={handleAddMunicipality}>Save Municipality</ActionButton>
            </>
          }
        >
          <div className="om-modal-grid">
            <FormField label="Municipality Name" value={municipalityForm.municipalityName} onChange={(value) => setMunicipalityForm({ ...municipalityForm, municipalityName: value })} />
            <FormField label="Province" value={municipalityForm.provinceName} onChange={(value) => setMunicipalityForm({ ...municipalityForm, provinceName: value })} />
            <SelectField label="Status" value={municipalityForm.status} onChange={(value) => setMunicipalityForm({ ...municipalityForm, status: value })} options={STATUS_OPTIONS} />
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
