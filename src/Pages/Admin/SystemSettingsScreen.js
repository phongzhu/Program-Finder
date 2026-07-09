import { useState } from 'react';
import { AppButton, EmptyState, FileTriggerButton, SectionHeading, StatusPill } from 'Components/UI';

const SYSTEM_TABS = [
  { key: 'backup', label: 'Backup & Restore' },
  { key: 'audit', label: 'Audit Trail' },
];

const BACKUP_HISTORY_TABS = [
  { key: 'backup-history', label: 'Backup History' },
  { key: 'restore-history', label: 'Restore History' },
];

const SETTINGS_ACTION_BUTTON_STYLE = {
  minHeight: '3.15rem',
  padding: '0.9rem 1.45rem',
  fontSize: '1rem',
  whiteSpace: 'nowrap',
  boxShadow: '0 14px 28px rgba(31, 90, 54, 0.2)',
};

const SETTINGS_RESTORE_BUTTON_STYLE = {
  minHeight: '3.25rem',
  fontSize: '1rem',
  boxShadow: '0 16px 28px rgba(31, 90, 54, 0.22)',
};

const SETTINGS_FILE_TRIGGER_STYLE = {
  minHeight: '3.1rem',
  padding: '0.85rem 1.1rem',
  borderRadius: '1rem',
  border: '1px solid var(--pf-border)',
  background: 'var(--pf-card)',
  color: 'var(--pf-on-tertiary)',
  boxShadow: '0 12px 24px rgba(18, 32, 25, 0.08)',
};

