import { useEffect, useState } from 'react';
import { DetailItem, EmptyState, FormField, SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getOfficeApplications, getProgramById } from './helpers';

export default function ApplicationDecisionsScreen({ session, data, actions }) {
  const applications = getOfficeApplications(data, session);
  const [selectedId, setSelectedId] = useState(applications[0]?.id || null);
  const [reviewNote, setReviewNote] = useState('Ready for evaluation.');

  useEffect(() => {
    if (!applications.find((application) => application.id === selectedId)) {
      setSelectedId(applications[0]?.id || null);
    }
  }, [applications, selectedId]);

  const selectedApplication = applications.find((application) => application.id === selectedId);

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
              <button className="primary-button" onClick={() => actions.reviewApplication(selectedApplication.id, 'Approved', reviewNote)}>
                Approve
              </button>
              <button className="secondary-button" onClick={() => actions.reviewApplication(selectedApplication.id, 'Incomplete', reviewNote)}>
                Mark incomplete
              </button>
              <button className="ghost-button" onClick={() => actions.reviewApplication(selectedApplication.id, 'Rejected', reviewNote)}>
                Reject
              </button>
            </div>
          </>
        ) : (
          <EmptyState title="No application selected" text="Choose a submitted application from the list first." />
        )}
      </div>
    </div>
  );
}
