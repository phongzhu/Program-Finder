import { useEffect, useState } from 'react';
import { formatPublicDate } from 'Services/Public/public-utils';
import { PublicStageSection } from './PublicStageSection';

export function PublicAnnouncementsSection({
  newsItems = [],
  officialNewsState,
  officialSources = [],
}) {
  const noticeDeck = newsItems.slice(0, 4);
  const hasDirectory = noticeDeck.length > 1;
  const latestNotice = noticeDeck[0] || null;
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);
  const activeNotice = noticeDeck[activeNoticeIndex] || null;
  const supportingNotice = hasDirectory ? noticeDeck[(activeNoticeIndex + 1) % noticeDeck.length] : null;
  const ActiveNoticeTag = activeNotice?.href ? 'a' : 'article';
  const SupportingNoticeTag = supportingNotice?.href ? 'a' : 'article';
  const sourceSummary =
    officialNewsState === 'ready'
      ? 'Latest verified notices from official public sources of the Province of Bulacan.'
      : 'Fallback notices are shown while the live official feed is unavailable.';

  useEffect(() => {
    setActiveNoticeIndex((currentIndex) => {
      if (noticeDeck.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, noticeDeck.length - 1);
    });
  }, [noticeDeck.length]);

  useEffect(() => {
    if (noticeDeck.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveNoticeIndex((currentIndex) =>
        currentIndex === noticeDeck.length - 1 ? 0 : currentIndex + 1,
      );
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [noticeDeck.length]);

  function showPreviousNotice() {
    if (noticeDeck.length <= 1) {
      return;
    }

    setActiveNoticeIndex((currentIndex) =>
      currentIndex === 0 ? noticeDeck.length - 1 : currentIndex - 1,
    );
  }

  function showNextNotice() {
    if (noticeDeck.length <= 1) {
      return;
    }

    setActiveNoticeIndex((currentIndex) =>
      currentIndex === noticeDeck.length - 1 ? 0 : currentIndex + 1,
    );
  }

  return (
    <PublicStageSection
      className="pf-ann-wrap pf-stage-announcements"
      contentClassName="pf-section-sm"
      id="announcements"
      variant="announcements"
    >
      <section className="pf-bulletin">
        <div className="pf-bulletin-header">
          <div className="pf-bulletin-intro">
            <span className="pf-bulletin-kicker">Official Bulletin</span>
            <h2 className="pf-bulletin-title">Official notices and verified public updates</h2>
            <p className="pf-bulletin-text">{sourceSummary}</p>
          </div>

          <div className="pf-bulletin-tools">
            <div className="pf-bulletin-source-list">
              {officialSources.map((source) => (
                <a
                  className="pf-bulletin-source-link"
                  href={source.href}
                  key={source.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.label}
                </a>
              ))}
            </div>

            {latestNotice ? (
              <span className="pf-bulletin-updated">
                Latest post: {formatPublicDate(latestNotice.publishedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className={`pf-bulletin-layout ${hasDirectory ? '' : 'is-single'}`.trim()}>
          <section className="pf-bulletin-news">
            <div className="pf-bulletin-news-head">
              <div className="pf-bulletin-panel-head">
                <span className="pf-bulletin-panel-kicker">Official News Desk</span>
                <h3>Latest verified public updates</h3>
              </div>

              {noticeDeck.length > 1 ? (
                <div className="pf-bulletin-carousel-controls">
                  <span className="pf-bulletin-carousel-status">
                    {String(activeNoticeIndex + 1).padStart(2, '0')} /{' '}
                    {String(noticeDeck.length).padStart(2, '0')}
                  </span>
                  <button
                    aria-label="Show previous official notice"
                    className="pf-bulletin-carousel-button"
                    onClick={showPreviousNotice}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    aria-label="Show next official notice"
                    className="pf-bulletin-carousel-button"
                    onClick={showNextNotice}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>

            {activeNotice ? (
              <ActiveNoticeTag
                key={activeNotice.id}
                className={`pf-bulletin-viewer ${activeNotice.href ? 'is-link' : ''}`}
                href={activeNotice.href || undefined}
                rel={activeNotice.href ? 'noreferrer' : undefined}
                target={activeNotice.href ? '_blank' : undefined}
              >
                <div className="pf-bulletin-viewer-media">
                  {activeNotice.imageUrl ? (
                    <img alt={activeNotice.title} src={activeNotice.imageUrl} />
                  ) : (
                    <div className="pf-bulletin-viewer-placeholder">Official Notice</div>
                  )}
                </div>

                <div className="pf-bulletin-viewer-body">
                  <div className="pf-bulletin-viewer-meta">
                    <span className="pf-bulletin-viewer-badge">Lead Notice</span>
                    <span className="pf-bulletin-viewer-date">
                      {formatPublicDate(activeNotice.publishedAt)}
                    </span>
                  </div>

                  <h3 className="pf-bulletin-viewer-title">{activeNotice.title}</h3>
                  <p className="pf-bulletin-viewer-text">{activeNotice.summary}</p>

                  <div className="pf-bulletin-viewer-foot">
                    <span className="pf-bulletin-viewer-source">
                      {activeNotice.sourceName || activeNotice.sourceLabel}
                    </span>
                    {activeNotice.href ? (
                      <span className="pf-bulletin-viewer-link-label">Open official notice</span>
                    ) : null}
                  </div>
                </div>
              </ActiveNoticeTag>
            ) : (
              <article className="pf-bulletin-viewer pf-bulletin-viewer-empty">
                <div className="pf-bulletin-viewer-body">
                  <div className="pf-bulletin-panel-head">
                    <span className="pf-bulletin-panel-kicker">Official News Desk</span>
                    <h3>No verified notice is available right now</h3>
                  </div>
                  <p className="pf-bulletin-viewer-text">
                    Visit the official public channels to review the latest notices from the
                    Province of Bulacan.
                  </p>
                </div>
              </article>
            )}

            {supportingNotice ? (
              <SupportingNoticeTag
                className={`pf-bulletin-subnotice ${supportingNotice.href ? 'is-link' : ''}`}
                href={supportingNotice.href || undefined}
                key={supportingNotice.id}
                rel={supportingNotice.href ? 'noreferrer' : undefined}
                target={supportingNotice.href ? '_blank' : undefined}
              >
                <div className="pf-bulletin-subnotice-meta">
                  <span className="pf-bulletin-panel-kicker">Supporting Notice</span>
                  <span className="pf-bulletin-subnotice-date">
                    {formatPublicDate(supportingNotice.publishedAt)}
                  </span>
                </div>

                <h4 className="pf-bulletin-subnotice-title">{supportingNotice.title}</h4>
                <p className="pf-bulletin-subnotice-text">{supportingNotice.summary}</p>

                <div className="pf-bulletin-subnotice-foot">
                  <span className="pf-bulletin-subnotice-source">
                    {supportingNotice.sourceName || supportingNotice.sourceLabel}
                  </span>
                  {supportingNotice.href ? (
                    <span className="pf-bulletin-subnotice-link">Open supporting notice</span>
                  ) : null}
                </div>
              </SupportingNoticeTag>
            ) : null}
          </section>

          {hasDirectory ? (
            <aside className="pf-bulletin-rail">
              <div className="pf-bulletin-panel pf-bulletin-directory">
                <div className="pf-bulletin-panel-head">
                  <span className="pf-bulletin-panel-kicker">Notice Directory</span>
                  <h3>Select a notice to preview</h3>
                </div>

                <div className="pf-bulletin-directory-list">
                  {noticeDeck.map((item, index) => (
                    <button
                      aria-pressed={index === activeNoticeIndex}
                      className={`pf-bulletin-directory-item ${
                        index === activeNoticeIndex ? 'is-active' : ''
                      }`}
                      key={item.id}
                      onClick={() => setActiveNoticeIndex(index)}
                      type="button"
                    >
                      <div className="pf-bulletin-rail-item-top">
                        <span className="pf-bulletin-directory-date">
                          {formatPublicDate(item.publishedAt)}
                        </span>
                        <span className="pf-bulletin-directory-source">
                          {item.sourceLabel || item.sourceName}
                        </span>
                      </div>
                      <strong className="pf-bulletin-rail-item-title">{item.title}</strong>
                      <span className="pf-bulletin-rail-item-link">
                        {index === activeNoticeIndex ? 'Shown in viewer' : 'Select for preview'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </PublicStageSection>
  );
}
