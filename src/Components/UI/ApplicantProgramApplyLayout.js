export function ApplicantProgramApplyLayout({ children }) {
  return (
    <>
      <style>{`
        /* ============================================================
           PROGRAM APPLICATION – BASE LAYOUT & TOKENS
        ============================================================ */
        .apa-root {
          font-family: var(--pf-font-body, 'Public Sans', system-ui, sans-serif);
          padding: 4px 0 36px;
          color: #1a2637;
        }
        .apa-screen {
          width: 100%;
          max-width: 100%;
          display: grid;
          gap: 18px;
        }

        /* ============================================================
           TWO-COLUMN MAIN LAYOUT
        ============================================================ */
        .apa-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 336px;
          gap: 18px;
          align-items: start;
        }
        .apa-main-primary {
          display: grid;
          gap: 18px;
        }

        /* ============================================================
           PANEL (CARD) BASE
        ============================================================ */
        .apa-panel {
          background: #ffffff;
          border: 1px solid #d7dde8;
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(15, 35, 62, 0.06);
          overflow: hidden;
        }
        .apa-panel-top {
          padding: 14px 20px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .apa-panel-top-copy {
          display: grid;
          gap: 3px;
        }
        .apa-panel-body {
          padding: 20px;
          display: grid;
          gap: 18px;
        }

        /* ============================================================
           TYPOGRAPHY HELPERS
        ============================================================ */
        .apa-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4a6890;
        }
        .apa-panel-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #0f2037;
          line-height: 1.3;
        }

        /* ============================================================
           HEADER CARD
        ============================================================ */
        .apa-header-card {
          background: #ffffff;
          border: 1px solid #d7dde8;
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(15, 35, 62, 0.06);
          padding: 18px 22px;
          display: grid;
          gap: 10px;
        }
        .apa-breadcrumb {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .apa-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #3a5a84;
          font-size: 13px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.15s;
        }
        .apa-back-btn:hover { color: #0f2f63; }
        .apa-draft-label {
          font-size: 12px;
          color: #a0b0c0;
          font-weight: 600;
        }
        .apa-header-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #0f2037;
          line-height: 1.2;
          letter-spacing: -0.015em;
        }
        .apa-header-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .apa-header-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: #5a6e84;
          font-weight: 500;
        }
        .apa-header-sep { color: #c8d2de; }
        .apa-deadline-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          background: #fff8e6;
          color: #9a6700;
          border: 1px solid #efd488;
        }
        .apa-official-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 11px;
          border-radius: 999px;
          background: #eef4ff;
          color: #2a4e8c;
          border: 1px solid #c8d8f5;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-left: auto;
        }

        /* ============================================================
           APPLICANT INFO
        ============================================================ */
        .apa-applicant-identity {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .apa-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dde9ff;
          color: #2a4e8c;
          border: 2px solid #b8d0f5;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .apa-applicant-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #0f2037;
          line-height: 1.2;
        }
        .apa-applicant-contact {
          margin: 0;
          font-size: 13px;
          color: #5e7086;
          line-height: 1.4;
        }
        .apa-panel-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        .apa-ghost-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
          color: #3a5a84;
          background: none;
          border: 1px solid #d0daea;
          border-radius: 8px;
          padding: 5px 11px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, border-color 0.15s;
        }
        .apa-ghost-btn:hover {
          background: #f0f5ff;
          border-color: #b0c4e8;
        }

        /* Profile detail table */
        .apa-profile-table {
          border-top: 1px solid #e8ecf2;
        }
        .apa-profile-row {
          display: grid;
          grid-template-columns: 152px minmax(0, 1fr);
          gap: 12px;
          padding: 11px 20px;
          border-bottom: 1px solid #f0f3f8;
          align-items: start;
        }
        .apa-profile-row:last-child { border-bottom: 0; }
        .apa-profile-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #9aafc0;
          padding-top: 1px;
        }
        .apa-profile-value {
          font-size: 14px;
          color: #1a2637;
          font-weight: 500;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        /* ============================================================
           DOCUMENTS PANEL
        ============================================================ */
        .apa-docs-count-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background: #e7eefb;
          color: #2a4e8c;
          flex-shrink: 0;
        }
        .apa-notes-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #7a8fa4;
        }
        .apa-notes-opt {
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          color: #a0b0c0;
        }
        .apa-upload-error {
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(195, 86, 75, 0.07);
          border: 1px solid rgba(195, 86, 75, 0.2);
          color: #8f2f28;
          font-size: 13px;
          line-height: 1.5;
        }
        .apa-vault-tip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          border: 1px solid #d6deea;
          background: #f6f9ff;
          padding: 10px 12px;
        }
        .apa-vault-tip-copy {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #355377;
          font-size: 12.5px;
          line-height: 1.45;
          font-weight: 600;
        }
        .apa-vault-setup-btn {
          border: 1px solid #c6d4ea;
          background: #ffffff;
          color: #1f4f8f;
          font-size: 12px;
          font-weight: 700;
          min-height: 30px;
          padding: 4px 10px;
          cursor: pointer;
        }
        .apa-vault-setup-btn:hover {
          background: #eef4ff;
        }

        /* Requirement card */
        .apa-req-list { display: grid; gap: 12px; }
        .apa-req-card {
          border: 1px solid #d7dde8;
          border-radius: 12px;
          overflow: hidden;
          background: #fafbfd;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .apa-req-card:hover {
          box-shadow: 0 2px 8px rgba(15, 35, 62, 0.07);
        }
        .apa-req-card.is-ready {
          border-color: #9ed0b5;
          background: #f4fbf7;
        }
        .apa-req-card-top {
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          background: #ffffff;
          border-bottom: 1px solid #e8ecf2;
        }
        .apa-req-card.is-ready .apa-req-card-top {
          background: #f0faf5;
          border-bottom-color: #c0e8d0;
        }
        .apa-req-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #e7eefb;
          color: #2a4e8c;
          font-size: 11px;
          font-weight: 800;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .apa-req-card.is-ready .apa-req-num {
          background: #c8f0da;
          color: #186840;
        }
        .apa-req-card-info {
          display: grid;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }
        .apa-req-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f2037;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .apa-req-hint {
          font-size: 11.5px;
          color: #9aafc0;
          line-height: 1.4;
        }
        .apa-status-chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .apa-status-chip.is-pending { background: #f0f3f8; color: #6a7e94; }
        .apa-status-chip.is-ready   { background: #d4f0e2; color: #186840; }
        .apa-status-chip.is-uploaded { background: #fff3d6; color: #875900; }

        .apa-req-card-body {
          padding: 14px 16px;
          display: grid;
          gap: 10px;
        }

        /* File preview (when uploaded) */
        .apa-file-preview {
          display: grid;
          grid-template-columns: 36px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: start;
          padding: 12px 14px;
          border-radius: 10px;
          background: #eef5ff;
          border: 1px solid #c4d8f0;
        }
        .apa-file-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #dbe9ff;
          color: #2a4e8c;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .apa-file-info {
          display: grid;
          gap: 2px;
          min-width: 0;
        }
        .apa-file-name {
          font-size: 13px;
          font-weight: 700;
          color: #0f2037;
          overflow-wrap: anywhere;
        }
        .apa-file-meta {
          font-size: 11.5px;
          color: #8a9bb0;
          line-height: 1.4;
        }
        .apa-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid transparent;
          width: fit-content;
          margin-top: 4px;
        }
        .apa-ai-badge.ok     { background: #eef4ff; border-color: #c0d4f5; color: #2a4e8c; }
        .apa-ai-badge.warn   { background: #fff8e6; border-color: #efce78; color: #8a5a05; }
        .apa-ai-badge.danger { background: #fff4f2; border-color: #eeb0a8; color: #8a2e28; }
        .apa-ai-badge.muted  { background: #f4f6f9; border-color: #dce2ec; color: #7a8fa4; }
        .apa-file-actions {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          justify-content: flex-end;
        }
        .apa-file-view-link {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          color: #2a4e8c;
          background: white;
          border: 1px solid #c0d0ea;
          border-radius: 7px;
          padding: 5px 10px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .apa-file-view-link:hover { background: #eef4ff; }
        .apa-vault-match-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #d8e1ef;
          background: #f7faff;
          padding: 8px 10px;
        }
        .apa-upload-meta-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 1fr);
          gap: 10px;
          align-items: end;
          margin-bottom: 10px;
        }
        .apa-upload-meta-row.is-single {
          grid-template-columns: minmax(0, 1fr);
        }
        .apa-vault-match-copy {
          font-size: 12px;
          color: #4b5f78;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .apa-vault-match-copy strong {
          color: #264a7b;
        }
        .apa-vault-use-btn {
          min-height: 30px;
          border: 1px solid #1f4d90;
          background: #ffffff;
          color: #1f4d90;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          cursor: pointer;
          white-space: nowrap;
        }
        .apa-vault-use-btn:hover {
          background: #edf4ff;
        }
        .apa-vault-use-btn.is-secondary {
          border-color: #c6d4ea;
          color: #3f5e84;
        }
        .apa-vault-use-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ============================================================
           SUMMARY SIDEBAR
        ============================================================ */
        .apa-summary-panel {
          position: sticky;
          top: 12px;
          align-self: start;
          display: grid;
          align-content: start;
          min-width: 0;
          height: fit-content;
        }
        .apa-summary-rail {
          position: static;
          display: grid;
          gap: 16px;
        }
        .apa-summary-card {
          background: #ffffff;
          border: 1px solid #d7dde8;
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(15, 35, 62, 0.06);
          overflow: hidden;
        }
        .apa-summary-top {
          padding: 14px 20px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
        }
        .apa-summary-body {
          padding: 18px 20px;
          display: grid;
          gap: 14px;
        }

        /* Deadline alert */
        .apa-deadline-alert {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 14px;
          border-radius: 10px;
          background: #fff8e6;
          border: 1px solid #efd488;
          color: #8a5a05;
        }
        .apa-deadline-alert-text {
          font-size: 13px;
          font-weight: 700;
          flex: 1;
        }
        .apa-deadline-alert-date {
          font-size: 12px;
          color: #a0b0c0;
          white-space: nowrap;
        }

        /* Progress */
        .apa-progress-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .apa-progress-label {
          font-size: 13px;
          font-weight: 600;
          color: #1a2637;
        }
        .apa-progress-fraction {
          font-size: 13px;
          font-weight: 700;
          color: #2a4e8c;
        }
        .apa-progress-track {
          width: 100%;
          height: 7px;
          border-radius: 999px;
          background: #e0e8f5;
          overflow: hidden;
        }
        .apa-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: #1a4080;
          transition: width 0.35s ease;
        }

        /* Checklist */
        .apa-checklist { display: grid; gap: 7px; }
        .apa-check-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid transparent;
          line-height: 1.3;
        }
        .apa-check-row.is-ok {
          background: #eefaf3;
          border-color: #b4e5c8;
          color: #186840;
        }
        .apa-check-row.is-pending {
          background: #fff4f3;
          border-color: #f0bcb5;
          color: #8a2e28;
        }
        .apa-check-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .apa-check-row.is-ok .apa-check-dot     { background: #c8efd8; color: #186840; }
        .apa-check-row.is-pending .apa-check-dot { background: #f5cac5; color: #8a2e28; }

        /* Divider */
        .apa-hr { height: 1px; background: #e8ecf2; border: none; margin: 2px 0; }

        /* Submit button */
        .apa-submit-btn {
          width: 100%;
          min-height: 46px;
          padding: 12px 20px;
          border-radius: 11px;
          border: none;
          background: #0f2f63;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s;
          letter-spacing: 0.01em;
        }
        .apa-submit-btn:hover:not(:disabled) { background: #1a4582; }
        .apa-submit-btn:disabled {
          background: #bcc8d8;
          cursor: not-allowed;
        }
        .apa-terms {
          font-size: 11px;
          text-align: center;
          color: #a8bfcf;
          line-height: 1.55;
          margin: 0;
        }
        .apa-autosave {
          font-size: 12px;
          text-align: center;
          color: #b8c8d8;
          display: block;
        }

        /* ============================================================
           EMPTY / ERROR STATES
        ============================================================ */
        .apa-empty-state {
          background: #ffffff;
          border: 1px solid #d7dde8;
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(15, 35, 62, 0.06);
          padding: 40px 32px;
          display: grid;
          gap: 16px;
          max-width: 520px;
        }
        .apa-empty-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4a6890;
        }
        .apa-empty-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #0f2037;
          line-height: 1.2;
        }
        .apa-empty-body {
          margin: 0;
          font-size: 14px;
          color: #5e7086;
          line-height: 1.65;
        }
        .apa-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 42px;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: #0f2f63;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          width: fit-content;
        }
        .apa-primary-btn:hover { background: #1a4582; }

        /* ============================================================
           RESPONSIVE
        ============================================================ */
        @media (max-width: 1100px) {
          .apa-main { grid-template-columns: 1fr; }
          .apa-summary-panel { position: static; }
          .apa-summary-rail { position: static; }
        }
        @media (max-width: 720px) {
          .apa-header-title { font-size: 18px; }
          .apa-panel-top { flex-direction: column; align-items: flex-start; gap: 10px; }
          .apa-profile-row { grid-template-columns: 1fr; gap: 2px; }
          .apa-file-preview { grid-template-columns: 36px minmax(0, 1fr); }
          .apa-file-actions { flex-direction: row; grid-column: 1 / -1; }
          .apa-applicant-identity { flex-direction: column; align-items: flex-start; }
          .apa-upload-meta-row { grid-template-columns: minmax(0, 1fr); }
          .apa-vault-match-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="apa-root">
        <div className="apa-screen">{children}</div>
      </div>
    </>
  );
}
