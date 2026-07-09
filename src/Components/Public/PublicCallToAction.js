import { PublicStageSection } from './PublicStageSection';

export function PublicCallToAction({ onOpenApplicantPortal, onOpenApplicantSignup }) {
  return (
    <PublicStageSection
      className="pf-cta-wrap pf-stage-cta"
      contentClassName="pf-cta-shell"
      variant="cta"
    >
      <section
        aria-labelledby="resident-portal-access-title"
        className="pf-cta-panel"
      >
        <div className="pf-cta-copy">
          <span className="pf-cta-kicker">Resident Portal Access</span>
          <h2 className="pf-cta-title" id="resident-portal-access-title">
            Proceed to the official resident application portal.
          </h2>
          <p className="pf-cta-text">
            Sign in or register to continue with eligibility review, document submission,
            and official application status tracking for residents of the Province of
            Bulacan.
          </p>
        </div>

        <div className="pf-cta-controls">
          <div className="pf-cta-actions">
            <button className="pf-btn-white" onClick={onOpenApplicantPortal} type="button">
              Resident Sign In
            </button>
            <button
              className="pf-btn-white-outline"
              onClick={onOpenApplicantSignup || onOpenApplicantPortal}
              type="button"
            >
              Resident Registration
            </button>
          </div>

          <p className="pf-cta-note">
            Use the resident portal for formal applications, document uploads, and status
            updates.
          </p>
        </div>
      </section>
    </PublicStageSection>
  );
}
