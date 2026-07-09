import { SectionHeading, StatusPill } from 'Components/UI';

export default function AuditTrailScreen({ data }) {
  return (
    <div className="section-card">
      <SectionHeading eyebrow="System activity" title="Audit trail" text="Track user actions across the platform from the most recent captured logs." />
      <div className="stack-list">
        {data.auditLogs.map((log) => (
          <article className="audit-card" key={log.id}>
            <div className="program-list-top">
              <strong>{log.actor}</strong>
              <StatusPill status={log.role} />
            </div>
            <p>{log.action}</p>
            <small>
              {log.module} | {log.time}
            </small>
          </article>
        ))}
      </div>
    </div>
  );
}
