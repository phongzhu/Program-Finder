import { SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getOfficeApplications } from './helpers';

export default function ApplicantRecordsScreen({ session, data }) {
  const applications = getOfficeApplications(data, session);
  const applicantRecords = [...new Map(applications.map((item) => [item.applicantEmail, item])).values()];

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Applicant directory" title="Applicant records" text="Use this module to inspect applicants associated with programs handled by the current office." />
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
