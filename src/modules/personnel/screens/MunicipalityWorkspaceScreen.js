import { useEffect, useState } from 'react';
import {
  DetailItem,
  EmptyState,
  FormField,
  SectionHeading,
  SelectField,
  StatusPill,
} from '../../../shared/components/ui';
import {
  buildMunicipalityModuleData,
  formatModuleDate,
  formatModuleRelativeTime,
  getPersonnelScope,
} from '../../../shared/municipalityModule';

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Archived', value: 'Archived' },
];

function ScopeMetric({ label, value, detail }) {
  return (
    <article className="personnel-scope-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
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

export default function MunicipalityWorkspaceScreen({ data, session }) {
  const moduleData = buildMunicipalityModuleData(data);
  const scope = getPersonnelScope(moduleData, session);
  const municipality = scope.municipality;
  const assignedOffice = scope.assignedOffice;
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

  if (!municipality) {
    return (
      <div className="section-card">
        <EmptyState
          title="No municipality assigned"
          text="This personnel account does not have an assigned municipality yet. Assign a municipality from the admin workspace first."
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

  const selectedOffice =
    offices.find((office) => office.id === selectedOfficeId) ||
    assignedOffice ||
    filteredOffices[0] ||
    null;

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
          background:rgba(30,125,77,.09);
          color:var(--pf-accent-dark);
          font-size:.78rem;
          font-weight:800;
        }
        .personnel-scope-metrics {
          grid-template-columns:repeat(4,minmax(0,1fr));
        }
        .personnel-scope-metric {
          display:grid;
          gap:.2rem;
          background:
            radial-gradient(circle at top right, rgba(143,225,185,.18), transparent 36%),
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
          font-size:1.45rem;
          line-height:1.05;
        }
        .personnel-scope-metric span {
          font-weight:700;
          color:var(--pf-ink-soft);
        }
        .personnel-scope-note {
          background:rgba(30,125,77,.06);
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
          font-size:.76rem;
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
          margin-top:.45rem;
          padding:.28rem .65rem;
          border-radius:999px;
          background:rgba(30,125,77,.12);
          color:var(--pf-accent-dark);
          font-size:.73rem;
          font-weight:800;
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
          font-size:1.2rem;
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
          .personnel-scope-summary,
          .personnel-scope-metrics,
          .personnel-scope-toolbar,
          .personnel-scope-modal-grid {
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .personnel-scope-table-head,
          .personnel-scope-table-row {
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .personnel-scope-table-actions {
            justify-content:flex-start;
          }
        }
        @media (max-width:820px) {
          .personnel-scope-summary,
          .personnel-scope-metrics,
          .personnel-scope-toolbar,
          .personnel-scope-modal-grid,
          .personnel-scope-table-head,
          .personnel-scope-table-row {
            grid-template-columns:1fr;
          }
          .personnel-scope-table-head {
            display:none;
          }
          .personnel-scope-modal-backdrop {
            padding:.75rem;
          }
          .personnel-scope-modal-header {
            flex-direction:column;
            align-items:stretch;
          }
        }
      `}</style>

      <div className="dashboard-grid personnel-scope-shell">
        <div className="personnel-scope-summary">
          <div className="section-card personnel-scope-summary-card">
            <div>
              <SectionHeading
                eyebrow="Assigned municipality"
                title={municipality.name}
                text="This workspace only shows the municipality assigned to your account and the offices operating under that scope."
              />
              <div className="personnel-scope-chip-row">
                <span className="personnel-scope-chip">{municipality.province}</span>
                <span className="personnel-scope-chip">
                  {assignedOffice?.name || 'Municipality-wide access'}
                </span>
                <span className="personnel-scope-chip">{scope.assignment?.role || session.title}</span>
              </div>
            </div>

            <div className="personnel-scope-summary-actions">
              <button className="secondary-button" onClick={() => setOpenModal('municipality')} type="button">
                View Municipality
              </button>
            </div>
          </div>

          <div className="section-card personnel-scope-assignment">
            <SectionHeading
              eyebrow="Assignment"
              title="My access scope"
              text="Use this card as the quick reference for the office and municipality currently tied to your account."
            />
            <div className="detail-grid">
              <DetailItem label="Personnel Name" value={scope.assignment?.fullName || session.name} />
              <DetailItem label="Role" value={scope.assignment?.role || session.title} />
              <DetailItem label="Assigned Office" value={scope.assignment?.assignedOffice || assignedOffice?.name || 'Municipality-wide'} />
              <DetailItem label="Account Status" value={scope.assignment?.status || 'Active'} />
              <DetailItem label="Access Start" value={formatModuleDate(scope.assignment?.accessStartDate || scope.assignment?.dateAssigned)} />
              <DetailItem label="Access End" value={formatModuleDate(scope.assignment?.accessEndDate)} />
            </div>
          </div>
        </div>

        <div className="personnel-scope-metrics">
          {scopeMetrics.map((metric) => (
            <ScopeMetric key={metric.label} {...metric} />
          ))}
        </div>

        <div className="section-card">
          <SectionHeading
            eyebrow="Office directory"
            title={`Offices in ${municipality.name}`}
            text="Search and filter the offices under your assigned municipality, then open any record in a focused modal."
          />

          <div className="personnel-scope-toolbar">
            <FormField
              label="Search offices"
              value={search}
              onChange={setSearch}
              placeholder="Search office name, contact number, address, or email"
            />
            <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            <SelectField label="Office type" value={typeFilter} onChange={setTypeFilter} options={officeTypeOptions} />
          </div>

          <div className="personnel-scope-note">
            <strong>{filteredOffices.length} office records visible</strong>
            <p>
              Offices are limited to {municipality.name}. This side is view-only and cannot create, archive, or
              reassign municipality records.
            </p>
          </div>

          {filteredOffices.length ? (
            <div className="personnel-scope-table">
              <div className="personnel-scope-table-head">
                <span>Office</span>
                <span>Type</span>
                <span>Contact</span>
                <span>Programs</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {filteredOffices.map((office) => (
                <article className="personnel-scope-table-row" key={office.id}>
                  <div>
                    <strong>{office.name}</strong>
                    <p>{office.address}</p>
                    {office.id === assignedOffice?.id ? (
                      <span className="personnel-scope-inline-pill">Assigned Office</span>
                    ) : null}
                  </div>
                  <div>
                    <strong>{office.type}</strong>
                    <small>{office.officeHours}</small>
                  </div>
                  <div>
                    <strong>{office.contactNumber}</strong>
                    <small>{office.emailAddress}</small>
                  </div>
                  <div>
                    <strong>{office.programsAssigned}</strong>
                    <small>{office.applicationsReceived} linked applications</small>
                  </div>
                  <div>
                    <StatusPill status={office.status} />
                  </div>
                  <div className="personnel-scope-table-actions">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setSelectedOfficeId(office.id);
                        setOpenModal('office');
                      }}
                      type="button"
                    >
                      View
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No offices matched"
              text="Try a different search term or reset the filters to view the offices available under your municipality."
            />
          )}
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
