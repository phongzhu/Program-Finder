import { SectionHeading, StatusPill } from 'Components/UI';
import { canReviewApplicants, getAccountRoleLabel } from 'Utils/staffHierarchy';
import { getManagedApplications } from 'Services/Personnel/personnel-utils';

export default function ApplicantRecordsScreen({ session, data }) {
  if (!canReviewApplicants(session)) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Applicant directory" title="Applicant records" text="Applicant records are only available to roles with review access." />
        <p className="body-text">{`${getAccountRoleLabel(session)} access cannot open applicant records.`}</p>
      </div>
    );
  }

  const applications = getManagedApplications(data, session);
  const applicantRecords = [...new Map(applications.map((item) => [item.applicantEmail, item])).values()];

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Applicant directory" title="Applicant records" text="Use this module to inspect applicants associated with tracked platform submissions." />
      <div className="stack-list">
        {applicantRecords.map((record) => (
          <article className="list-row" key={record.applicantEmail}>
            <StatusPill status={record.status} />
            <div>
              <strong>{record.applicantName}</strong>
              <p>{record.applicantEmail}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
