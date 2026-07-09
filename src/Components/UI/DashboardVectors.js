import { mergeStyles } from 'Utils/ui';

const VECTOR_PALETTES = {
  admin: {
    primary: 'rgba(22, 89, 177, 0.3)',
    secondary: 'rgba(45, 122, 75, 0.24)',
    tertiary: 'rgba(244, 197, 66, 0.22)',
    alert: 'rgba(201, 71, 61, 0.18)',
  },
  personnel: {
    primary: 'rgba(22, 89, 177, 0.26)',
    secondary: 'rgba(45, 122, 75, 0.28)',
    tertiary: 'rgba(244, 197, 66, 0.22)',
    alert: 'rgba(201, 71, 61, 0.16)',
  },
  applicant: {
    primary: 'rgba(22, 89, 177, 0.26)',
    secondary: 'rgba(45, 122, 75, 0.26)',
    tertiary: 'rgba(244, 197, 66, 0.24)',
    alert: 'rgba(201, 71, 61, 0.14)',
  },
};

const CONTAINER_STYLE = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: 0,
};

const ORB_BASE_STYLE = {
  position: 'absolute',
  borderRadius: '999px',
  filter: 'blur(6px)',
  opacity: 0.5,
};

const SVG_BASE_STYLE = {
  position: 'absolute',
  overflow: 'visible',
};

export function DashboardVectors({ role = 'admin' }) {
  const palette = VECTOR_PALETTES[role] || VECTOR_PALETTES.admin;
  void palette;
  void CONTAINER_STYLE;
  void ORB_BASE_STYLE;
  void SVG_BASE_STYLE;
  void mergeStyles;

  return null;
}
