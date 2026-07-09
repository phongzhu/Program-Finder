import { PublicCategoryCard } from './PublicCards';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

export function PublicCategoriesSection({ categories }) {
  return (
    <PublicStageSection
      className="pf-stage-categories"
      contentClassName="pf-section"
      variant="categories"
    >
        <PublicSectionHeading
          eyebrow="Program Categories"
          title="Browse the kinds of support available"
          text="A complete overview of categories helps you understand the range of assistance on the platform before signing in."
        />

        <div className="pf-cat-grid pf-stagger">
          {categories.map((category) => <PublicCategoryCard category={category} key={category.title} />)}
        </div>
    </PublicStageSection>
  );
}
