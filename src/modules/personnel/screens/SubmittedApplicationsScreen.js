import { SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getOfficeApplications, getProgramById } from './helpers';

export default function SubmittedApplicationsScreen({ session, data }) {
  const applications = getOfficeApplications(data, session);

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Incoming queue" title="Submitted applications" text="Review the list of applications routed to this office before moving to the decision module." />
      <div className="stack-list">
        {applications.map((application) => (
          <article className="submission-card" key={application.id}>
            <div className="program-list-top">
              <strong>{application.applicantName}</strong>
              <StatusPill status={application.status} />
            </div>
            <p>{getProgramById(data.programs, application.programId)?.title}</p>
            <small>
              Submitted {application.submittedAt} | {application.completeness}% complete
            </small>
          </article>
        ))}
      </div>
    </div>
  );
}
