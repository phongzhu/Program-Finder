import { useEffect, useState } from 'react';
import { ROLE_LABELS } from '../../../data/prototypeSeed';
import { DetailItem, EmptyState, FormField, SectionHeading, SelectField, StatusPill } from '../../../shared/components/ui';

const ACCOUNT_TABS = [
  { key: 'account-list', label: 'Account List' },
  { key: 'add-user', label: 'Add User (Access Dates)' },
];

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Government Personnel', value: 'personnel' },
  { label: 'Applicant', value: 'applicant' },
];

const ROLE_FILTERS = [
  { label: 'All Accounts', value: 'all' },
  { label: 'Admins', value: 'admin' },
  { label: 'Personnel', value: 'personnel' },
  { label: 'Applicants', value: 'applicant' },
];

const ROLE_ORDER = {
  admin: 0,
  personnel: 1,
  applicant: 2,
};

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createInitialInviteForm(defaultMunicipality) {
  return {
    name: '',
    email: '',
    role: 'personnel',
    municipality: defaultMunicipality,
    accessStartDate: getDateInputValue(),
    accessEndDate: getDateInputValue(30),
  };
}

function formatAccessDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function formatAccessWindow(user) {
  const start = user.accessStartDate ? formatAccessDate(user.accessStartDate) : '';
  const end = user.accessEndDate ? formatAccessDate(user.accessEndDate) : '';

  if (start && end) {
    return `${start} to ${end}`;
  }

  if (start) {
    return `Starts ${start}`;
  }

  if (end) {
    return `Until ${end}`;
  }

  return 'No scheduled window';
}

function getAssignmentSummary(user) {
  if (user.municipality && user.office) {
    return `${user.municipality} | ${user.office}`;
  }

  if (user.municipality) {
    return `${user.municipality} | Office not set`;
  }

  if (user.office) {
    return `Office only | ${user.office}`;
  }

  return 'No municipality or office assignment';
}

function getUserNotePayload(user) {
  const contextualNotes = [];

  if (user.role === 'admin') {
    contextualNotes.push('Platform-wide access across account management, municipalities, reports, and settings.');
  } else if (user.role === 'personnel') {
    contextualNotes.push(
      user.office
        ? `Assigned to ${user.office} under ${user.municipality || 'no municipality yet'}.`
        : 'Personnel account still needs a specific municipality or office assignment.'
    );
  } else {
    contextualNotes.push('Applicant access stays within the resident applicant portal and personal application records.');
  }

  if (user.inviteStatus === 'Queued') {
    contextualNotes.push('The invite is queued and waiting for Gmail delivery.');
  } else if (user.inviteStatus === 'Credentials Reset') {
    contextualNotes.push('Credentials were reset and the latest temporary password should be used.');
  } else if (user.inviteStatus === 'Assignment Removed') {
    contextualNotes.push('Previous municipality and office scope were removed from this account.');
  } else if (user.inviteStatus) {
    contextualNotes.push(`Invite status is currently marked as ${user.inviteStatus}.`);
  }

  if (user.status === 'Pending') {
    contextualNotes.push('Access is scheduled and will become active when the assigned window begins.');
  } else if (user.status === 'Inactive') {
    contextualNotes.push('This account cannot sign in until access is reactivated.');
  }

  return {
    assignment: getAssignmentSummary(user),
    accessWindow: formatAccessWindow(user),
    details: [
      { label: 'Role', value: ROLE_LABELS[user.role] || user.role },
      { label: 'Role Title', value: user.title || ROLE_LABELS[user.role] || 'Not set' },
      { label: 'Username', value: user.username || 'Not generated' },
      { label: 'Municipality', value: user.municipality || 'Unassigned' },
      { label: 'Office', value: user.office || 'Unassigned' },
      { label: 'Invite Status', value: user.inviteStatus || 'No invite notes' },
      { label: 'Last Logged In', value: user.lastActive || 'Never' },
      { label: 'Date Assigned', value: user.dateAssigned ? formatAccessDate(user.dateAssigned) : 'Not set' },
    ],
    notes: contextualNotes,
  };
}

