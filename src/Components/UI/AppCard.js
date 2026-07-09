import { joinClassNames, mergeStyles } from 'Utils/ui';
import { WORKSPACE_CARD_STYLE, WORKSPACE_THEME } from './workspaceTheme';

const CARD_BASE_STYLE = WORKSPACE_CARD_STYLE;

const CARD_TONE_STYLES = {
  default: null,
  soft: {
    background: WORKSPACE_THEME.surfaceSoft,
  },
  outline: {
    background: WORKSPACE_THEME.surfaceMuted,
    boxShadow: 'none',
  },
};

const CARD_INTERACTIVE_STYLE = {
  transition: 'box-shadow 140ms ease, border-color 140ms ease, background 140ms ease',
  cursor: 'pointer',
};

export function AppCard({
  as: Component = 'div',
  children,
  className,
  interactive = false,
  style,
  tone = 'default',
  ...props
}) {
  return (
    <Component
      className={joinClassNames(className)}
      style={mergeStyles(
        CARD_BASE_STYLE,
        CARD_TONE_STYLES[tone] || CARD_TONE_STYLES.default,
        interactive ? CARD_INTERACTIVE_STYLE : null,
        style
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
