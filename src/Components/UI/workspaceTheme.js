export const WORKSPACE_THEME = {
  ink: 'var(--pf-ink)',
  inkSoft: 'var(--pf-ink-soft)',
  inkMuted: 'var(--pf-ink-muted)',
  accent: 'var(--pf-accent)',
  accentSoft: 'var(--pf-accent-soft)',
  accentSurface: 'var(--pf-card)',
  accentBorder: 'var(--pf-workspace-border-strong)',
  border: 'var(--pf-workspace-border)',
  borderSoft: 'var(--pf-workspace-border-soft)',
  surface: 'var(--pf-card)',
  surfaceSoft: 'var(--pf-card)',
  surfaceAlt: 'var(--pf-card)',
  surfaceMuted: 'var(--pf-card)',
  surfaceDisabled: 'var(--pf-card)',
  white: 'var(--pf-on-primary)',
  onPrimary: 'var(--pf-on-primary)',
  onSurface: 'var(--pf-on-tertiary)',
  shadow: '0 10px 26px color-mix(in srgb, var(--pf-accent) 10%, transparent)',
  shadowSoft: '0 1px 3px color-mix(in srgb, var(--pf-accent) 8%, transparent)',
  radiusSm: '10px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '18px',
};

export const WORKSPACE_CARD_STYLE = {
  display: 'grid',
  gap: '1rem',
  padding: '1.25rem',
  borderRadius: WORKSPACE_THEME.radiusLg,
  background: WORKSPACE_THEME.surface,
  border: `1px solid ${WORKSPACE_THEME.border}`,
  boxShadow: WORKSPACE_THEME.shadow,
};

export const WORKSPACE_CONTROL_STYLE = {
  width: '100%',
  borderRadius: WORKSPACE_THEME.radiusMd,
  border: `1px solid ${WORKSPACE_THEME.accentBorder}`,
  background: WORKSPACE_THEME.surface,
  padding: '0.9rem 1rem',
  color: WORKSPACE_THEME.ink,
  outline: 'none',
  font: 'inherit',
  transition: 'border-color 140ms ease, box-shadow 140ms ease, background 140ms ease',
};

export const WORKSPACE_LABEL_STYLE = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: WORKSPACE_THEME.inkSoft,
};
