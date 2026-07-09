import { useMemo, useState } from 'react';
import { ActionButton, AppTable, EmptyState, FormField, SectionHeading, SelectField, StatusPill } from 'Components/UI';
import { getOfficeApplications, getOfficePrograms } from 'Services/Personnel/personnel-utils';

const APPLICATION_STATUS_ORDER = ['Submitted', 'For Review', 'Incomplete', 'Approved', 'Rejected'];
const PROGRAM_STATUS_ORDER = ['Open', 'Upcoming', 'Closed', 'Archived'];

const REPORT_OPTIONS = [
  { value: 'application_status', label: 'Application Status Breakdown' },
  { value: 'program_status', label: 'Program Status Breakdown' },
  { value: 'top_programs', label: 'Top Programs by Volume' },
  { value: 'recent_activity', label: 'Recent Activity' },
];

function formatDate(value) {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function getStatusCount(items, key, statuses) {
  return statuses.map((status) => ({
    status,
    count: items.filter((item) => String(item[key] || '') === status).length,
  }));
}

function toPercent(count, total) {
  if (!total) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openPrintableReport({ title, subtitle, columns, rows }) {
  const now = new Date();
  const generatedAt = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);

  const tableHead = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const tableBody = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=780');
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111827}
          h1{margin:0 0 8px;font-size:24px}
          p{margin:0 0 6px;color:#374151}
          .meta{margin-bottom:18px;font-size:13px;color:#4b5563}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #d1d5db;padding:10px 12px;text-align:left;vertical-align:top}
          th{background:#f3f4f6;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
          td{font-size:14px}
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle || '')}</p>
        <div class="meta">Generated: ${escapeHtml(generatedAt)}</div>
        <table>
          <thead><tr>${tableHead}</tr></thead>
          <tbody>${tableBody}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export default function ReportsScreen({ session, data }) {
  const [search, setSearch] = useState('');
  const [activeReport, setActiveReport] = useState(REPORT_OPTIONS[0].value);
  const query = search.trim().toLowerCase();

  const programs = useMemo(
    () =>
      getOfficePrograms(data, session).map((program) => ({
        ...program,
        displayStatus: program.archived ? 'Archived' : program.status || 'Open',
      })),
    [data, session]
  );

  const applications = useMemo(() => getOfficeApplications(data, session), [data, session]);

  const filteredPrograms = useMemo(() => {
    if (!query) return programs;
    return programs.filter((program) =>
      [program.title, program.category, program.programType, program.displayStatus, program.municipality, program.summary]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [programs, query]);

  const filteredApplications = useMemo(() => {
    if (!query) return applications;
    return applications.filter((application) =>
      [application.applicantName, application.applicantEmail, application.status, application.priority, application.id]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [applications, query]);

  const statusCounts = useMemo(
    () => getStatusCount(filteredApplications, 'status', APPLICATION_STATUS_ORDER),
    [filteredApplications]
  );

  const programStatusCounts = useMemo(
    () => getStatusCount(filteredPrograms, 'displayStatus', PROGRAM_STATUS_ORDER),
    [filteredPrograms]
  );

  const topPrograms = useMemo(
    () =>
      filteredPrograms
        .map((program) => {
          const entries = filteredApplications.filter((application) => application.programId === program.id);
          const approved = entries.filter((application) => application.status === 'Approved').length;
          const pending = entries.filter((application) => ['Submitted', 'For Review', 'Incomplete'].includes(application.status)).length;
          return {
            id: program.id,
            title: program.title,
            category: program.category || 'Uncategorized',
            status: program.displayStatus,
            deadline: program.deadline || program.applicationEndDate,
            applications: entries.length,
            approved,
            pending,
          };
        })
        .sort((left, right) => right.applications - left.applications || right.pending - left.pending || left.title.localeCompare(right.title)),
    [filteredApplications, filteredPrograms]
  );

  const recentActivity = useMemo(() => {
    const programById = new Map(filteredPrograms.map((program) => [program.id, program]));

    return [...filteredApplications]
      .sort((left, right) => {
        const leftTime = new Date(left.reviewedAt || left.submittedAt || 0).getTime();
        const rightTime = new Date(right.reviewedAt || right.submittedAt || 0).getTime();
        return rightTime - leftTime;
      })
      .map((application) => ({
        ...application,
        programTitle: programById.get(application.programId)?.title || 'Program not found',
      }));
  }, [filteredApplications, filteredPrograms]);

  const reportViews = useMemo(() => {
    const appTotal = filteredApplications.length;
    const programTotal = filteredPrograms.length;

    return {
      application_status: {
        title: 'Application Status Breakdown',
        subtitle: `${appTotal} total applications`,
        columns: [
          { key: 'status', header: 'Status' },
          { key: 'count', header: 'Applications', align: 'right' },
          { key: 'share', header: 'Share', align: 'right' },
        ],
        rows: statusCounts.map((item) => ({
          ...item,
          share: toPercent(item.count, appTotal),
        })),
        exportColumns: ['Status', 'Applications', 'Share'],
        getExportRows: (rows) => rows.map((row) => [row.status, row.count, row.share]),
      },
      program_status: {
        title: 'Program Status Breakdown',
        subtitle: `${programTotal} total programs`,
        columns: [
          { key: 'status', header: 'Status' },
          { key: 'count', header: 'Programs', align: 'right' },
          { key: 'share', header: 'Share', align: 'right' },
        ],
        rows: programStatusCounts.map((item) => ({
          ...item,
          share: toPercent(item.count, programTotal),
        })),
        exportColumns: ['Status', 'Programs', 'Share'],
        getExportRows: (rows) => rows.map((row) => [row.status, row.count, row.share]),
      },
      top_programs: {
        title: 'Top Programs by Volume',
        subtitle: 'Highest submission activity',
        columns: [
          {
            key: 'program',
            header: 'Program',
            render: (row) => (
              <div style={{ display: 'grid', gap: '0.14rem' }}>
                <strong>{row.title}</strong>
                <small style={{ color: 'var(--pf-setting-tertiary-text, var(--pf-ink-muted))' }}>{row.category}</small>
              </div>
            ),
          },
          { key: 'applications', header: 'Applications', align: 'right' },
          { key: 'pending', header: 'Pending', align: 'right' },
          { key: 'approved', header: 'Approved', align: 'right' },
          { key: 'deadline', header: 'Deadline', render: (row) => formatDate(row.deadline) },
          { key: 'status', header: 'Status', render: (row) => <StatusPill status={row.status} /> },
        ],
        rows: topPrograms,
        exportColumns: ['Program', 'Category', 'Applications', 'Pending', 'Approved', 'Deadline', 'Status'],
        getExportRows: (rows) =>
          rows.map((row) => [
            row.title,
            row.category,
            row.applications,
            row.pending,
            row.approved,
            formatDate(row.deadline),
            row.status,
          ]),
      },
      recent_activity: {
        title: 'Recent Activity',
        subtitle: 'Latest submissions and reviewed records',
        columns: [
          {
            key: 'applicant',
            header: 'Applicant',
            render: (row) => (
              <div style={{ display: 'grid', gap: '0.14rem' }}>
                <strong>{row.applicantName}</strong>
                <small style={{ color: 'var(--pf-setting-tertiary-text, var(--pf-ink-muted))' }}>{row.applicantEmail}</small>
                <small style={{ color: 'var(--pf-setting-tertiary-text, var(--pf-ink-muted))' }}>{row.id}</small>
              </div>
            ),
          },
          { key: 'status', header: 'Status', render: (row) => <StatusPill status={row.status} /> },
          { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
          { key: 'program', header: 'Program', render: (row) => row.programTitle },
        ],
        rows: recentActivity,
        exportColumns: ['Applicant', 'Email', 'Application ID', 'Status', 'Submitted', 'Program'],
        getExportRows: (rows) =>
          rows.map((row) => [
            row.applicantName,
            row.applicantEmail,
            row.id,
            row.status,
            formatDate(row.submittedAt),
            row.programTitle,
          ]),
      },
    };
  }, [filteredApplications.length, filteredPrograms.length, programStatusCounts, recentActivity, statusCounts, topPrograms]);

  const selectedView = reportViews[activeReport] || reportViews.application_status;

  const handleExportPdf = () => {
    if (!selectedView.rows.length) return;
    openPrintableReport({
      title: selectedView.title,
      subtitle: selectedView.subtitle,
      columns: selectedView.exportColumns,
      rows: selectedView.getExportRows(selectedView.rows),
    });
  };

  return (
    <>
      <style>{`
        .reports-shell{display:grid;gap:1rem}
        .reports-toolbar{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.9fr) auto;gap:.8rem;align-items:end}
        .reports-table-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:.75rem}
        .reports-table-head h3{margin:0;font-size:1.2rem;color:var(--pf-setting-primary-text,var(--pf-ink))}
        .reports-table-head p{margin:.15rem 0 0;color:var(--pf-setting-secondary-text,var(--pf-ink-muted));font-size:.92rem}
        .reports-export{align-self:end}
        .reports-cell-mono{font-variant-numeric:tabular-nums}
        @media (max-width:1120px){.reports-toolbar{grid-template-columns:1fr 1fr}.reports-export{grid-column:1 / -1}}
        @media (max-width:760px){.reports-toolbar{grid-template-columns:1fr}}
      `}</style>

      <div className="dashboard-grid reports-shell">
        <div className="section-card">
          <SectionHeading
            eyebrow="Office Reports"
            title="Reports Table"
            text="Table view for office application and program records using live data."
          />

          <div className="reports-toolbar" style={{ marginTop: '.9rem' }}>
            <FormField
              label="Search records"
              value={search}
              onChange={setSearch}
              placeholder="Search by applicant, program, status, type, or ID"
            />

            <SelectField
              label="Record type"
              options={REPORT_OPTIONS}
              value={activeReport}
              onChange={setActiveReport}
            />

            <ActionButton
              tone="primary"
              className="reports-export"
              disabled={!selectedView.rows.length}
              onClick={handleExportPdf}
            >
              Export PDF
            </ActionButton>
          </div>
        </div>

        <div className="section-card">
          <div className="reports-table-head">
            <div>
              <h3>{selectedView.title}</h3>
              <p>{selectedView.subtitle}</p>
            </div>
          </div>

          {selectedView.rows.length ? (
            <AppTable
              columns={selectedView.columns}
              rows={selectedView.rows}
              getRowKey={(row, index) => row.id || `${row.status || row.title || 'row'}-${index}`}
            />
          ) : (
            <EmptyState
              title="No records found"
              text="No rows matched the current search and selected record type."
            />
          )}
        </div>
      </div>
    </>
  );
}
