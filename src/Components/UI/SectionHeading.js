import { joinClassNames, mergeStyles } from 'Utils/ui';
import { WORKSPACE_LABEL_STYLE, WORKSPACE_THEME } from './workspaceTheme';

const SECTION_HEADING_STYLE = {
  display: 'grid',
  gap: '0.55rem',
};

const SECTION_EYEBROW_STYLE = {
  margin: 0,
  ...WORKSPACE_LABEL_STYLE,
};

const SECTION_TITLE_STYLE = {
  margin: 0,
  fontFamily: "var(--font-body, 'Public Sans', system-ui, sans-serif)",
  fontSize: '1.18rem',
  color: WORKSPACE_THEME.ink,
};

const SECTION_TEXT_STYLE = {
  margin: 0,
  color: WORKSPACE_THEME.inkMuted,
  fontSize: '0.78rem',
  lineHeight: 1.75,
};

export function SectionHeading({
  className,
  eyebrow,
  eyebrowStyle,
  style,
  text,
  textStyle,
  title,
  titleAs: TitleComponent = 'h2',
  titleStyle,
}) {
  return (
    <div className={joinClassNames(className)} style={mergeStyles(SECTION_HEADING_STYLE, style)}>
      {eyebrow ? <p style={mergeStyles(SECTION_EYEBROW_STYLE, eyebrowStyle)}>{eyebrow}</p> : null}
      <TitleComponent style={mergeStyles(SECTION_TITLE_STYLE, titleStyle)}>{title}</TitleComponent>
      {text ? <p style={mergeStyles(SECTION_TEXT_STYLE, textStyle)}>{text}</p> : null}
    </div>
  );
}
