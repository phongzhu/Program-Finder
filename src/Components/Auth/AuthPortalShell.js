import { ProgramFinderLogo } from 'Components/UI';
import { LoginPromoArtwork } from './LoginPromoArtwork';
import './auth-portal.css';

export function AuthPortalShell({
  children,
  footer = null,
  onBackHome,
  panelMode = 'default',
  panelBodyRef = null,
  panelEyebrow,
  panelText,
  panelTitle,
  promo,
}) {
  const isSigninPanel = panelMode === 'signin';

  const promoStyle = {
    position: 'relative',
    zIndex: 0,
    overflow: 'hidden',
    background:
      'linear-gradient(160deg, var(--pf-setting-primary, var(--pf-accent)) 0%, var(--pf-setting-primary, var(--pf-accent)) 54%, var(--pf-setting-secondary, var(--pf-amber)) 100%)',
    clipPath: 'polygon(0 0, 100.25% 0, 80% 100%, 0 100%)',
  };

  const promoDiagonalStyle = {
    position: 'absolute',
    top: '-10%',
    right: '-0.5rem',
    width: '2.2rem',
    height: '124%',
    transform: 'skewX(-8deg)',
    transformOrigin: 'center',
    background: 'color-mix(in srgb, var(--pf-setting-secondary, var(--pf-amber)) 42%, transparent)',
    boxShadow:
      '18px 0 42px color-mix(in srgb, var(--pf-setting-primary-text, var(--pf-ink)) 28%, transparent)',
    pointerEvents: 'none',
    zIndex: 0,
  };

  const panelWrapStyle = {
    position: 'relative',
    zIndex: 2,
    justifyContent: isSigninPanel ? 'center' : 'flex-end',
    background: 'var(--pf-setting-tertiary, var(--pf-card))',
  };

  const panelDiagonalStyle = {
    position: 'absolute',
    left: '-2.75rem',
    top: '-10%',
    width: '0.9rem',
    height: '122%',
    transform: 'skewX(-8deg)',
    transformOrigin: 'center',
    background: 'var(--pf-setting-secondary, var(--pf-amber))',
    boxShadow:
      '-18px 0 38px color-mix(in srgb, var(--pf-setting-primary-text, var(--pf-ink)) 32%, transparent)',
    pointerEvents: 'none',
    zIndex: 0,
  };

  const panelDiagonalSoftStyle = {
    position: 'absolute',
    left: '-4.98rem',
    top: '-10%',
    width: '0.95rem',
    height: '122%',
    transform: 'skewX(-10deg)',
    transformOrigin: 'center',
    background: 'color-mix(in srgb, var(--pf-setting-primary-text, var(--pf-ink)) 26%, transparent)',
    boxShadow:
      '-24px 0 52px color-mix(in srgb, var(--pf-setting-secondary-text, var(--pf-ink)) 24%, transparent)',
    pointerEvents: 'none',
    zIndex: 0,
  };

  const cardStyle = isSigninPanel
    ? {
        position: 'relative',
        zIndex: 3,
        border: '0px solid transparent',
        boxShadow: 'none',
      }
    : {
        position: 'relative',
        zIndex: 3,
        marginLeft: 'auto',
      };

  return (
    <div className="pf-auth-page">
      <div className="pf-auth-stage">
        <section className="pf-auth-promo" style={promoStyle}>
          {!isSigninPanel ? <LoginPromoArtwork /> : null}
          <div aria-hidden="true" className="pf-auth-promo-diagonal" style={promoDiagonalStyle} />
          <div className="pf-auth-promo-inner">
            <button className="pf-auth-brand-mark" onClick={onBackHome} type="button">
              <ProgramFinderLogo decorative />
            </button>

            <div className="pf-auth-promo-copy">
              <span className="pf-auth-role-pill">{promo.portalLabel}</span>
              <h1>{promo.portalTitle}</h1>
              <p>{promo.welcomeText}</p>
              <ul className="pf-auth-feature-list">
                {promo.portalHighlights.map((item) => (
                  <li className="pf-auth-feature-item" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pf-auth-meta-grid" aria-label="Portal details">
              {promo.portalMeta.map((item) => (
                <div className="pf-auth-meta-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="pf-auth-promo-footer">
              <button className="pf-auth-home-link" onClick={onBackHome} type="button">
                Back to home
              </button>
            </div>
          </div>
        </section>

        <section className="pf-auth-panel-wrap" style={panelWrapStyle}>
          {isSigninPanel ? (
            <div aria-hidden="true" className="pf-auth-panel-diagonal" style={panelDiagonalStyle} />
          ) : null}
          {isSigninPanel ? (
            <div aria-hidden="true" className="pf-auth-panel-diagonal-soft" style={panelDiagonalSoftStyle} />
          ) : null}
          <div className={`pf-auth-card ${panelMode === 'signin' ? 'is-signin-layout' : ''}`} style={cardStyle}>
            <header className="pf-auth-card-header">
              <p className="pf-auth-card-eyebrow">{panelEyebrow}</p>
              <h2 className="pf-auth-card-title">{panelTitle}</h2>
              <p className="pf-auth-card-text">{panelText}</p>
            </header>

            <div className="pf-auth-card-divider" />

            <div className="pf-auth-card-body" ref={panelBodyRef}>
              {children}
            </div>

            {footer ? <footer className="pf-auth-card-footer">{footer}</footer> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
