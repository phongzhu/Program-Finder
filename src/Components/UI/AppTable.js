import { joinClassNames, mergeStyles } from 'Utils/ui';
import { WORKSPACE_THEME } from './workspaceTheme';

const TABLE_SHELL_STYLE = {
  width: '100%',
  overflowX: 'auto',
  borderRadius: '16px',
  border: `1px solid ${WORKSPACE_THEME.borderSoft}`,
  background: WORKSPACE_THEME.surface,
  boxShadow: WORKSPACE_THEME.shadow,
};

const TABLE_STYLE = {
  width: '100%',
  minWidth: '40rem',
  borderCollapse: 'collapse',
};

const TABLE_CAPTION_STYLE = {
  padding: '1rem 1.15rem 0.35rem',
  textAlign: 'left',
  color: WORKSPACE_THEME.inkMuted,
  fontSize: '0.78rem',
};

const TABLE_HEADER_CELL_STYLE = (align) => ({
  padding: '0.95rem 1rem',
  textAlign: align || 'left',
  verticalAlign: 'top',
  color: WORKSPACE_THEME.inkSoft,
  fontSize: '0.74rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${WORKSPACE_THEME.border}`,
  background: WORKSPACE_THEME.surfaceAlt,
});

const TABLE_BODY_CELL_STYLE = (align) => ({
  padding: '0.95rem 1rem',
  textAlign: align || 'left',
  verticalAlign: 'top',
  color: WORKSPACE_THEME.ink,
});

const TABLE_ROW_DIVIDER_STYLE = {
  borderTop: `1px solid ${WORKSPACE_THEME.borderSoft}`,
};

export function AppTable({
  caption = null,
  className,
  columns = [],
  emptyState = null,
  getRowKey,
  responsive = true,
  rows = [],
  style,
  tableClassName,
  tableStyle,
}) {
  const normalizedColumns = columns.map((column) =>
    typeof column === 'string'
      ? { key: column, header: column }
      : column
  );

  if (!rows.length) {
    return emptyState;
  }

  return (
    <div className={joinClassNames(className)} style={mergeStyles(TABLE_SHELL_STYLE, style)}>
      <table
        className={joinClassNames(tableClassName)}
        style={mergeStyles(TABLE_STYLE, tableStyle)}
      >
        {caption ? <caption style={TABLE_CAPTION_STYLE}>{caption}</caption> : null}
        <thead>
          <tr>
            {normalizedColumns.map((column) => (
              <th
                data-align={column.align || 'left'}
                key={column.key || column.header}
                scope="col"
                style={TABLE_HEADER_CELL_STYLE(column.align)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey ? getRowKey(row, rowIndex) : row.id || `${rowIndex}`}>
              {normalizedColumns.map((column) => {
                const cellKey = column.key || column.header;
                const content = column.render ? column.render(row, rowIndex) : row[column.key];
                const isLaterRow = rowIndex > 0;

                return (
                  <td
                    className={column.cellClassName}
                    data-align={column.align || 'left'}
                    data-label={column.header}
                    key={cellKey}
                    style={mergeStyles(
                      TABLE_BODY_CELL_STYLE(column.align),
                      isLaterRow ? TABLE_ROW_DIVIDER_STYLE : null,
                      column.cellStyle
                    )}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
