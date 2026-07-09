import { formatPublicDate, getProgramStatusClass } from 'Services/Public/public-utils';
import { PublicStatCard } from './PublicCards';

export function PublicSpotlightHeroSection({
  stats,
  featuredPrograms,
  safeSlideIndex,
  activeProgram,
  onOpenApplicantPortal,
  onSelectSection,
  onPauseCarousel,
  onResumeCarousel,
  onPrevSlide,
  onNextSlide,
  onSelectSlide,
}) {
  return (
    <section className="pf-spotlight-hero-wrap">
      <div className="pf-spotlight-grid-bg" aria-hidden="true" />
      <div className="pf-spotlight-beam" aria-hidden="true" />
      <div className="pf-spotlight-orb pf-spotlight-orb-one" aria-hidden="true" />
      <div className="pf-spotlight-orb pf-spotlight-orb-two" aria-hidden="true" />
      <div className="pf-spotlight-orb pf-spotlight-orb-three" aria-hidden="true" />
      <div className="pf-spotlight-ring pf-spotlight-ring-one" aria-hidden="true" />
      <div className="pf-spotlight-ring pf-spotlight-ring-two" aria-hidden="true" />
      <div className="pf-spotlight-bubbles" aria-hidden="true">
        <span className="pf-spotlight-bubble pf-spotlight-bubble-one" />
        <span className="pf-spotlight-bubble pf-spotlight-bubble-two" />
        <span className="pf-spotlight-bubble pf-spotlight-bubble-three" />
        <span className="pf-spotlight-bubble pf-spotlight-bubble-four" />
      </div>

      <svg className="pf-spotlight-svg pf-spotlight-svg-wave" viewBox="0 0 960 320" fill="none" aria-hidden="true">
        <path
          d="M40 248C118 214 174 174 260 176C351 178 404 248 500 248C601 248 658 142 760 142C832 142 878 172 920 204"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="12 14"
        />
      </svg>

      <div className="pf-spotlight-hero-inner">
        <div className="pf-spotlight-copy pf-fade-up">
          <div className="pf-spotlight-eyebrow">
            <span className="pf-live-dot" aria-hidden="true" />
            Program spotlight
          </div>

          <h2 className="pf-spotlight-title">
            Explore open programs, active offices, and featured assistance in one live public view.
          </h2>

          <p className="pf-spotlight-text">
            Browse what is available first, then continue into the applicant portal for personalized
            eligibility and tracking once you are ready to apply.
          </p>

          <div className="pf-spotlight-note-grid">
            <article className="pf-panel-highlight pf-fade-up">
              <strong>One public entry point for residents</strong>
              <p>
                Open programs, notices, and featured assistance stay visible here before any login
                is required.
              </p>
            </article>

            <article className="pf-spotlight-note-card pf-fade-up">
              <span>Applicant path</span>
              <strong>Preview first, apply next</strong>
              <p>Move from public browsing into the private portal only when you need guided tools.</p>
            </article>
          </div>
        </div>

        <div className="pf-spotlight-main">
          <div className="pf-stats-grid pf-stagger" role="list" aria-label="Platform statistics">
            {stats.map((item) => <PublicStatCard item={item} key={item.label} />)}
          </div>

          <div
            className="pf-carousel-shell pf-fade-up"
            onMouseEnter={onPauseCarousel}
            onMouseLeave={onResumeCarousel}
          >
            <div className="pf-carousel-top">
              <div>
                <span className="pf-panel-label">Program spotlight</span>
                <strong className="pf-carousel-kicker">Featured assistance</strong>
              </div>
              <div className="pf-carousel-controls" role="group" aria-label="Carousel controls">
                <button
                  aria-label="Previous featured program"
                  className="pf-carousel-control"
                  onClick={onPrevSlide}
                  type="button"
                >
                  &#8249;
                </button>
                <button
                  aria-label="Next featured program"
                  className="pf-carousel-control"
                  onClick={onNextSlide}
                  type="button"
                >
                  &#8250;
                </button>
              </div>
            </div>

            {activeProgram ? (
              <article className="pf-carousel-card" key={activeProgram.id}>
                <div className="pf-carousel-badges">
                  <span className="pf-program-cat">{activeProgram.category}</span>
                  <span className={getProgramStatusClass(activeProgram.status)}>
                    {activeProgram.status}
                  </span>
                </div>

                <h3 className="pf-carousel-title">{activeProgram.title}</h3>
                <p className="pf-carousel-text">{activeProgram.summary}</p>

                <div className="pf-carousel-meta">
                  {[
                    { label: 'Target', value: activeProgram.sector },
                    { label: 'Deadline', value: formatPublicDate(activeProgram.deadline) },
                    { label: 'Office', value: activeProgram.office },
                    { label: 'Fit score', value: `${activeProgram.fitScore}% match` },
                  ].map(({ label, value }) => (
                    <div className="pf-carousel-meta-item" key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="pf-carousel-actions">
                  <button
                    className="pf-btn-accent pf-btn-carousel"
                    onClick={onOpenApplicantPortal}
                    type="button"
                  >
                    Apply Now &rarr;
                  </button>
                  <button
                    className="pf-carousel-link"
                    onClick={() => onSelectSection('programs')}
                    type="button"
                  >
                    See all featured programs
                  </button>
                </div>
              </article>
            ) : null}

            <div className="pf-carousel-dots" role="tablist" aria-label="Slide indicators">
              {featuredPrograms.map((program, index) => (
                <button
                  aria-label={`Show ${program.title}`}
                  aria-selected={index === safeSlideIndex}
                  className={`pf-carousel-dot ${index === safeSlideIndex ? 'is-active' : ''}`}
                  key={program.id}
                  onClick={() => onSelectSlide(index)}
                  role="tab"
                  type="button"
                />
              ))}
            </div>

            <div className="pf-carousel-rail">
              {featuredPrograms.map((program, index) => (
                <button
                  className={`pf-carousel-rail-item ${index === safeSlideIndex ? 'is-active' : ''}`}
                  key={`${program.id}-rail`}
                  onClick={() => onSelectSlide(index)}
                  type="button"
                >
                  <strong>{program.title}</strong>
                  <small>{program.category}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PublicSpotlightHeroSection;
