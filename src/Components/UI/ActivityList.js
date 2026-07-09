import { CompactList } from './CompactList';
import { WORKSPACE_THEME } from './workspaceTheme';

const ACTIVITY_CARD_STYLE = {
  display: 'grid',
  gap: '0.45rem',
  padding: '0.95rem 1rem',
  borderRadius: WORKSPACE_THEME.radiusXl,
  background: WORKSPACE_THEME.accentSoft,
  border: `1px solid ${WORKSPACE_THEME.borderSoft}`,
  boxShadow: WORKSPACE_THEME.shadowSoft,
};

const ACTIVITY_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const ACTIVITY_MUTED_TEXT_STYLE = {
  color: WORKSPACE_THEME.inkMuted,
};

const ACTIVITY_PARAGRAPH_STYLE = {
  margin: 0,
  lineHeight: 1.55,
};

export function ActivityList({
  items = [],
  emptyTitle = 'No recent activity',
  emptyText = 'Related updates will appear here once activity is recorded.',
  formatTime = (value) => value,
}) {
  return (
    <CompactList
      emptyText={emptyText}
      emptyTitle={emptyTitle}
      getKey={(item, index) => item.id || `${item.actor || 'activity'}-${item.time || index}`}
      items={items}
      renderItem={(item) => (
        <article style={ACTIVITY_CARD_STYLE}>
          <div style={ACTIVITY_HEADER_STYLE}>
            <strong>{item.actor}</strong>
            <small style={ACTIVITY_MUTED_TEXT_STYLE}>{item.scope}</small>
          </div>
          <p style={{ ...ACTIVITY_MUTED_TEXT_STYLE, ...ACTIVITY_PARAGRAPH_STYLE }}>{item.detail}</p>
          <small style={{ ...ACTIVITY_MUTED_TEXT_STYLE, ...ACTIVITY_PARAGRAPH_STYLE }}>{formatTime(item.time)}</small>
        </article>
      )}
    />
  );
}
