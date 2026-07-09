import { useEffect, useState } from 'react';
import {
  getProgramIllustrationSource,
  getProgramPhotoSource,
} from 'Services/Applicant/applicant-utils';
import { formatPublicDate, getProgramStatusClass } from 'Services/Public/public-utils';

export function PublicHeroSection({
  categories,
  highlightPrograms = [],
  onOpenApplicantPortal,
  onSelectSection,
  stats = [],
}) {
  const heroStats = stats.slice(0, 3);
  const spotlightPrograms = highlightPrograms.slice(0, 4);
  const categoryMarqueeItems = categories.length ? [...categories, ...categories] : [];
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const activeHighlight = spotlightPrograms[activeHighlightIndex] || null;
  const activeHighlightReference = activeHighlight?.officialReference || null;
  const activeHighlightImage = activeHighlight
    ? getProgramPhotoSource(activeHighlight) || getProgramIllustrationSource(activeHighlight)
    : '';
  const ActiveHighlightTag = activeHighlightReference?.href ? 'a' : 'article';

  useEffect(() => {
    setActiveHighlightIndex((currentIndex) => {
      if (spotlightPrograms.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, spotlightPrograms.length - 1);
    });
  }, [spotlightPrograms.length]);

  useEffect(() => {
    if (spotlightPrograms.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHighlightIndex((currentIndex) =>
        currentIndex === spotlightPrograms.length - 1 ? 0 : currentIndex + 1,
      );
    }, 5600);

    return () => window.clearInterval(intervalId);
  }, [spotlightPrograms.length]);

  function showPreviousHighlight() {
    if (spotlightPrograms.length <= 1) {
      return;
    }

    setActiveHighlightIndex((currentIndex) =>
      currentIndex === 0 ? spotlightPrograms.length - 1 : currentIndex - 1,
    );
  }

  function showNextHighlight() {
    if (spotlightPrograms.length <= 1) {
      return;
    }

    setActiveHighlightIndex((currentIndex) =>
      currentIndex === spotlightPrograms.length - 1 ? 0 : currentIndex + 1,
    );
  }

  return (
    <section className="pf-hero-wrap" id="home">
      <div className="pf-hero-grid-bg" aria-hidden="true" />

      <div className="pf-hero-inner">
        <div className="pf-hero-copy pf-fade-up">
          <div className="pf-hero-main-panel">
            <div className="pf-hero-eyebrow">
              <span className="pf-hero-eyebrow-dot" aria-hidden="true" />
              Official public service portal of the Province of Bulacan
            </div>

            <h1 className="pf-hero-title">
              Program directory and resident services
            </h1>

            <p className="pf-hero-text">
              Review public programs, verified notices, and participating offices before
              continuing to the guided resident application portal for the Province of Bulacan.
            </p>

            <div className="pf-hero-actions">
              <button className="pf-btn-accent" onClick={onOpenApplicantPortal} type="button">
                Access Applicant Portal
              </button>
              <button
                className="pf-btn-outline"
                onClick={() => onSelectSection('programs')}
                type="button"
              >
                Review Programs
              </button>
            </div>

          </div>
        </div>

        <aside className="pf-hero-visual pf-hero-service-aside pf-fade-up">
          <div className="pf-hero-visual-shell pf-hero-service-shell">
            <div className="pf-hero-service-head">
              <span className="pf-hero-visual-kicker">Public Service Snapshot</span>
              <strong className="pf-hero-service-heading">
                Resident access and featured public programs
              </strong>
              <p className="pf-hero-service-text">
                Review public programs and official references before proceeding to the secure
                resident workspace.
              </p>
            </div>

            <div className="pf-hero-stat-grid" role="list" aria-label="Portal statistics">
              {heroStats.map((item) => (
                <div className="pf-hero-stat-card" key={item.label} role="listitem">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {activeHighlight ? (
              <div className="pf-hero-program-shell">
                <div className="pf-hero-program-shell-head">
                  <div className="pf-hero-program-shell-copy">
                    <span className="pf-hero-program-shell-kicker">Featured Program Carousel</span>
                    <strong className="pf-hero-program-shell-heading">
                      Auto-rotating public program reference
                    </strong>
                    <span className="pf-hero-program-shell-note">
                      Automatically switches between official program highlights.
                    </span>
                  </div>

                  {spotlightPrograms.length > 1 ? (
                    <div className="pf-hero-program-shell-controls">
                      <div className="pf-hero-program-shell-dots" aria-label="Program carousel pages">
                        {spotlightPrograms.map((program, index) => (
                          <button
                            aria-label={`Show program highlight ${index + 1}`}
                            className={`pf-hero-program-shell-dot ${
                              index === activeHighlightIndex ? 'is-active' : ''
                            }`}
                            key={program.id}
                            onClick={() => setActiveHighlightIndex(index)}
                            type="button"
                          />
                        ))}
                      </div>
                      <button
                        aria-label="Show previous program highlight"
                        className="pf-hero-program-shell-button"
                        onClick={showPreviousHighlight}
                        type="button"
                      >
                        &#8249;
                      </button>
                      <button
                        aria-label="Show next program highlight"
                        className="pf-hero-program-shell-button"
                        onClick={showNextHighlight}
                        type="button"
                      >
                        &#8250;
                      </button>
                    </div>
                  ) : null}
                </div>

                <ActiveHighlightTag
                  className={`pf-hero-program-card ${
                    activeHighlightReference?.href ? 'is-link' : ''
                  }`}
                  href={activeHighlightReference?.href || undefined}
                  key={activeHighlight.id}
                  rel={activeHighlightReference?.href ? 'noreferrer' : undefined}
                  target={activeHighlightReference?.href ? '_blank' : undefined}
                >
                  <div className="pf-hero-program-card-media">
                    {activeHighlightImage ? (
                      <img alt={activeHighlight.title} src={activeHighlightImage} />
                    ) : (
                      <div className="pf-hero-program-card-placeholder">Official Program</div>
                    )}
                  </div>

                  <div className="pf-hero-program-card-body">
                    <div className="pf-hero-program-card-meta">
                      <span className="pf-hero-program-card-category">
                        {activeHighlight.category}
                      </span>
                      <span className={getProgramStatusClass(activeHighlight.status)}>
                        {activeHighlight.status}
                      </span>
                    </div>

                    <strong className="pf-hero-program-card-title">{activeHighlight.title}</strong>
                    <p className="pf-hero-program-card-text">{activeHighlight.summary}</p>

                    <div className="pf-hero-program-card-facts">
                      <span className="pf-hero-program-card-fact">
                        <small>Office</small>
                        <strong>{activeHighlight.office}</strong>
                      </span>
                      <span className="pf-hero-program-card-fact">
                        <small>Deadline</small>
                        <strong>{formatPublicDate(activeHighlight.deadline)}</strong>
                      </span>
                    </div>

                    <div className="pf-hero-program-card-foot">
                      <span className="pf-hero-program-card-source">
                        {activeHighlightReference?.source || 'Provincial Government of Bulacan'}
                      </span>
                      {activeHighlightReference?.href ? (
                        <span className="pf-hero-program-card-link">
                          {activeHighlightReference.label || 'Open official reference'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </ActiveHighlightTag>
              </div>
            ) : null}

          </div>
        </aside>

        {categories.length ? (
          <div className="pf-hero-category-marquee" aria-label="Program categories">
            <span className="pf-hero-category-label">Browse by service area</span>
            <div className="pf-hero-marquee-window">
              <div className="pf-hero-marquee-track">
                {categoryMarqueeItems.map((category, index) => (
                  <span
                    aria-hidden={index >= categories.length ? 'true' : undefined}
                    className="pf-hero-chip"
                    key={`${category.id || category.name}-${index}`}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
