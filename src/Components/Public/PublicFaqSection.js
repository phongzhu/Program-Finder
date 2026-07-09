import { PublicFaqItem } from './PublicCards';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

export function PublicFaqSection({ faqItems, openFaqIndex, onToggleFaq }) {
  return (
    <PublicStageSection
      className="pf-stage-faq"
      contentClassName="pf-section"
      id="faq"
      variant="faq"
    >
        <PublicSectionHeading
          eyebrow="FAQ"
          title="Common questions from first-time visitors"
          text="The public page answers the basics before a resident decides to continue."
        />

        <div className="pf-faq-list" role="list">
          {faqItems.map((item, index) => (
            <PublicFaqItem
              index={index}
              isOpen={openFaqIndex === index}
              item={item}
              key={item.question}
              onToggle={onToggleFaq}
            />
          ))}
        </div>
    </PublicStageSection>
  );
}
