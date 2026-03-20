import { DetailItem, SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getApplicantApplications, getProgramById } from './helpers';

export default function ApplicantProgramViewScreen({ session, data, actions, navigate }) {
  const selectedProgram = getProgramById(data.programs, data.composer.programId);
  const applicantApplications = getApplicantApplications(data, session);
  const existingApplication = selectedProgram
    ? applicantApplications.find((application) => application.programId === selectedProgram.id)
    : null;

  if (!selectedProgram) {
    return (
      <div className="section-card">
        <SectionHeading
          eyebrow="Program details"
          title="No program selected"
          text="Open Search Programs, then select View Program to review a listing."
        />
        <div className="card-actions">
          <button className="primary-button" onClick={() => navigate('/applicant/search-programs')}>
            Back to Search Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-grid">
      <div className="section-card section-card-wide">
        <SectionHeading
          eyebrow={selectedProgram.category}
          title={selectedProgram.title}
          text={selectedProgram.description || selectedProgram.summary}
        />

        <div className="detail-grid">
          <DetailItem label="Office" value={selectedProgram.office} />
          <DetailItem label="Municipality" value={selectedProgram.municipality} />
          <DetailItem label="Application period" value={`${selectedProgram.applicationStartDate} to ${selectedProgram.applicationEndDate}`} />
          <DetailItem label="Deadline" value={selectedProgram.deadline} />
          <DetailItem label="Status" value={selectedProgram.status} />
          <DetailItem label="Estimated fit" value={`${selectedProgram.fitScore}%`} />
        </div>

        <div className="content-grid">
          <article className="section-card">
            <SectionHeading eyebrow="Objective" title="Why this program exists" text={selectedProgram.objective || 'No objective provided.'} />
            <p className="dashboard-text">{selectedProgram.benefits || 'No benefit summary provided.'}</p>
            <p className="dashboard-text">{selectedProgram.coverageNotes || 'No coverage notes provided.'}</p>
          </article>

          <article className="section-card">
            <SectionHeading eyebrow="Submission" title="Instructions" text={selectedProgram.submissionInstructions || 'No submission instructions provided.'} />
            <p className="dashboard-text">{selectedProgram.additionalNotes || 'No additional notes provided.'}</p>
          </article>
        </div>

        <div className="content-grid">
          <article className="section-card">
            <SectionHeading eyebrow="Eligibility" title="Who can apply" />
            <div className="stack-list compact">
              {selectedProgram.eligibility.map((item) => (
                <div className="list-row" key={item}>
                  <span className="bullet-mark" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="section-card">
            <SectionHeading eyebrow="Requirements" title="Documents needed before applying" />
            <div className="stack-list compact">
              {selectedProgram.requirements.map((item) => (
                <div className="list-row" key={item}>
                  <span className="bullet-mark" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        {existingApplication ? (
          <div className="list-row">
            <div>
              <strong>Existing application found</strong>
              <p>
                You already have an application for this program. Track it in Manage Applications.
              </p>
            </div>
            <StatusPill status={existingApplication.status} />
          </div>
        ) : null}

        <div className="card-actions">
          <button className="secondary-button" onClick={() => navigate('/applicant/search-programs')}>
            Back to Search Programs
          </button>
          {existingApplication ? (
            <button className="primary-button" onClick={() => navigate('/applicant/manage-applications')}>
              Go to Manage Applications
            </button>
          ) : (
            <button className="primary-button" onClick={() => actions.startApplication(selectedProgram.id)}>
              Apply for this Program
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
