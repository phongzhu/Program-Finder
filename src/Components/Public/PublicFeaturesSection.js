import { PublicFeatureCard } from './PublicCards';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

export function PublicFeaturesSection({ features }) {
  return (
    <PublicStageSection
      className="pf-features-wrap pf-stage-features"
      contentClassName="pf-features-inner"
      variant="features"
    >
        <PublicSectionHeading
          eyebrow="Public Service Functions"
          title="How ProgramFinder supports official resident services"
          text="The portal provides a structured route between public information, eligibility review, and application handling."
        />

        <div className="pf-features-grid pf-stagger">
          {features.map((feature) => <PublicFeatureCard feature={feature} key={feature.title} />)}
        </div>
    </PublicStageSection>
  );
}
