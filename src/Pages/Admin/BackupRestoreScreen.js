import { AppButton, AppCard, AppTable, SectionHeading, StatusPill } from 'Components/UI';

export default function BackupRestoreScreen({ data, actions }) {
  const handleCreateBackup = () => {
    actions.requestConfirmation({
      title: 'Create manual backup?',
      message: 'Create a fresh backup snapshot for the current platform state.',
      confirmLabel: 'Create Backup',
      onConfirm: actions.createBackup,
    });
  };

  return (
    <div className="content-grid">
      <AppCard className="section-card">
        <SectionHeading eyebrow="Snapshots" title="Backup and restore" text="Review the backup history and trigger a fresh manual snapshot for presentation flow." />
        <AppTable
          columns={[
            {
              header: 'Status',
              key: 'status',
              render: (backup) => <StatusPill status={backup.status} />,
            },
            {
              header: 'Snapshot',
              key: 'type',
              render: (backup) => <strong>{backup.type}</strong>,
            },
            {
              header: 'Details',
              key: 'date',
              render: (backup) => (
                <span>
                  {backup.date} | {backup.size}
                </span>
              ),
            },
          ]}
          getRowKey={(backup) => backup.id}
          rows={data.backupHistory}
        />
      </AppCard>

      <AppCard className="section-card">
        <SectionHeading eyebrow="Manual action" title="Create backup snapshot" />
        <div className="card-actions">
          <AppButton onClick={handleCreateBackup} variant="primary">
            Create manual backup
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
}
