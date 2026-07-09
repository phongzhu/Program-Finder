import { PublicNoteCard, PublicOverviewItem } from './PublicCards';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

export function PublicOverviewSection({ overviewItems }) {
  return (
    <PublicStageSection
      className="pf-stage-overview"
      contentClassName="pf-section"
      id="about"
      variant="overview"
    >
        <PublicSectionHeading
          eyebrow="Portal Overview"
          title="Who the public portal serves"
          text="ProgramFinder is the official public-facing access point for residents who need to review programs, notices, and requirements before applying."
        />

        <div className="pf-overview-grid">
          <div className="pf-overview-list pf-stagger">
            {overviewItems.map((item) => <PublicOverviewItem item={item} key={item.text} />)}
          </div>

          <div className="pf-note-cards pf-fade-up">
            <PublicNoteCard
              badge="Before registration"
              text="Visitors can review public program information, categories, and announcements before moving into the private applicant workflow."
              title="Preview opportunities and deadlines"
            />
            <PublicNoteCard
              badge="After registration"
              text="Logging in opens eligibility checking, document handling, application submission, and progress tracking in one place."
              title="Unlock applicant-only tools"
            />
          </div>
        </div>
    </PublicStageSection>
  );
}
