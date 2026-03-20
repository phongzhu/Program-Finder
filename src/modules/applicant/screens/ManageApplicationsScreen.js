import { EmptyState, SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getApplicantApplications, getProgramById } from './helpers';

export default function ManageApplicationsScreen({ session, data }) {
  const applications = getApplicantApplications(data, session);
  const activeCount = applications.filter((application) =>
    ['Submitted', 'For Review', 'Incomplete'].includes(application.status)
  ).length;
  const approvedCount = applications.filter((application) => application.status === 'Approved').length;

  return (
    <div className="content-grid">
      <div className="section-card section-card-wide">
        <SectionHeading eyebrow="Application tracker" title="Manage applications" text="Track current statuses, review submission progress, and inspect the full activity timeline of every application." />
        <div className="card-grid">
          <article className="metric-card">
            <span>Submitted applications</span>
            <strong>{applications.length}</strong>
          </article>
          <article className="metric-card">
            <span>Active reviews</span>
            <strong>{activeCount}</strong>
          </article>
          <article className="metric-card">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </article>
        </div>
        {applications.length ? (
          <div className="stack-list">
            {applications.map((application) => {
              const program = getProgramById(data.programs, application.programId);
              return (
                <article className="submission-card" key={application.id}>
                  <div className="program-list-top">
                    <strong>{program?.title || 'Program'}</strong>
                    <StatusPill status={application.status} />
                  </div>
                  <p>{application.notes}</p>
                  <small>
                    Submitted {application.submittedAt} | {application.completeness}% complete
                  </small>
                  <div className="history-list">
                    {application.history.map((item) => (
                      <div className="history-item" key={`${application.id}-${item.time}`}>
                        <strong>{item.status}</strong>
                        <p>{item.detail}</p>
                        <small>{item.time}</small>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No submitted applications yet" text="Use Search Programs to start an application and track it here." />
        )}
      </div>
    </div>
  );
}
