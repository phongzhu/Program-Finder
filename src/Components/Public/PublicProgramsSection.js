import { PublicProgramCard } from './PublicCards';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

export function PublicProgramsSection({ featuredPrograms, onOpenApplicantPortal }) {
  return (
    <PublicStageSection
      className="pf-programs-wrap pf-stage-programs"
      contentClassName="pf-programs-inner"
      id="programs"
      variant="programs"
    >
        <PublicSectionHeading
          eyebrow="Programs and Services"
          title="Current public assistance programs and resident services"
          text="Preview official opportunities available through participating offices of the Province of Bulacan."
        />

        <div className="pf-program-grid pf-stagger">
          {featuredPrograms.map((program) => (
            <PublicProgramCard
              key={program.id}
              onOpenApplicantPortal={onOpenApplicantPortal}
              program={program}
            />
          ))}
        </div>
    </PublicStageSection>
  );
}
