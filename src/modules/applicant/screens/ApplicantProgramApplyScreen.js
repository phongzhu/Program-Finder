import { useState } from 'react';
import { DetailItem, FormField, SectionHeading } from '../../../shared/components/ui';
import { getApplicantDocuments, getProgramById } from './helpers';

export default function ApplicantProgramApplyScreen({ session, data, actions, navigate }) {
  const selectedProgram = getProgramById(data.programs, data.composer.programId);
  const attachedDocs = data.composer.attachedDocs;
  const applicantDocuments = getApplicantDocuments(data, session);
  const [uploadError, setUploadError] = useState('');

  const getRequirementDocument = (requirement) =>
    applicantDocuments.find((document) => document.name.toLowerCase() === requirement.toLowerCase());

  const handleRequirementUpload = async (requirement, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const fileUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('File upload failed.'));
      reader.readAsDataURL(file);
    }).catch(() => null);

    if (!fileUrl) {
      setUploadError('File upload failed. Please try again.');
      return;
    }

    setUploadError('');
    actions.uploadRequirementFile(requirement, {
      fileName: file.name,
      fileType: file.type || 'File',
      fileUrl,
    });
  };

  if (!selectedProgram) {
    return (
      <div className="section-card">
        <SectionHeading
          eyebrow="Program application"
          title="No selected program"
          text="Open Search Programs and choose Apply on a program first."
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
      <style>{`
        .applicant-requirement-list {
          display:grid;
          gap:.9rem;
          margin-top:1rem;
        }
        .applicant-requirement-row {
          display:grid;
          gap:.9rem;
          padding:1rem 1.05rem;
          border-radius:20px;
          border:1px solid rgba(24,111,67,.08);
          background:rgba(255,255,255,.88);
        }
        .applicant-requirement-top,
        .applicant-requirement-actions {
          display:flex;
          gap:1rem;
          align-items:flex-start;
          justify-content:space-between;
          flex-wrap:wrap;
        }
        .applicant-requirement-check {
          display:flex;
          align-items:flex-start;
          gap:.8rem;
        }
        .applicant-requirement-check input {
          margin-top:.22rem;
          width:1rem;
          height:1rem;
          accent-color:var(--pf-accent);
        }
        .applicant-requirement-copy strong {
          display:block;
          margin-bottom:.22rem;
        }
        .applicant-requirement-copy p,
        .applicant-requirement-copy small,
        .applicant-document-meta p {
          margin:0;
          color:var(--pf-ink-muted);
          line-height:1.5;
        }
        .applicant-requirement-upload {
          display:grid;
          gap:.45rem;
        }
        .applicant-requirement-upload input[type="file"] {
          width:100%;
          padding:.7rem .85rem;
          border-radius:14px;
          border:1px dashed rgba(24,111,67,.22);
          background:rgba(255,255,255,.94);
        }
        .applicant-document-meta {
          display:grid;
          gap:.25rem;
          padding:.8rem .9rem;
          border-radius:16px;
          background:rgba(30,125,77,.06);
        }
        .applicant-document-link {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:.72rem 1rem;
          border-radius:999px;
          background:rgba(24,111,67,.1);
          color:var(--accent-deep);
          font-weight:800;
          text-decoration:none;
        }
        @media (max-width:820px) {
          .applicant-requirement-top,
          .applicant-requirement-actions {
            flex-direction:column;
            align-items:stretch;
          }
        }
      `}</style>

      <div className="section-card section-card-wide">
        <SectionHeading
          eyebrow="Program application"
          title={`Apply: ${selectedProgram.title}`}
          text="Upload and attach all required documents before submitting."
        />

        <div className="detail-grid">
          <DetailItem label="Office" value={selectedProgram.office} />
          <DetailItem label="Municipality" value={selectedProgram.municipality} />
          <DetailItem label="Deadline" value={selectedProgram.deadline} />
          <DetailItem label="Program status" value={selectedProgram.status} />
        </div>

        <div className="applicant-requirement-list">
          {selectedProgram.requirements.map((requirement) => {
            const attached = attachedDocs.includes(requirement);
            const savedDocument = getRequirementDocument(requirement);
            return (
              <article className="applicant-requirement-row" key={requirement}>
                <div className="applicant-requirement-top">
                  <label className="applicant-requirement-check">
                    <input
                      checked={attached}
                      onChange={() =>
                        attached
                          ? actions.removeAttachedRequirement(requirement)
                          : actions.attachRequirement(requirement)
                      }
                      type="checkbox"
                    />
                    <div className="applicant-requirement-copy">
                      <strong>{requirement}</strong>
                      <p>Mark this requirement and upload the supporting file.</p>
                    </div>
                  </label>

                  <div className="applicant-requirement-upload">
                    <input
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(event) => handleRequirementUpload(requirement, event)}
                      type="file"
                    />
                  </div>
                </div>

                {savedDocument ? (
                  <div className="applicant-requirement-actions">
                    <div className="applicant-document-meta">
                      <strong>{savedDocument.fileName || savedDocument.name}</strong>
                      <p>
                        {savedDocument.fileType || savedDocument.category} | Uploaded {savedDocument.uploadedAt}
                      </p>
                      <small>{savedDocument.status}</small>
                    </div>
                    {savedDocument.fileUrl ? (
                      <a className="applicant-document-link" href={savedDocument.fileUrl} rel="noreferrer" target="_blank">
                        View File
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <div className="applicant-document-meta">
                    <strong>No file uploaded yet</strong>
                    <p>Upload a file for this requirement before submitting.</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {uploadError ? <p className="dashboard-text">{uploadError}</p> : null}

        <FormField
          label="Supporting notes"
          type="textarea"
          value={data.composer.notes}
          onChange={actions.updateComposerNotes}
          placeholder="Add anything the office should know before you submit."
        />

        <div className="card-actions">
          <button className="secondary-button" onClick={() => navigate('/applicant/program-view')}>
            Back to Program Details
          </button>
          <button className="primary-button" onClick={actions.submitApplication}>
            Submit application
          </button>
        </div>
      </div>
    </div>
  );
}
