import { useEffect, useMemo, useState } from 'react';
import {
  EmptyState,
  FormField,
  SelectField,
  StatusPill,
} from 'Components/UI';
import {
  createProgramCategory,
  createRequirementTemplate,
  createProgramSector,
  listProgramRecords,
  updateProgramCategory,
  updateRequirementTemplate,
  updateProgramSector,
} from 'Services/Supabase/programs';
import { isSupabaseConfigured } from 'Services/Supabase/client';
import { formatDocumentTypeList, getDocumentTypeOptions, uniqueDocumentTypes } from 'Constants/documentTypes';

const SETUP_TABS = [
  { label: 'Categories', value: 'categories' },
  { label: 'Sectors', value: 'sectors' },
  { label: 'Requirement templates', value: 'requirements' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const RECORD_STATUS_FILTERS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active only', value: 'Active' },
  { label: 'Inactive only', value: 'Inactive' },
];

const DOCUMENT_TYPE_OPTIONS = getDocumentTypeOptions();

function createSetupForm(item = null) {
  return {
    name: item?.name || '',
    description: item?.description || '',
    status: item?.status || 'Active',
    expectedDocumentType: item?.expectedDocumentType || '',
    acceptedDocumentTypes: uniqueDocumentTypes(item?.acceptedDocumentTypes || item?.accepted_document_types || item?.expectedDocumentType || []),
    isRequired: item?.isRequired === false ? 'no' : 'yes',
    allowMultipleFiles: item?.allowMultipleFiles ? 'yes' : 'no',
    sortOrder: String(item?.sortOrder || 0),
  };
}

const SETUP_TAB_VALUES = new Set(SETUP_TABS.map((tab) => tab.value));

function getCurrentHashPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function getSetupBasePath() {
  const parts = getCurrentHashPath().split('/').filter(Boolean);
  if (parts.length >= 2) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return '/personnel/categories-sectors';
}

function parseEditorStateFromHash() {
  const parts = getCurrentHashPath().split('/').filter(Boolean);
  const editorIndex = parts.indexOf('editor');

  if (editorIndex < 0) {
    return null;
  }

  const type = parts[editorIndex + 1];
  const mode = parts[editorIndex + 2];
  const itemId = parts[editorIndex + 3];

  if (!SETUP_TAB_VALUES.has(type)) {
    return null;
  }
  if (!['create', 'edit'].includes(mode)) {
    return null;
  }
  if (mode === 'edit' && !itemId) {
    return null;
  }

  return {
    mode,
    type,
    itemId: itemId || null,
  };
}

function resolveEditorItem(editorState, records) {
  if (!editorState || editorState.mode !== 'edit' || !editorState.itemId) {
    return null;
  }

  const sourceRecords = editorState.type === 'categories'
    ? records.categories
    : editorState.type === 'sectors'
      ? records.sectors
      : records.requirementTemplates;

  return sourceRecords.find((record) => record.id === editorState.itemId) || null;
}

export default function CategoriesSectorsScreen({ actions, navigate }) {
  const [activeTab, setActiveTab] = useState('categories');
  const [records, setRecords] = useState({ categories: [], sectors: [], requirementTemplates: [], programs: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState(() => parseEditorStateFromHash());
  const [form, setForm] = useState(() => createSetupForm());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRecords = async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextRecords = await listProgramRecords();
      setRecords(nextRecords);
    } catch (loadError) {
      setRecords({ categories: [], sectors: [], requirementTemplates: [], programs: [] });
      setError(loadError.message || 'Unable to load program setup records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setError('Supabase is not configured. Program setup records require the database connection.');
      return;
    }

    loadRecords();
  }, []);

  useEffect(() => {
    const syncEditorState = () => {
      const nextState = parseEditorStateFromHash();
      if (!nextState) {
        setModalState(null);
        setForm(createSetupForm());
        return;
      }

      if (nextState.type !== activeTab) {
        setActiveTab(nextState.type);
      }

      const nextItem = resolveEditorItem(nextState, records);
      const hydratedState = {
        ...nextState,
        item: nextItem,
      };
      setModalState(hydratedState);
      if (nextState.mode === 'create') {
        setForm(createSetupForm());
      } else if (nextItem) {
        setForm(createSetupForm(nextItem));
      }
    };

    syncEditorState();
    window.addEventListener('hashchange', syncEditorState);
    return () => window.removeEventListener('hashchange', syncEditorState);
  }, [activeTab, records]);

  const activeRecords = activeTab === 'categories'
    ? records.categories
    : activeTab === 'sectors'
      ? records.sectors
      : records.requirementTemplates;
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeRecords.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = [
        item.name,
        item.description,
        item.status,
        item.expectedDocumentType,
        ...(item.acceptedDocumentTypes || []),
        item.isRequired ? 'required' : 'optional',
        item.allowMultipleFiles ? 'multiple files' : 'single file',
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return haystack.includes(query);
    });
  }, [activeRecords, search, statusFilter]);

  const openModal = (mode, type = activeTab, item = null) => {
    const nextState = {
      mode,
      type,
      itemId: item?.id || null,
      item,
    };
    setError('');
    setModalState(nextState);
    setForm(createSetupForm(item));
    const nextPath = mode === 'edit'
      ? `${getSetupBasePath()}/editor/${type}/edit/${item?.id || ''}`
      : `${getSetupBasePath()}/editor/${type}/create`;
    if (navigate) {
      navigate(nextPath);
    } else {
      window.location.hash = `#${nextPath}`;
    }
  };

  const closeModal = () => {
    setError('');
    setModalState(null);
    setForm(createSetupForm());
    const nextPath = getSetupBasePath();
    if (navigate) {
      navigate(nextPath);
    } else {
      window.location.hash = `#${nextPath}`;
    }
  };

  const saveSetupItem = async () => {
    if (!form.name.trim()) {
      setError(`Enter the ${modalState?.type === 'categories' ? 'category' : modalState?.type === 'sectors' ? 'sector' : 'requirement'} name before saving.`);
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      isActive: form.status === 'Active',
    };
    const requirementPayload = {
      ...payload,
      expectedDocumentType: form.expectedDocumentType,
      acceptedDocumentTypes: uniqueDocumentTypes(form.acceptedDocumentTypes),
      isRequired: form.isRequired === 'yes',
      allowMultipleFiles: form.allowMultipleFiles === 'yes',
      sortOrder: form.sortOrder,
    };

    try {
      if (modalState.type === 'requirements') {
        if (modalState.mode === 'edit') {
          await updateRequirementTemplate(modalState.item.id, requirementPayload);
        } else {
          await createRequirementTemplate(requirementPayload);
        }
      } else if (modalState.type === 'categories') {
        if (modalState.mode === 'edit') {
          await updateProgramCategory(modalState.item.id, payload);
        } else {
          await createProgramCategory(payload);
        }
      } else if (modalState.mode === 'edit') {
        await updateProgramSector(modalState.item.id, payload);
      } else {
        await createProgramSector(payload);
      }

      closeModal();
      await loadRecords();
      await actions?.refreshProgramRecords?.();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this setup record.');
    }
  };

  const toggleStatus = async (item) => {
    const payload = {
      name: item.name,
      description: item.description,
      isActive: !item.isActive,
      expectedDocumentType: item.expectedDocumentType,
      acceptedDocumentTypes: item.acceptedDocumentTypes || [],
      isRequired: item.isRequired,
      allowMultipleFiles: item.allowMultipleFiles,
      sortOrder: item.sortOrder,
    };

    try {
      if (activeTab === 'categories') {
        await updateProgramCategory(item.id, payload);
      } else if (activeTab === 'sectors') {
        await updateProgramSector(item.id, payload);
      } else {
        await updateRequirementTemplate(item.id, payload);
      }

      await loadRecords();
      await actions?.refreshProgramRecords?.();
    } catch (statusError) {
      setError(statusError.message || 'Unable to update this setup record.');
    }
  };

  const tabTitle = activeTab === 'categories'
    ? 'Program categories'
    : activeTab === 'sectors'
      ? 'Program sectors'
      : 'Requirement templates';
  const tabDescription = activeTab === 'categories'
    ? 'Categories classify each program listing for browsing and reporting.'
    : activeTab === 'sectors'
      ? 'Sectors identify the applicant groups connected to a program.'
      : 'Reusable requirement templates can be selected when creating program listings.';
  const addLabel = activeTab === 'categories'
    ? 'Category'
    : activeTab === 'sectors'
      ? 'Sector'
    : 'Requirement template';
  const activeSummary = activeTab === 'categories'
    ? records.categories.filter((item) => item.isActive).length
    : activeTab === 'sectors'
      ? records.sectors.filter((item) => item.isActive).length
      : records.requirementTemplates.filter((item) => item.isActive).length;
  const toggleAcceptedDocumentType = (value) => {
    const next = new Set(form.acceptedDocumentTypes || []);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    const acceptedDocumentTypes = [...next];
    setForm({
      ...form,
      acceptedDocumentTypes,
      expectedDocumentType: acceptedDocumentTypes[0] || '',
    });
  };

  return (
    <>
      <style>{`
        .ps-shell {
          display: grid;
          gap: 14px;
          padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
          box-sizing: border-box;
          font-family: var(--pf-font-body, system-ui, sans-serif);
          color: #1a3356;
        }
        .ps-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .ps-stat {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .ps-stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .07em;
          color: #7a8fa6;
        }
        .ps-stat-value {
          font-size: 1.75rem;
          line-height: 1;
          font-weight: 700;
          color: #0f2f63;
        }
        .ps-stat-detail {
          font-size: 0.76rem;
          color: #7a8fa6;
        }
        .ps-toolbar {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .ps-search {
          width: 100%;
          height: 42px;
          border: 1px solid #d7dde8;
          background: #f8fafd;
          padding: 0 14px;
          font: inherit;
          font-size: .92rem;
          color: #1a3356;
          outline: none;
        }
        .ps-filter-row {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ps-select-wrap {
          display: grid;
          gap: 4px;
        }
        .ps-label {
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .09em;
          color: #7a8fa6;
        }
        .ps-select {
          width: 100%;
          border: 1px solid #d7dde8;
          background: #f8fafd;
          color: #1a3356;
          font: inherit;
          font-size: .88rem;
          font-weight: 600;
          height: 42px;
          padding: 0 12px;
        }
        .ps-panel {
          background: #ffffff;
          border: 1px solid #d7dde8;
          box-shadow: 0 1px 4px rgba(15,47,99,.05);
          overflow: hidden;
        }
        .ps-panel-top {
          padding: 16px 20px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ps-eyebrow {
          display: block;
          font-size: .67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
          margin-bottom: 3px;
        }
        .ps-panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f2f63;
          line-height: 1.2;
        }
        .ps-panel-subtitle {
          margin: 4px 0 0;
          font-size: .84rem;
          color: #4a5e7a;
        }
        .ps-add-btn {
          background: #0f2f63;
          color: #ffffff;
          border: none;
          padding: 9px 18px;
          font: inherit;
          font-size: .86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .ps-panel-body {
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .ps-error {
          border: 1px solid rgba(195, 86, 75, 0.24);
          background: rgba(195, 86, 75, 0.08);
          color: #8f2f28;
          padding: 10px 12px;
          font-size: .82rem;
          line-height: 1.45;
        }
        .ps-info-banner {
          background: #f8fafd;
          border: 1px solid #e8ecf2;
          border-left: 3px solid #2a4e8c;
          padding: 12px 16px;
          display: grid;
          gap: 4px;
        }
        .ps-info-banner strong {
          font-size: .88rem;
          font-weight: 700;
          color: #0f2f63;
        }
        .ps-info-banner p {
          margin: 0;
          font-size: .82rem;
          color: #4a5e7a;
          line-height: 1.5;
        }
        .ps-table {
          border: 1px solid #d7dde8;
          overflow: hidden;
        }
        .ps-table-head,
        .ps-table-row {
          display: grid;
          grid-template-columns: minmax(210px, 1.2fr) minmax(230px, 1.45fr) minmax(210px, 1.1fr) minmax(130px, .7fr) 190px;
          gap: 12px;
          align-items: center;
        }
        .ps-table-head {
          padding: 10px 16px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
        }
        .ps-table-row {
          padding: 12px 16px;
          border-bottom: 1px solid #e8ecf2;
          background: #ffffff;
        }
        .ps-table-row:last-child {
          border-bottom: 0;
        }
        .ps-cell {
          min-width: 0;
          display: grid;
          gap: 3px;
        }
        .ps-cell strong {
          font-size: .9rem;
          font-weight: 700;
          color: #1a3356;
          line-height: 1.28;
        }
        .ps-cell small {
          margin: 0;
          color: #6d8198;
          font-size: .77rem;
          line-height: 1.45;
        }
        .ps-status-cell {
          display: inline-flex;
          align-items: center;
        }
        .ps-actions {
          display: flex;
          align-items: center;
          gap: .5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .ps-action-btn {
          border: 1px solid #c8d8f5;
          background: #fff;
          color: #2a4e8c;
          min-height: 32px;
          padding: 0 12px;
          font: inherit;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .ps-action-btn.is-primary {
          border-color: #0f2f63;
          background: #0f2f63;
          color: #fff;
        }
        .ps-modal-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ps-editor-shell {
          border: 1px solid #d7dde8;
          background: #f8fafd;
          padding: 14px;
          display: grid;
          gap: 12px;
        }
        .ps-editor-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ps-editor-title {
          margin: 0;
          font-size: .95rem;
          font-weight: 700;
          color: #0f2f63;
          line-height: 1.25;
        }
        .ps-editor-subtitle {
          margin: 4px 0 0;
          font-size: .8rem;
          color: #4a5e7a;
          line-height: 1.45;
        }
        .ps-editor-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ps-editor-btn {
          border: 1px solid #c8d8f5;
          background: #fff;
          color: #2a4e8c;
          min-height: 34px;
          padding: 0 12px;
          font: inherit;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .ps-editor-btn.is-primary {
          border-color: #0f2f63;
          background: #0f2f63;
          color: #fff;
        }
        .ps-doc-type-picker {
          grid-column: 1 / -1;
          display: grid;
          gap: 8px;
        }
        .ps-doc-type-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          max-height: 220px;
          overflow: auto;
          border: 1px solid #d7dde8;
          background: #f8fafd;
          padding: 10px;
        }
        .ps-doc-type-option {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 6px 8px;
          background: #ffffff;
          border: 1px solid #e0e6ef;
          font-size: .78rem;
          font-weight: 700;
          color: #1a3356;
          cursor: pointer;
        }
        .ps-doc-type-option input {
          margin: 0;
          accent-color: #0f2f63;
        }
        .ps-doc-type-summary {
          margin: 0;
          font-size: .78rem;
          color: #5a7090;
          line-height: 1.45;
        }
        @media (max-width: 1200px) {
          .ps-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .ps-table-head {
            display: none;
          }
          .ps-table-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .ps-actions {
            justify-content: flex-start;
          }
        }
        @media (max-width: 760px) {
          .ps-filter-row {
            grid-template-columns: 1fr;
          }
          .ps-table-row {
            grid-template-columns: 1fr;
          }
          .ps-stats {
            grid-template-columns: 1fr;
          }
          .ps-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="ps-shell">
        <section className="ps-stats">
          <article className="ps-stat">
            <span className="ps-stat-label">Categories</span>
            <strong className="ps-stat-value">{records.categories.length}</strong>
            <small className="ps-stat-detail">Program taxonomy</small>
          </article>
          <article className="ps-stat">
            <span className="ps-stat-label">Sectors</span>
            <strong className="ps-stat-value">{records.sectors.length}</strong>
            <small className="ps-stat-detail">Beneficiary groups</small>
          </article>
          <article className="ps-stat">
            <span className="ps-stat-label">Requirement templates</span>
            <strong className="ps-stat-value">{records.requirementTemplates.length}</strong>
            <small className="ps-stat-detail">Reusable checklists</small>
          </article>
          <article className="ps-stat">
            <span className="ps-stat-label">Active in view</span>
            <strong className="ps-stat-value">{activeSummary}</strong>
            <small className="ps-stat-detail">{tabTitle}</small>
          </article>
        </section>

        <section className="ps-toolbar">
          <input
            className="ps-search"
            type="text"
            placeholder="Search name, description, rules, or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="ps-filter-row">
            <div className="ps-select-wrap">
              <label className="ps-label" htmlFor="ps-view-filter">Setup view</label>
              <select
                id="ps-view-filter"
                className="ps-select"
                value={activeTab}
                onChange={(event) => setActiveTab(event.target.value)}
              >
                {SETUP_TABS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ps-select-wrap">
              <label className="ps-label" htmlFor="ps-status-filter">Status</label>
              <select
                id="ps-status-filter"
                className="ps-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {RECORD_STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="ps-panel">
          <div className="ps-panel-top">
            <div>
              <span className="ps-eyebrow">Reference records</span>
              <h2 className="ps-panel-title">{tabTitle}</h2>
              <p className="ps-panel-subtitle">{tabDescription}</p>
            </div>
            {modalState ? (
              <div className="ps-editor-actions">
                <button type="button" className="ps-editor-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="ps-editor-btn is-primary" onClick={saveSetupItem}>
                  Save
                </button>
              </div>
            ) : (
              <button type="button" className="ps-add-btn" onClick={() => openModal('create')}>
                Add {addLabel}
              </button>
            )}
          </div>

          <div className="ps-panel-body">
            {error ? <div className="ps-error">{error}</div> : null}

            {modalState ? (
              <section className="ps-editor-shell">
                <div className="ps-editor-head">
                  <div>
                    <h3 className="ps-editor-title">
                      {modalState.mode === 'edit' ? 'Edit' : 'Add'} {modalState.type === 'categories' ? 'category' : modalState.type === 'sectors' ? 'sector' : 'requirement template'}
                    </h3>
                    <p className="ps-editor-subtitle">
                      Configure this setup record and save changes directly from this page.
                    </p>
                  </div>
                </div>
                <div className="ps-modal-grid">
                  <FormField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                  <SelectField label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={STATUS_OPTIONS} />
                  <FormField label="Description" type="textarea" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                  {modalState.type === 'requirements' ? (
                    <>
                      <SelectField label="Required by default" value={form.isRequired} onChange={(value) => setForm({ ...form, isRequired: value })} options={YES_NO_OPTIONS} />
                      <div className="ps-doc-type-picker">
                        <span className="ps-label">Accepted Document Vault Types</span>
                        <div className="ps-doc-type-list">
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <label className="ps-doc-type-option" key={option.value}>
                              <input
                                type="checkbox"
                                checked={(form.acceptedDocumentTypes || []).includes(option.value)}
                                onChange={() => toggleAcceptedDocumentType(option.value)}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                        <p className="ps-doc-type-summary">
                          Selected: {formatDocumentTypeList(form.acceptedDocumentTypes)}
                        </p>
                      </div>
                      <SelectField label="Allow multiple files" value={form.allowMultipleFiles} onChange={(value) => setForm({ ...form, allowMultipleFiles: value })} options={YES_NO_OPTIONS} />
                      <FormField label="Sort order" type="number" value={form.sortOrder} onChange={(value) => setForm({ ...form, sortOrder: value })} />
                    </>
                  ) : null}
                </div>
              </section>
            ) : (
              <div className="ps-info-banner">
                <strong>{filteredRecords.length} records in current view</strong>
                <p>These records are used by Program Listings and applicant-facing screens. Keep names consistent for clean filtering and reporting.</p>
              </div>
            )}

            {!modalState && isLoading ? <EmptyState title="Loading setup records" text="Fetching program setup records from Supabase." /> : null}

            {!modalState && !isLoading && filteredRecords.length ? (
              <div className="ps-table">
                <div className="ps-table-head">
                  <span>Name</span>
                  <span>Description</span>
                  <span>{activeTab === 'requirements' ? 'Rules' : 'Usage'}</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <div>
                  {filteredRecords.map((item) => (
                    <article className="ps-table-row" key={item.id}>
                      <div className="ps-cell">
                        <strong>{item.name}</strong>
                        <small>
                          {activeTab === 'categories'
                            ? `${item.programCount || 0} linked programs`
                            : activeTab === 'sectors'
                              ? 'Sector tag'
                              : `Sort order ${item.sortOrder || 0}`}
                        </small>
                      </div>
                      <div className="ps-cell">
                        <strong>{item.description || 'No description set'}</strong>
                        <small>
                          {activeTab === 'requirements' ? 'Template note' : 'Reference text'}
                        </small>
                      </div>
                      <div className="ps-cell">
                        <strong>
                          {activeTab === 'requirements'
                            ? (item.isRequired ? 'Required by default' : 'Optional upload')
                            : (activeTab === 'categories' ? 'Program grouping' : 'Beneficiary grouping')}
                        </strong>
                        <small>
                          {activeTab === 'requirements'
                            ? `Accepted: ${formatDocumentTypeList(item.acceptedDocumentTypes?.length ? item.acceptedDocumentTypes : item.expectedDocumentType)} / ${item.allowMultipleFiles ? 'Allows multiple files' : 'Single file'}`
                            : 'Used in filters and listing metadata'}
                        </small>
                      </div>
                      <div className="ps-status-cell">
                        <StatusPill status={item.status} />
                      </div>
                      <div className="ps-actions">
                        <button type="button" className="ps-action-btn" onClick={() => openModal('edit', activeTab, item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`ps-action-btn ${item.isActive ? '' : 'is-primary'}`}
                          onClick={() => toggleStatus(item)}
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {!modalState && !isLoading && !filteredRecords.length ? (
              <EmptyState
                title={`No ${activeTab === 'categories' ? 'categories' : activeTab === 'sectors' ? 'sectors' : 'requirement templates'} yet`}
                text={activeTab === 'requirements'
                  ? 'Add reusable requirement templates before creating program listings.'
                  : `Add the first ${activeTab === 'categories' ? 'category' : 'sector'} before creating program listings.`}
              />
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
