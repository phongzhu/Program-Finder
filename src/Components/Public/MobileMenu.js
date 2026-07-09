import { useEffect } from 'react';
import { PublicPortalActions } from './PublicPortalActions';
import { ProgramFinderLogo } from 'Components/UI';

export function MobileMenu({
  open,
  navItems,
  onClose,
  onSelectSection,
  onOpenApplicantPortal,
  onOpenApplicantSignup,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleNav = (sectionId) => {
    onSelectSection(sectionId);
    onClose();
  };

  const handleApplicantPortal = () => {
    onOpenApplicantPortal();
    onClose();
  };

  const handleApplicantSignup = () => {
    (onOpenApplicantSignup || onOpenApplicantPortal)();
    onClose();
  };

  return (
    <div className={`pf-mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="pf-mobile-menu-backdrop" onClick={onClose} role="presentation" />
      <nav className="pf-mobile-menu-panel">
        <div className="pf-mobile-menu-head">
          <div className="pf-mobile-menu-brand">
            <span className="pf-mobile-menu-brand-mark">
              <ProgramFinderLogo decorative />
            </span>
            <span className="pf-mobile-menu-brand-copy">
              <strong>ProgramFinder</strong>
              <small>Province of Bulacan</small>
            </span>
          </div>

          <button
            aria-label="Close menu"
            className="pf-mobile-menu-close"
            onClick={onClose}
            type="button"
          >
            &#x2715;
          </button>
        </div>

        <p className="pf-mobile-menu-note">
          Official public information and resident access portal for the Province of Bulacan.
        </p>

        <div className="pf-mobile-menu-links">
          {navItems.map((item) => (
            <button
              className="pf-mobile-nav-link"
              key={item.id}
              onClick={() => handleNav(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <PublicPortalActions
          className="pf-mobile-menu-actions"
          fullWidth
          onOpenApplicantPortal={handleApplicantPortal}
          onOpenApplicantSignup={handleApplicantSignup}
        />
      </nav>
    </div>
  );
}
