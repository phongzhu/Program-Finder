import { PublicContactCard } from './PublicCards';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

export function PublicContactSection({ offices, onOpenApplicantPortal }) {
  return (
    <PublicStageSection
      className="pf-stage-contact"
      contentClassName="pf-section-sm"
      id="contact"
      variant="contact"
    >
        <PublicSectionHeading
          eyebrow="Contact"
          title="Need help before you create an account?"
          text="Use the public information here first, then continue into the applicant portal for guided support."
        />

        <div className="pf-contact-grid pf-stagger">
          <PublicContactCard
            badge="ProgramFinder | Province of Bulacan"
            meta="Support hours: Mon-Fri, 8:00 AM - 5:00 PM"
            text="Province of Bulacan"
            title="Provincial Program Management Office"
          />

          <PublicContactCard
            action={
              <button
                className="pf-btn-accent pf-btn-contact"
                onClick={onOpenApplicantPortal}
                type="button"
              >
                Access Applicant Portal
              </button>
            }
            badge="Help / Support"
            text="Log in to review requirements, receive announcements, and track your program applications in one place."
            title="Start with the applicant portal"
          />

          <PublicContactCard
            badge="Participating offices"
            title="Public offices on the platform"
          >
            <div className="pf-office-chips">
              {offices.map((office) => (
                <span className="pf-office-chip" key={office.id}>
                  {office.name}
                </span>
              ))}
            </div>
          </PublicContactCard>
        </div>
    </PublicStageSection>
  );
}
