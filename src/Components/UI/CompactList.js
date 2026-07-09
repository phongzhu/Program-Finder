import { Fragment } from 'react';
import { joinClassNames, mergeStyles } from 'Utils/ui';
import { EmptyState } from './EmptyState';

const STACK_LIST_STYLE = {
  display: 'grid',
  gap: '0.9rem',
};

const COMPACT_STACK_LIST_STYLE = {
  gap: '0.65rem',
};

export function CompactList({
  items = [],
  emptyTitle,
  emptyText,
  getKey,
  renderItem,
  className,
  compact = true,
  style,
}) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <div
      className={joinClassNames(className)}
      style={mergeStyles(STACK_LIST_STYLE, compact ? COMPACT_STACK_LIST_STYLE : null, style)}
    >
      {items.map((item, index) => (
        <Fragment key={getKey ? getKey(item, index) : item.id || item.status || index}>
          {renderItem(item, index)}
        </Fragment>
      ))}
    </div>
  );
}
