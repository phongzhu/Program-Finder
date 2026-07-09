import { useEffect, useState } from 'react';
import { AppButton, DetailItem, EmptyState, FormField, SectionHeading, StatusPill } from 'Components/UI';
import { canReviewApplicants, getAccountRoleLabel } from 'Utils/staffHierarchy';
import { getManagedApplications, getProgramById } from 'Services/Personnel/personnel-utils';

export default function ApplicationDecisionsScreen({ session, data, actions }) {
  const hasApplicantAccess = canReviewApplicants(session);
  const applications = getManagedApplications(data, session);
  const [selectedId, setSelectedId] = useState(applications[0]?.id || null);
  const [reviewNote, setReviewNote] = useState('Ready for evaluation.');

  useEffect(() => {
    if (!applications.find((application) => application.id === selectedId)) {
      setSelectedId(applications[0]?.id || null);
    }
  }, [applications, selectedId]);

  const selectedApplication = applications.find((application) => application.id === selectedId);

  useEffect(() => {
    setReviewNote(selectedApplication?.rejectionReason || selectedApplication?.reviewerNote || 'Ready for evaluation.');
  }, [selectedApplication?.id, selectedApplication?.rejectionReason, selectedApplication?.reviewerNote]);

  if (!hasApplicantAccess) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Decision queue" title="Application decisions" text="Decision actions are limited to roles that can review applicants." />
        <EmptyState
          title="Application decisions are locked"
          text={`${getAccountRoleLabel(session)} access cannot approve, reject, or mark applicant submissions incomplete.`}
        />
      </div>
    );
  }

  return (
    <div className="content-grid">
      <div className="section-card">
        <SectionHeading eyebrow="Decision queue" title="Application decisions" />
        <div className="stack-list">
          {applications.map((application) => (
            <button
              className={`program-list-card ${selectedApplication?.id === application.id ? 'is-selected' : ''}`}
              key={application.id}
              onClick={() => setSelectedId(application.id)}
            >
              <div className="program-list-top">
                <strong>{application.applicantName}</strong>
                <StatusPill status={application.status} />
              </div>
              <p>{getProgramById(data.programs, application.programId)?.title}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        {selectedApplication ? (
          <>
            <SectionHeading eyebrow={getProgramById(data.programs, selectedApplication.programId)?.title} title={selectedApplication.applicantName} text={selectedApplication.notes} />
            <div className="detail-grid">
              <DetailItem label="Status" value={selectedApplication.status} />
              <DetailItem label="Priority" value={selectedApplication.priority} />
              <DetailItem label="Completeness" value={`${selectedApplication.completeness}%`} />
              <DetailItem label="Office" value={selectedApplication.office} />
            </div>

            <FormField label="Review note" type="textarea" value={reviewNote} onChange={setReviewNote} />
            <div className="card-actions wrap-actions">
              <AppButton onClick={() => actions.reviewApplication(selectedApplication.id, 'Approved', reviewNote)} variant="primary">
                Approve
              </AppButton>
              <AppButton onClick={() => actions.reviewApplication(selectedApplication.id, 'Incomplete', reviewNote)} variant="secondary">
                Mark incomplete
              </AppButton>
              <AppButton onClick={() => actions.reviewApplication(selectedApplication.id, 'Rejected', reviewNote)} variant="ghost">
                Reject
              </AppButton>
            </div>
          </>
        ) : (
          <EmptyState title="No application selected" text="Choose a submitted application from the list first." />
        )}
      </div>
    </div>
  );
}