export default function UserAccountsScreen({ data, actions }) {
  const municipalityOptions = [...new Set([
    ...data.offices.map((office) => office.municipality),
    ...data.users.map((user) => user.municipality),
  ])]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  const defaultMunicipality = municipalityOptions[0] || 'Bulacan Province';
  const [activeTab, setActiveTab] = useState('account-list');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [notesUserId, setNotesUserId] = useState(null);
  const [inviteForm, setInviteForm] = useState(() => createInitialInviteForm(defaultMunicipality));

  useEffect(() => {
    if (!notesUserId) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotesUserId(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notesUserId]);

  const filteredUsers = [...data.users]
    .filter((user) => {
      const query = search.trim().toLowerCase();
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      if (!matchesRole) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        user.name,
        user.email,
        user.status,
        user.lastActive,
        user.municipality,
        user.office,
        ROLE_LABELS[user.role] || user.role,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((left, right) => {
      const roleDelta = (ROLE_ORDER[left.role] ?? 99) - (ROLE_ORDER[right.role] ?? 99);
      if (roleDelta !== 0) {
        return roleDelta;
      }

      return left.name.localeCompare(right.name);
    });

  const accountStats = [
    { label: 'Total Accounts', value: data.users.length, detail: 'all roles' },
    { label: 'Active', value: data.users.filter((user) => user.status === 'Active').length, detail: 'can sign in' },
    { label: 'Pending', value: data.users.filter((user) => user.status === 'Pending').length, detail: 'scheduled access' },
    { label: 'Inactive', value: data.users.filter((user) => user.status === 'Inactive').length, detail: 'disabled access' },
  ];

  const accessManagedUsers = [...data.users]
    .filter((user) => user.accessStartDate || user.accessEndDate)
    .sort((left, right) => {
      const leftValue = left.accessStartDate || left.accessEndDate || '';
      const rightValue = right.accessStartDate || right.accessEndDate || '';
      return rightValue.localeCompare(leftValue);
    });

  const resetInviteForm = () => {
    setInviteForm(createInitialInviteForm(defaultMunicipality));
  };

  const handleInviteSubmit = () => {
    const result = actions.createUserAccount(inviteForm);
    if (result?.ok) {
      resetInviteForm();
      setSearch('');
      setActiveTab('account-list');
    }
  };

  const activeRoleLabel = ROLE_FILTERS.find((filter) => filter.value === roleFilter)?.label || 'All Accounts';
  const selectedNotesUser = data.users.find((user) => user.id === notesUserId) || null;
  const selectedNotesPayload = selectedNotesUser ? getUserNotePayload(selectedNotesUser) : null;

  return (
    <>
      <div className="dashboard-grid">
        <div className="section-card admin-account-shell">
        <div className="admin-inline-tabs" role="tablist" aria-label="Account management views">
          {ACCOUNT_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`admin-inline-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'account-list' ? (
          <div className="admin-account-panel">
            <div className="admin-account-overview">
              <SectionHeading
                eyebrow="Platform accounts"
                title="Account list"
                text="Review every account, filter by role, and manage account access from one cleaner admin view."
              />

              <div className="admin-account-stats">
                {accountStats.map((item) => (
                  <article className="admin-account-stat" key={item.label}>
                    <small>{item.detail}</small>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="admin-account-filters">
              <div className="admin-account-toolbar">
                <FormField
                  label="Search accounts"
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by role, full name, email, office, municipality, or status"
                />
              </div>

              <div className="admin-role-filters" aria-label="Filter accounts by role">
                {ROLE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    className={`admin-role-filter ${roleFilter === filter.value ? 'is-active' : ''}`}
                    onClick={() => setRoleFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredUsers.length ? (
              <div className="account-list-table-shell">
                <div className="admin-account-meta">
                  <p>
                    Showing <strong>{filteredUsers.length}</strong> account{filteredUsers.length === 1 ? '' : 's'}
                    {' '}under <strong>{activeRoleLabel}</strong>.
                  </p>
                </div>

                <div className="account-list-table" role="table" aria-label="Platform account list">
                <div className="account-list-header" role="row">
                  <span>Role</span>
                  <span>Account</span>
                  <span>Email</span>
                  <span>Status</span>
                  <span>Last Logged In</span>
                  <span>Notes</span>
                  <span>Access</span>
                </div>

                <div className="stack-list compact">
                  {filteredUsers.map((user) => {
                    const isActive = user.status === 'Active';

                    return (
                      <article className="account-list-row" key={user.id} role="row">
                        <div className="account-list-cell">
                          <span className={`role-pill role-pill-${user.role}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </div>
                        <div className="account-list-cell account-list-cell-stack">
                          <strong>{user.name}</strong>
                          <small className="account-secondary">{user.username ? `@${user.username}` : user.title || 'No username yet'}</small>
                        </div>
                        <div className="account-list-cell account-list-cell-stack">
                          <span className="account-email">{user.email}</span>
                          <small className="account-secondary">{user.title || ROLE_LABELS[user.role] || user.role}</small>
                        </div>
                        <div className="account-list-cell account-list-cell-stack">
                          <StatusPill status={user.status} />
                          <small className="account-secondary">{formatAccessWindow(user)}</small>
                        </div>
                        <div className="account-list-cell account-list-cell-stack">
                          <span className="account-last-login">{user.lastActive || 'Never'}</span>
                          <small className="account-secondary">
                            {user.dateAssigned ? `Assigned ${formatAccessDate(user.dateAssigned)}` : 'No assignment date'}
                          </small>
                        </div>
                        <div className="account-list-cell account-list-cell-stack account-list-cell-notes">
                          <button
                            className="account-note-trigger"
                            onClick={() => setNotesUserId(user.id)}
                            type="button"
                          >
                            View Notes
                          </button>
                        </div>
                        <div className="account-list-cell account-list-cell-stack account-list-cell-actions">
                          <button
                            className={`status-switch ${isActive ? 'is-on' : ''}`}
                            onClick={() => actions.toggleUserStatus(user.id)}
                            role="switch"
                            type="button"
                            aria-checked={isActive}
                            aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
                          >
                            <span className="status-switch-track">
                              <span className="status-switch-thumb" />
                            </span>
                            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              </div>
            ) : (
              <EmptyState title="No accounts found" text="Try a different name, email, role, or status keyword." />
            )}
          </div>
        ) : (
          <div className="admin-account-panel">
            <SectionHeading
              eyebrow="Municipality access"
              title="Add user"
              text="Assign a role, set the access dates, and queue the Gmail invite with an auto-generated temporary password."
            />

            <div className="admin-user-compose">
              <div className="admin-user-form">
                <div className="profile-grid">
                  <FormField
                    label="Full name"
                    value={inviteForm.name}
                    onChange={(value) => setInviteForm({ ...inviteForm, name: value })}
                    placeholder="Enter the user's full name"
                  />
                  <FormField
                    label="Gmail address"
                    type="email"
                    value={inviteForm.email}
                    onChange={(value) => setInviteForm({ ...inviteForm, email: value })}
                    placeholder="name@gmail.com"
                  />
                  <SelectField
                    label="Role"
                    value={inviteForm.role}
                    onChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                    options={ROLE_OPTIONS}
                  />
                  <SelectField
                    label="Municipality"
                    value={inviteForm.municipality}
                    onChange={(value) => setInviteForm({ ...inviteForm, municipality: value })}
                    options={municipalityOptions.map((municipality) => ({
                      label: municipality,
                      value: municipality,
                    }))}
                  />
                  <FormField
                    label="Access start date"
                    type="date"
                    value={inviteForm.accessStartDate}
                    onChange={(value) => setInviteForm({ ...inviteForm, accessStartDate: value })}
                  />
                  <FormField
                    label="Access end date"
                    type="date"
                    value={inviteForm.accessEndDate}
                    onChange={(value) => setInviteForm({ ...inviteForm, accessEndDate: value })}
                  />
                </div>

                <div className="admin-form-note">
                  <strong>Invite note</strong>
                  <p>
                    The Gmail address entered here will receive the access invite together with an
                    auto-generated temporary password.
                  </p>
                </div>

                <div className="card-actions wrap-actions">
                  <button className="primary-button" onClick={handleInviteSubmit} type="button">
                    Send Access Invite
                  </button>
                  <button className="ghost-button" onClick={resetInviteForm} type="button">
                    Reset Form
                  </button>
                </div>
              </div>

              <div className="admin-sidecar-stack">
                <aside className="admin-sidecar-card">
                  <p className="eyebrow">Access window</p>
                  <h3>Invite preview</h3>
                  <div className="detail-grid">
                    <DetailItem label="Role" value={ROLE_LABELS[inviteForm.role]} />
                    <DetailItem label="Municipality" value={inviteForm.municipality} />
                    <DetailItem label="Starts" value={inviteForm.accessStartDate} />
                    <DetailItem label="Ends" value={inviteForm.accessEndDate} />
                  </div>
                  <p className="body-text">
                    New invites appear in the account list immediately. Future start dates stay
                    pending until the access window begins.
                  </p>
                </aside>

                <aside className="admin-sidecar-card access-schedule-card">
                  <div className="admin-sidecar-heading">
                    <p className="eyebrow">Scheduled access</p>
                    <h3>Accounts with access dates</h3>
                  </div>

                  {accessManagedUsers.length ? (
                    <div className="access-schedule-list">
                      {accessManagedUsers.map((user) => (
                        <article className="access-schedule-row" key={user.id}>
                          <div className="access-schedule-top">
                            <div>
                              <strong>{user.name}</strong>
                              <p>{user.email}</p>
                            </div>
                            <span className={`role-pill role-pill-${user.role}`}>
                              {ROLE_LABELS[user.role] || user.role}
                            </span>
                          </div>
                          <div className="access-schedule-meta">
                            <span>{user.municipality}</span>
                            <span>{formatAccessDate(user.accessStartDate)} to {formatAccessDate(user.accessEndDate)}</span>
                          </div>
                          <div className="access-schedule-bottom">
                            <StatusPill status={user.status} />
                            {user.inviteStatus ? <StatusPill status={user.inviteStatus} /> : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No scheduled access yet"
                      text="Accounts with explicit start and end dates will appear here after an invite is created."
                    />
                  )}
                </aside>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {selectedNotesUser && selectedNotesPayload ? (
        <div className="admin-account-modal-backdrop" onClick={() => setNotesUserId(null)} role="presentation">
          <div
            aria-modal="true"
            className="admin-account-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="admin-account-modal-header">
              <div className="admin-account-modal-copy">
                <small>Account notes</small>
                <strong>{selectedNotesUser.name}</strong>
                <p>{selectedNotesUser.email}</p>
              </div>
              <button className="account-note-close" onClick={() => setNotesUserId(null)} type="button">
                Close
              </button>
            </div>

            <div className="admin-account-modal-body">
              <div className="admin-account-note-banner">
                <div>
                  <strong>Assignment details</strong>
                  <p>{selectedNotesPayload.assignment}</p>
                </div>
                <div className="admin-account-note-badges">
                  <span className={`role-pill role-pill-${selectedNotesUser.role}`}>
                    {ROLE_LABELS[selectedNotesUser.role] || selectedNotesUser.role}
                  </span>
                  <StatusPill status={selectedNotesUser.status} />
                  {selectedNotesUser.inviteStatus ? <StatusPill status={selectedNotesUser.inviteStatus} /> : null}
                </div>
              </div>

              <div className="detail-grid admin-account-note-grid">
                {selectedNotesPayload.details.map((detail) => (
                  <DetailItem key={detail.label} label={detail.label} value={detail.value} />
                ))}
                <DetailItem label="Access Window" value={selectedNotesPayload.accessWindow} />
              </div>

              <div className="admin-account-note-list">
                {selectedNotesPayload.notes.map((note) => (
                  <article className="admin-account-note-item" key={note}>
                    <strong>Note</strong>
                    <p>{note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
