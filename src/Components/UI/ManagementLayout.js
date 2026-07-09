import { joinClassNames } from 'Utils/ui';
import './ManagementLayout.css';

export function ManagementToolbar({ actions = null, children, className = '' }) {
  return (
    <div className={joinClassNames('management-toolbar pf-tw-toolbar', className)}>
      <div>{children}</div>
      {actions ? <div className="management-toolbar-actions">{actions}</div> : null}
    </div>
  );
}

export function ManagementGrid({ children, columns = 4, className = '', style }) {
  return (
    <div
      className={joinClassNames('management-grid', columns === 4 ? 'is-four pf-tw-grid-4' : '', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function ManagementFilterGrid({ children }) {
  return <div className="management-filter-grid">{children}</div>;
}

export function ManagementInlineGrid({ children, style }) {
  return <div className="management-inline-grid pf-tw-form-grid" style={style}>{children}</div>;
}

export function ManagementTabs({ activeKey, onChange, tabs }) {
  return (
    <div className="management-tab-strip">
      {tabs.map((tab) => (
        <button
          className={joinClassNames('management-tab', activeKey === tab.key ? 'is-active' : '')}
          key={tab.key}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ManagementTable({ children, compact = false, wide = false }) {
  return (
    <div className={joinClassNames('management-table-shell', compact ? 'is-compact' : '')}>
      <table className={joinClassNames('management-table', wide ? 'is-wide' : '')}>
        {children}
      </table>
    </div>
  );
}

export function ManagementCellStack({ children }) {
  return <div className="management-cell-stack">{children}</div>;
}

export function ManagementNote({ children }) {
  return <div className="management-note">{children}</div>;
}
