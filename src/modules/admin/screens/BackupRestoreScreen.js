import { SectionHeading, StatusPill } from '../../../shared/components/ui';

export default function BackupRestoreScreen({ data, actions }) {
  return (
    <div className="content-grid">
      <div className="section-card">
        <SectionHeading eyebrow="Snapshots" title="Backup and restore" text="Review the backup history and trigger a fresh manual snapshot for presentation flow." />
        <div className="stack-list">
          {data.backupHistory.map((backup) => (
            <article className="list-row" key={backup.id}>
              <StatusPill status={backup.status} />
              <div>
                <strong>{backup.type}</strong>
                <p>
                  {backup.date} | {backup.size}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="section-card">
        <SectionHeading eyebrow="Manual action" title="Create backup snapshot" />
        <div className="card-actions">
          <button className="primary-button" onClick={actions.createBackup}>
            Create manual backup
          </button>
        </div>
      </div>
    </div>
  );
}
