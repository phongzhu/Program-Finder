import { MobileMenu } from './MobileMenu';
import { PublicPortalActions } from './PublicPortalActions';
import { ProgramFinderLogo } from 'Components/UI';

export function PublicNavigation({
  navItems,
  navScrolled,
  mobileMenuOpen,
  onOpenMenu,
  onCloseMenu,
  onSelectSection,
  onOpenApplicantPortal,
  onOpenApplicantSignup,
}) {
  return (
    <>
      <header className={`pf-gov-header ${navScrolled ? 'is-scrolled' : ''}`}>
        <div className="pf-gov-notice">
          <div className="pf-gov-notice-inner">
            <span className="pf-gov-notice-label">Official Notice</span>
            <span>
              ProgramFinder is the official public information and resident access portal for the
              Province of Bulacan.
            </span>
          </div>
        </div>

        <div className="pf-gov-utility">
          <div className="pf-gov-utility-inner">
            <div className="pf-gov-utility-copy">
              <span className="pf-gov-utility-label">Province of Bulacan</span>
              <strong className="pf-gov-utility-title">Public service and program information portal</strong>
            </div>
            <div className="pf-gov-utility-meta" aria-label="Public service information">
              <span>Public information desk</span>
              <span>Mon-Fri, 8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>

        <nav className={`pf-nav ${navScrolled ? 'is-scrolled' : ''}`}>
          <div className="pf-nav-inner">
            <button
              aria-label="Go to top"
              className="pf-nav-brand"
              onClick={() => onSelectSection('home')}
              type="button"
            >
              <span className="pf-nav-mark">
                <ProgramFinderLogo decorative />
              </span>
              <span className="pf-nav-label">
                <strong>ProgramFinder</strong>
                <small>Province of Bulacan</small>
                <span className="pf-nav-caption">Official public service portal</span>
              </span>
            </button>

            <div className="pf-nav-links" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <button
                  className="pf-nav-link"
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <PublicPortalActions
              className="pf-nav-actions"
              onOpenApplicantPortal={onOpenApplicantPortal}
              onOpenApplicantSignup={onOpenApplicantSignup}
            />

            <button
              aria-expanded={mobileMenuOpen}
              aria-label="Open navigation menu"
              className="pf-nav-hamburger"
              onClick={onOpenMenu}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu
        navItems={navItems}
        onClose={onCloseMenu}
        onOpenApplicantPortal={onOpenApplicantPortal}
        onOpenApplicantSignup={onOpenApplicantSignup}
        onSelectSection={onSelectSection}
        open={mobileMenuOpen}
      />
    </>
  );
}
