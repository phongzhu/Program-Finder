import { useEffect, useState } from 'react';
import logo from 'Assets/Images/programfinder-logo.png';
import { mergeStyles } from 'Utils/ui';

const BRANDING_EVENT_NAME = 'pf:branding-updated';

const LOGO_STYLE = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

export function ProgramFinderLogo({
  alt = 'ProgramFinder logo',
  className = '',
  decorative = false,
  style,
}) {
  const [logoSource, setLogoSource] = useState(logo);

  useEffect(() => {
    const resolveLogoSource = () => {
      if (typeof window === 'undefined') {
        return logo;
      }

      const nextLogo = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--pf-logo-url')
        .trim();

      return nextLogo || logo;
    };

    const syncLogo = () => {
      setLogoSource(resolveLogoSource());
    };

    syncLogo();
    window.addEventListener(BRANDING_EVENT_NAME, syncLogo);
    return () => window.removeEventListener(BRANDING_EVENT_NAME, syncLogo);
  }, []);

  return (
    <img
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? 'true' : undefined}
      className={className}
      decoding="async"
      loading="eager"
      src={logoSource}
      style={mergeStyles(LOGO_STYLE, style)}
    />
  );
}
