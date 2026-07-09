import { useEffect, useState } from 'react';
import { PublicSectionHeading } from './PublicSectionHeading';
import { PublicStageSection } from './PublicStageSection';

const STEP_GUIDE = [
  {
    cue: 'Resident account setup',
    preparation: 'Basic resident details and applicant profile information.',
    outcome: 'The portal can save your profile and guide you to eligible public services.',
  },
  {
    cue: 'Program directory review',
    preparation: 'Your preferred service area, office, or municipality coverage.',
    outcome: 'You can narrow the official listings before entering the secure workspace.',
  },
  {
    cue: 'Qualification review',
    preparation: 'Requirements, residency records, and the applicant circumstances that apply to you.',
    outcome: 'You can identify which programs match your profile before starting an application.',
  },
  {
    cue: 'Submission and follow-up',
    preparation: 'Completed forms, uploaded records, and the selected public program.',
    outcome: 'Your application can be submitted and monitored from the applicant dashboard.',
  },
];

export function PublicHowItWorksSection({ steps }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = steps[activeStepIndex] || null;
  const activeGuide = STEP_GUIDE[activeStepIndex] || STEP_GUIDE[0];

  useEffect(() => {
    setActiveStepIndex((currentIndex) => {
      if (!steps.length) {
        return 0;
      }

      return Math.min(currentIndex, steps.length - 1);
    });
  }, [steps.length]);

  function showPreviousStep() {
    if (steps.length <= 1) {
      return;
    }

    setActiveStepIndex((currentIndex) => (currentIndex === 0 ? steps.length - 1 : currentIndex - 1));
  }

  function showNextStep() {
    if (steps.length <= 1) {
      return;
    }

    setActiveStepIndex((currentIndex) => (currentIndex === steps.length - 1 ? 0 : currentIndex + 1));
  }

  return (
    <PublicStageSection
      className="pf-stage-how-it-works"
      contentClassName="pf-section"
      id="how-it-works"
      variant="howItWorks"
    >
        <PublicSectionHeading
          eyebrow="How It Works"
          title="A clear path from discovery to tracking"
          text="Visitors should understand the process immediately, before they ever enter the private applicant portal."
        />

        <div className="pf-process-shell pf-stagger">
          <div className="pf-process-nav" aria-label="Resident application steps" role="tablist">
            {steps.map((step, index) => {
              const isActive = index === activeStepIndex;

              return (
                <button
                  aria-controls={`pf-process-panel-${step.number}`}
                  aria-selected={isActive}
                  className={`pf-process-step ${isActive ? 'is-active' : ''}`}
                  id={`pf-process-tab-${step.number}`}
                  key={step.number}
                  onClick={() => setActiveStepIndex(index)}
                  role="tab"
                  type="button"
                >
                  <span className="pf-process-step-number">{step.number}</span>
                  <span className="pf-process-step-copy">
                    <strong>{step.title}</strong>
                    <span>{STEP_GUIDE[index]?.cue || 'Resident process step'}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {activeStep ? (
            <div
              aria-labelledby={`pf-process-tab-${activeStep.number}`}
              className="pf-process-panel"
              id={`pf-process-panel-${activeStep.number}`}
              key={activeStep.number}
              role="tabpanel"
            >
              <div className="pf-process-panel-head">
                <div className="pf-process-panel-title-wrap">
                  <span className="pf-process-panel-kicker">Step {activeStep.number}</span>
                  <h3 className="pf-process-panel-title">{activeStep.title}</h3>
                </div>

                {steps.length > 1 ? (
                  <div className="pf-process-panel-controls">
                    <span className="pf-process-panel-status">
                      {String(activeStepIndex + 1).padStart(2, '0')} /{' '}
                      {String(steps.length).padStart(2, '0')}
                    </span>
                    <button
                      aria-label="Show previous process step"
                      className="pf-process-panel-button"
                      onClick={showPreviousStep}
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      aria-label="Show next process step"
                      className="pf-process-panel-button"
                      onClick={showNextStep}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="pf-process-panel-text">{activeStep.text}</p>

              <div className="pf-process-panel-grid">
                <article className="pf-process-point">
                  <small>Portal action</small>
                  <strong>{activeGuide.cue}</strong>
                </article>
                <article className="pf-process-point">
                  <small>Prepare</small>
                  <strong>{activeGuide.preparation}</strong>
                </article>
                <article className="pf-process-point">
                  <small>Expected result</small>
                  <strong>{activeGuide.outcome}</strong>
                </article>
              </div>

              <div className="pf-process-progress" aria-hidden="true">
                {steps.map((step, index) => (
                  <span
                    className={`pf-process-progress-dot ${
                      index <= activeStepIndex ? 'is-complete' : ''
                    }`}
                    key={step.number}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
    </PublicStageSection>
  );
}
