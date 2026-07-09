import { SectionHeading, StatusPill } from 'Components/UI';
import { canReviewApplicants, getAccountRoleLabel } from 'Utils/staffHierarchy';
import { getManagedApplications, getProgramById } from 'Services/Personnel/personnel-utils';

export default function SubmittedApplicationsScreen({ session, data }) {
  if (!canReviewApplicants(session)) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Incoming queue" title="Submitted applications" text="Submitted applications are only visible to roles with applicant review access." />
        <p className="body-text">{`${getAccountRoleLabel(session)} access cannot inspect submitted applications.`}</p>
      </div>
    );
  }

  const applications = getManagedApplications(data, session);

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Incoming queue" title="Submitted applications" text="Review the tracked application list before moving to the decision module." />
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