function SystemTabButton({ active, children, ...props }) {
  return (
    <button
      className={`settings-tab-button ${active ? 'is-active' : ''}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function formatUploadSize(sizeInBytes) {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
    return 'Uploaded file';
  }

  if (sizeInBytes >= 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
}

export default function SystemSettingsScreen({ data, actions }) {
  const [activeTab, setActiveTab] = useState('backup');
  const [activeBackupHistoryTab, setActiveBackupHistoryTab] = useState('backup-history');
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreInputKey, setRestoreInputKey] = useState(0);
  const completedBackups = data.backupHistory.filter((backup) => backup.status === 'Completed').length;
  const latestBackup = data.backupHistory[0] || null;
  const latestAudit = data.auditLogs[0] || null;
  const restoreHistory = data.restoreHistory || [];
  const latestRestore = restoreHistory[0] || null;

  const handleRestoreFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setRestoreFile(null);
      return;
    }

    setRestoreFile({
      fileName: file.name,
      size: formatUploadSize(file.size),
      source: 'Uploaded Backup File',
    });
  };

  const handleRestoreSubmit = () => {
    actions.requestConfirmation({
      title: 'Restore database from file?',
      message: 'Make sure the selected backup file is correct before starting the restore flow.',
      confirmLabel: 'Restore Database',
      tone: 'danger',
      onConfirm: () => {
        const result = actions.restoreBackup(restoreFile);
        if (result?.ok) {
          setRestoreFile(null);
          setRestoreInputKey((current) => current + 1);
        }
      },
    });
  };

  const handleCreateBackup = () => {
    actions.requestConfirmation({
      title: 'Create manual backup?',
      message: 'Create a fresh backup snapshot for the current platform state.',
      confirmLabel: 'Create Backup',
      onConfirm: actions.createBackup,
    });
  };

  return (
    <>
      <style>{`
        .settings-hub,
        .settings-tab-strip,
        .settings-summary-grid,
        .settings-meta-grid,
        .settings-backup-panel,
        .settings-audit-panel,
        .settings-utility-grid,
        .settings-backup-row,
        .settings-audit-row,
        .settings-audit-meta,
        .settings-upload-card,
        .settings-history-panel,
        .settings-upload-meta,
        .settings-subtab-strip,
        .settings-history-scroll {
          display:grid;
          gap:1rem;
        }
        .settings-shell-card,
        .settings-meta-chip,
        .settings-backup-row,
        .settings-audit-row,
        .settings-upload-card,
        .settings-history-card {
          padding:1rem 1.05rem;
          border-radius:22px;
          border:1px solid var(--pf-border);
          background:var(--pf-card);
          box-shadow:var(--pf-shadow-sm);
        }
        .settings-shell-card,
        .settings-upload-card {
          background:var(--pf-card);
        }
        .settings-tab-strip {
          grid-template-columns:repeat(2,minmax(0,1fr));
          width:min(100%,30rem);
        }
        .settings-tab-button {
          padding:.9rem 1rem;
          border-radius:999px;
          background:var(--pf-accent-soft);
          border:1px solid var(--pf-border);
          color:var(--accent-deep);
          font-weight:800;
        }
        .settings-tab-button.is-active {
          background:var(--pf-accent);
          color:var(--pf-on-primary);
          border-color:transparent;
          box-shadow:0 12px 24px color-mix(in srgb, var(--pf-accent) 18%, transparent);
        }
        .settings-summary-grid,
        .settings-meta-grid {
          grid-template-columns:repeat(3,minmax(0,1fr));
        }
        .settings-utility-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
          align-items:start;
        }
        .settings-subtab-strip {
          grid-template-columns:repeat(2,minmax(0,1fr));
          width:min(100%,26rem);
        }
        .settings-meta-chip small,
        .settings-backup-row p,
        .settings-audit-row p,
        .settings-audit-meta small,
        .settings-upload-card p,
        .settings-history-card p {
          color:var(--pf-ink-muted);
        }
        .settings-meta-chip strong {
          display:block;
          margin:.15rem 0 .2rem;
          font-size: 1.375rem;
        }
        .settings-meta-chip p,
        .settings-backup-row p,
        .settings-audit-row p,
        .settings-upload-card p,
        .settings-history-card p {
          margin:0;
          line-height:1.55;
        }
        .settings-panel-head,
        .settings-backup-top,
        .settings-audit-top,
        .settings-history-top {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:1rem;
          flex-wrap:wrap;
        }
        .settings-panel-head > :first-child {
          flex:1 1 22rem;
          min-width:0;
        }
        .settings-panel-head-action {
          flex:0 0 auto;
          align-self:flex-start;
        }
        .settings-backup-row,
        .settings-audit-row,
        .settings-history-card {
          gap:.7rem;
          background:
            var(--pf-card);
        }
        .settings-backup-row strong,
        .settings-audit-row strong,
        .settings-history-card strong {
          margin:0;
        }
        .settings-audit-meta {
          grid-template-columns:minmax(0,1fr) auto;
          align-items:end;
        }
        .settings-audit-role {
          justify-self:end;
        }
        .settings-upload-box {
          display:grid;
          gap:.8rem;
          padding:1rem;
          border-radius:20px;
          border:1px dashed var(--pf-border);
          background:var(--pf-card);
        }
        .settings-upload-trigger-row {
          display:flex;
          align-items:center;
          gap:.85rem;
          flex-wrap:wrap;
        }
        .settings-upload-trigger-copy {
          color:var(--pf-ink-muted);
          font-size:.94rem;
          font-weight:600;
          line-height:1.45;
        }
        .settings-upload-trigger-copy strong {
          color:var(--pf-ink);
          display:block;
          margin-bottom:.12rem;
        }
        .settings-upload-meta {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
        .settings-upload-chip {
          padding:.88rem .95rem;
          border-radius:18px;
          background:var(--pf-card);
          border:1px solid var(--pf-border);
        }
        .settings-upload-chip small {
          display:block;
          margin-bottom:.2rem;
          color:var(--pf-ink-muted);
        }
        .settings-form-note {
          padding:.95rem 1rem;
          border-radius:18px;
          background:var(--pf-accent-soft);
          border:1px solid var(--pf-border);
        }
        .settings-form-note strong {
          display:block;
          margin-bottom:.25rem;
        }
        .settings-form-note p {
          margin:0;
        }
        .settings-history-panel,
        .settings-upload-card {
          align-content:start;
        }
        .settings-history-scroll {
          max-height:34rem;
          overflow-y:auto;
          padding-right:.3rem;
          align-content:start;
        }
        .settings-history-scroll::-webkit-scrollbar {
          width:.55rem;
        }
        .settings-history-scroll::-webkit-scrollbar-thumb {
          border-radius:999px;
          background:color-mix(in srgb, var(--pf-accent) 22%, transparent);
        }
        .settings-history-scroll::-webkit-scrollbar-track {
          border-radius:999px;
          background:color-mix(in srgb, var(--pf-ink-muted) 8%, transparent);
        }
        @media (max-width:1180px) {
          .settings-summary-grid,
          .settings-meta-grid,
          .settings-upload-meta {
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .settings-utility-grid {
            grid-template-columns:1fr;
          }
        }
        @media (max-width:820px) {
          .settings-tab-strip,
          .settings-subtab-strip,
          .settings-summary-grid,
          .settings-meta-grid,
          .settings-audit-meta,
          .settings-upload-meta {
            grid-template-columns:1fr;
          }
          .settings-audit-role {
            justify-self:start;
          }
        }
      `}</style>

      <div className="dashboard-grid">
        <div className="section-card settings-hub">
          <SectionHeading
            eyebrow="Platform controls"
            title="Settings hub"
            text="Backups, restore intake, and audit monitoring."
          />

          <div className="settings-tab-strip" role="tablist" aria-label="System settings tabs">
            {SYSTEM_TABS.map((tab) => (
              <SystemTabButton
                key={tab.key}
                active={activeTab === tab.key}
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
              >
                {tab.label}
              </SystemTabButton>
            ))}
          </div>

          {activeTab === 'backup' ? (
            <div className="settings-backup-panel">
              <div className="section-card settings-shell-card">
                <div className="settings-panel-head">
                  <SectionHeading
                    eyebrow="Snapshot center"
                    title="Backup and restore"
                    text="Create fresh snapshots, upload a backup file for restore, and review both backup and restore activity in one place."
                  />
                  <AppButton
                    className="settings-panel-head-action"
                    onClick={handleCreateBackup}
                    style={SETTINGS_ACTION_BUTTON_STYLE}
                    type="button"
                    variant="primary"
                  >
                    Create manual backup
                  </AppButton>
                </div>

                <div className="settings-summary-grid">
                  <article className="settings-meta-chip">
                    <small>Latest snapshot</small>
                    <strong>{latestBackup ? latestBackup.type : 'No backups yet'}</strong>
                    <p>{latestBackup ? latestBackup.date : 'Create the first backup snapshot.'}</p>
                  </article>
                  <article className="settings-meta-chip">
                    <small>Backup completion</small>
                    <strong>{completedBackups}/{data.backupHistory.length || 0}</strong>
                    <p>
                      {completedBackups === data.backupHistory.length
                        ? 'Recent snapshots completed successfully.'
                        : 'Some snapshots need review.'}
                    </p>
                  </article>
                  <article className="settings-meta-chip">
                    <small>Latest restore</small>
                    <strong>{latestRestore ? latestRestore.status : 'No restores yet'}</strong>
                    <p>{latestRestore ? latestRestore.fileName : 'Upload a backup file to begin a restore flow.'}</p>
                  </article>
                </div>
              </div>

              <div className="settings-utility-grid">
                <div className="section-card settings-upload-card">
                  <SectionHeading
                    eyebrow="Restore upload"
                    title="Restore database from file"
                    text="Upload a backup package here before starting the restore flow."
                  />

                  <div className="settings-upload-box">
                    <div className="settings-upload-trigger-row">
                      <FileTriggerButton
                      accept=".sql,.bak,.zip,.json"
                      key={restoreInputKey}
                      onChange={handleRestoreFileChange}
                      style={SETTINGS_FILE_TRIGGER_STYLE}
                    >
                        Choose backup file
                      </FileTriggerButton>
                      <div className="settings-upload-trigger-copy">
                        <strong>{restoreFile?.fileName || 'No file chosen yet'}</strong>
                        <span>Accepted restore files: `.sql`, `.bak`, `.zip`, `.json`</span>
                      </div>
                    </div>
                    <div className="settings-upload-meta">
                      <article className="settings-upload-chip">
                        <small>Selected file</small>
                        <strong>{restoreFile?.fileName || 'No file selected'}</strong>
                      </article>
                      <article className="settings-upload-chip">
                        <small>Estimated size</small>
                        <strong>{restoreFile?.size || 'Waiting for upload'}</strong>
                      </article>
                    </div>
                  </div>

                  <div className="settings-form-note">
                    <strong>Restore note</strong>
                    <p>
                      The user uploads the restore file in this section. Accepted file types are `.sql`, `.bak`, `.zip`, and `.json`.
                    </p>
                  </div>

                  <AppButton
                    disabled={!restoreFile}
                    fullWidth
                    onClick={handleRestoreSubmit}
                    style={SETTINGS_RESTORE_BUTTON_STYLE}
                    type="button"
                    variant="primary"
                  >
                    Restore database
                  </AppButton>
                </div>

                <div className="section-card settings-history-panel">
                  <SectionHeading
                    eyebrow="Recent history"
                    title="Backup and restore records"
                    text="Use the inner tabs below to switch between backup snapshots and restore activity."
                  />

                  <div className="settings-subtab-strip" role="tablist" aria-label="Backup history tabs">
                    {BACKUP_HISTORY_TABS.map((tab) => (
                      <SystemTabButton
                        key={tab.key}
                        active={activeBackupHistoryTab === tab.key}
                        aria-selected={activeBackupHistoryTab === tab.key}
                        onClick={() => setActiveBackupHistoryTab(tab.key)}
                        role="tab"
                      >
                        {tab.label}
                      </SystemTabButton>
                    ))}
                  </div>

                  {activeBackupHistoryTab === 'backup-history' ? (
                    data.backupHistory.length ? (
                      <div className="stack-list compact settings-history-scroll">
                        {data.backupHistory.map((backup) => (
                          <article className="settings-backup-row" key={backup.id}>
                            <div className="settings-backup-top">
                              <div>
                                <strong>{backup.type}</strong>
                                <p>{backup.date}</p>
                              </div>
                              <StatusPill status={backup.status} />
                            </div>
                            <small>{backup.size}</small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No backup history yet"
                        text="Manual and automated snapshots will appear here once recorded."
                      />
                    )
                  ) : null}

                  {activeBackupHistoryTab === 'restore-history' ? (
                    restoreHistory.length ? (
                      <div className="stack-list compact settings-history-scroll">
                        {restoreHistory.map((restore) => (
                          <article className="settings-history-card" key={restore.id}>
                            <div className="settings-history-top">
                              <div>
                                <strong>{restore.fileName}</strong>
                                <p>{restore.date}</p>
                              </div>
                              <StatusPill status={restore.status} />
                            </div>
                            <p>{restore.source}</p>
                            <small>{restore.size} | initiated by {restore.initiatedBy}</small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No restore operations yet"
                        text="Uploaded restore packages will appear here after the restore flow is triggered."
                      />
                    )
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'audit' ? (
            <div className="settings-audit-panel">
              <div className="section-card settings-shell-card">
                <SectionHeading
                  eyebrow="System activity"
                  title="Audit trail"
                  text="Review recent platform actions in a cleaner, easier-to-scan activity feed."
                />

                <div className="settings-meta-grid">
                  <article className="settings-meta-chip">
                    <small>Most recent actor</small>
                    <strong>{latestAudit?.actor || 'No audit logs yet'}</strong>
                    <p>{latestAudit?.action || 'Recent activity will appear once actions are logged.'}</p>
                  </article>
                  <article className="settings-meta-chip">
                    <small>Latest module</small>
                    <strong>{latestAudit?.module || 'System activity'}</strong>
                    <p>{latestAudit?.time || 'No timestamps available yet.'}</p>
                  </article>
                  <article className="settings-meta-chip">
                    <small>Recorded entries</small>
                    <strong>{data.auditLogs.length}</strong>
                    <p>Recent audit items available for captain review.</p>
                  </article>
                </div>
              </div>

              {data.auditLogs.length ? (
                <div className="stack-list compact">
                  {data.auditLogs.map((log) => (
                    <article className="settings-audit-row" key={log.id}>
                      <div className="settings-audit-top">
                        <strong>{log.actor}</strong>
                        <StatusPill status={log.module} />
                      </div>
                      <p>{log.action}</p>
                      <div className="settings-audit-meta">
                        <small>{log.time}</small>
                        <span className="settings-audit-role">
                          <StatusPill status={log.role} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No audit entries yet"
                  text="Audit items will show up here as captains, personnel, and applicants use the platform."
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}


