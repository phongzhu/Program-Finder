import { ProgramFinderLogo } from 'Components/UI';
import { PublicStageSection } from './PublicStageSection';

export function PublicFooter({ onSelectSection, onOpenApplicantPortal }) {
  return (
    <PublicStageSection
      as="footer"
      className="pf-footer pf-stage-footer"
      contentClassName="pf-footer-inner"
      variant="footer"
    >
        <div className="pf-footer-grid">
          <div>
            <div className="pf-footer-brand">
              <span className="pf-footer-mark">
                <ProgramFinderLogo decorative />
              </span>
              <span className="pf-footer-name">ProgramFinder | Province of Bulacan</span>
            </div>
            <p className="pf-footer-desc">
              Official public gateway for residents to review available programs, verify
              requirements, and continue through the guided applicant workflow.
            </p>
          </div>

          <div>
            <h3 className="pf-footer-heading">Quick Links</h3>
            <nav className="pf-footer-links" aria-label="Footer navigation">
              {[
                { label: 'About', id: 'about' },
                { label: 'Programs', id: 'programs' },
                { label: 'FAQ', id: 'faq' },
                { label: 'Contact', id: 'contact' },
              ].map(({ label, id }) => (
                <button
                  className="pf-footer-link"
                  key={id}
                  onClick={() => onSelectSection(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
              <button
                className="pf-footer-link"
                onClick={onOpenApplicantPortal}
                type="button"
              >
                Applicant Portal
              </button>
            </nav>
          </div>

          <div>
            <h3 className="pf-footer-heading">Contact</h3>
            <address className="pf-footer-desc" style={{ fontStyle: 'normal' }}>
              Provincial Program Management Office
              <br />
              Province of Bulacan
            </address>
            <p className="pf-footer-desc">Mon-Fri, 8:00 AM - 5:00 PM</p>
          </div>
        </div>

        <div className="pf-footer-bottom">
          <span className="pf-footer-copy">
            &copy; {new Date().getFullYear()} ProgramFinder | Province of Bulacan. All rights reserved.
          </span>
          <span className="pf-footer-copy">Official public program access portal.</span>
        </div>
    </PublicStageSection>
  );
}
