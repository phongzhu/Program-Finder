import { useEffect, useMemo, useState } from 'react';
import { ROLE_LABELS } from 'Data/appConstants';
import { getAccountRoleLabel, getAssignableStaffRoles, getStaffRoleLabel, hasCaptainWorkspaceAccess } from 'Utils/staffHierarchy';
import { AppButton, AppSwitch, AppTable, DetailItem, EmptyState, FormField, SelectField, StatusPill } from 'Components/UI';

const ROLE_ORDER = {
  personnel: 0,
  applicant: 1,
};

const STATUS_ORDER = {
  Active: 0,
  Pending: 1,
  Inactive: 2,
};

const SORT_OPTIONS = [
  { label: 'Role then name', value: 'role-name' },
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Latest assignment', value: 'assignment-desc' },
  { label: 'Access ending soon', value: 'access-end-asc' },
  { label: 'Status', value: 'status' },
];

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
    staffRole: 'municipal_mayor',
    municipality: defaultMunicipality,
    accessStartDate: getDateInputValue(),
    accessEndDate: getDateInputValue(30),
  };
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), undefined, { sensitivity: 'base' });
}

function getInviteRoleOptions(isCaptainWorkspace) {
  return ['personnel'].map((value) => ({
    value,
    label: ROLE_LABELS[value],
  }));
}

function getInviteStaffRoleOptions(session, isCaptainWorkspace) {
  const roles = getAssignableStaffRoles(session);

  return roles.map((value) => ({
    value,
    label: getStaffRoleLabel(value),
  }));
}

function getRoleFilterLabel(role) {
  if (role === 'personnel') return 'Personnel';
  if (role === 'applicant') return 'Applicants';
  return ROLE_LABELS[role] || role;
}

function parseAccessDate(value) {
  return value ? new Date(`${value}T12:00:00`) : new Date(NaN);
}

function getDaysUntilDate(value) {
  const date = parseAccessDate(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function getUserInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
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
  if (user.municipality) {
    return user.role === 'personnel'
      ? `${user.municipality} | Municipality-wide staff scope`
      : user.municipality;
  }

  return user.role === 'personnel'
    ? 'No municipality assignment'
    : 'No municipality assignment';
}

function getUserSearchIndex(user) {
  return [
    user.name,
    user.email,
    user.status,
    user.lastActive,
    user.municipality,
    user.title,
    getAccountRoleLabel(user),
    user.inviteStatus,
    ROLE_LABELS[user.role] || user.role,
  ];
}

function sortUsers(left, right, sortKey) {
  switch (sortKey) {
    case 'name-asc':
      return compareText(left.name, right.name);
    case 'assignment-desc':
      return compareText(right.dateAssigned, left.dateAssigned) || compareText(left.name, right.name);
    case 'access-end-asc':
      return compareText(left.accessEndDate, right.accessEndDate) || compareText(left.name, right.name);
    case 'status':
      return (STATUS_ORDER[left.status] ?? 99) - (STATUS_ORDER[right.status] ?? 99) || compareText(left.name, right.name);
    case 'role-name':
    default: {
      const roleDelta = (ROLE_ORDER[left.role] ?? 99) - (ROLE_ORDER[right.role] ?? 99);
      if (roleDelta !== 0) {
        return roleDelta;
      }

      return compareText(left.name, right.name);
    }
  }
}

function getUserNotePayload(user) {
  const contextualNotes = [];

  if (user.role === 'personnel') {
    contextualNotes.push(
      user.municipality
        ? `${getAccountRoleLabel(user)} is assigned to ${user.municipality} with municipality-wide staff scope.`
        : 'Personnel account still needs a municipality assignment.'
    );
  } else {
    contextualNotes.push('Applicant access stays within the resident applicant portal and personal application records.');
  }

  if (user.inviteStatus === 'Queued') {
    contextualNotes.push('The invite is queued and waiting for Gmail delivery.');
  } else if (user.inviteStatus === 'Credentials Reset') {
    contextualNotes.push('Credentials were reset and the default temporary password should be used.');
  } else if (user.inviteStatus === 'Assignment Removed') {
    contextualNotes.push('Previous municipality scope was removed from this account.');
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
      { label: 'Role', value: getAccountRoleLabel(user) },
      { label: 'Role Title', value: user.title || getAccountRoleLabel(user) || 'Not set' },
      { label: 'Username', value: user.username || 'Not generated' },
      { label: 'Municipality', value: user.municipality || 'Unassigned' },
      { label: 'Scope', value: user.role === 'personnel' ? 'Municipality-wide staff scope' : 'Standard access' },
      { label: 'Invite Status', value: user.inviteStatus || 'No invite notes' },
      { label: 'Last Logged In', value: user.lastActive || 'Never' },
      { label: 'Date Assigned', value: user.dateAssigned ? formatAccessDate(user.dateAssigned) : 'Not set' },
    ],
    notes: contextualNotes,
  };
}

export default function UserAccountsScreen({ data, actions, session }) {
  const isCaptainWorkspace = hasCaptainWorkspaceAccess(session);
  const roleOptions = useMemo(() => getInviteRoleOptions(isCaptainWorkspace), [isCaptainWorkspace]);
  const staffRoleOptions = useMemo(() => getInviteStaffRoleOptions(session, isCaptainWorkspace), [isCaptainWorkspace, session]);
  const roleFilters = useMemo(
    () => [{ label: 'All Accounts', value: 'all' }, ...roleOptions.map((option) => ({ label: getRoleFilterLabel(option.value), value: option.value }))],
    [roleOptions]
  );
  const municipalityOptions = [...new Set([
    ...data.offices.map((office) => office.municipality),
    ...data.users.map((user) => user.municipality),
  ])]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  const defaultMunicipality = session?.municipality || municipalityOptions[0] || 'Malolos City';
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('role-name');
  const [notesUserId, setNotesUserId] = useState(null);
  const [inviteForm, setInviteForm] = useState(() => createInitialInviteForm(defaultMunicipality));
  const showStaffRoleField = inviteForm.role === 'personnel';

  const statusOptions = useMemo(() => {
    const uniqueStatuses = [...new Set(data.users.map((user) => user.status).filter(Boolean))]
      .sort((left, right) => (STATUS_ORDER[left] ?? 99) - (STATUS_ORDER[right] ?? 99) || compareText(left, right));

    return [
      { label: 'All statuses', value: 'all' },
      ...uniqueStatuses.map((status) => ({ label: status, value: status })),
    ];
  }, [data.users]);

  useEffect(() => {
    if (!notesUserId && !isInviteModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (notesUserId) {
          setNotesUserId(null);
        } else {
          setInviteModalOpen(false);
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInviteModalOpen, notesUserId]);

  useEffect(() => {
    if (!roleOptions.some((option) => option.value === inviteForm.role)) {
      setInviteForm((current) => ({ ...current, role: roleOptions[0]?.value || 'personnel' }));
    }
  }, [inviteForm.role, roleOptions]);

  useEffect(() => {
    if (showStaffRoleField && !staffRoleOptions.some((option) => option.value === inviteForm.staffRole)) {
      setInviteForm((current) => ({ ...current, staffRole: staffRoleOptions[0]?.value || '' }));
    }

    if (!showStaffRoleField && inviteForm.staffRole) {
      setInviteForm((current) => ({ ...current, staffRole: '' }));
    }
  }, [inviteForm.staffRole, showStaffRoleField, staffRoleOptions]);

  useEffect(() => {
    if (!inviteForm.municipality && defaultMunicipality) {
      setInviteForm((current) => ({ ...current, municipality: defaultMunicipality }));
    }
  }, [defaultMunicipality, inviteForm.municipality]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...data.users]
      .filter((user) => roleFilter === 'all' || user.role === roleFilter)
      .filter((user) => statusFilter === 'all' || user.status === statusFilter)
      .filter((user) => {
        if (!query) {
          return true;
        }

        return getUserSearchIndex(user).some((value) => String(value || '').toLowerCase().includes(query));
      })
      .sort((left, right) => sortUsers(left, right, sortKey));
  }, [data.users, roleFilter, search, sortKey, statusFilter]);

  const visibleStatusCounts = useMemo(() => (
    filteredUsers.reduce((accumulator, user) => {
      accumulator[user.status] = (accumulator[user.status] || 0) + 1;
      return accumulator;
    }, {})
  ), [filteredUsers]);

  const accessManagedUsers = [...data.users]
    .filter((user) => user.accessStartDate || user.accessEndDate)
    .sort((left, right) => {
      const leftValue = left.accessStartDate || left.accessEndDate || '';
      const rightValue = right.accessStartDate || right.accessEndDate || '';
      return rightValue.localeCompare(leftValue);
    });
  const activeRoleLabel = roleFilters.find((filter) => filter.value === roleFilter)?.label || 'All Accounts';
  const activeStatusLabel = statusOptions.find((option) => option.value === statusFilter)?.label || 'All statuses';
  const queuedInvites = data.users.filter((user) => user.inviteStatus === 'Queued').length;
  const municipalitiesCovered = new Set(data.users.map((user) => user.municipality).filter(Boolean)).size;
  const expiringSoonCount = accessManagedUsers.filter((user) => {
    const daysUntilEnd = getDaysUntilDate(user.accessEndDate);
    return daysUntilEnd !== null && daysUntilEnd >= 0 && daysUntilEnd <= 7;
  }).length;
  const workspaceHighlights = [
    { label: 'Queued invites', value: queuedInvites, note: queuedInvites ? 'waiting for Gmail delivery' : 'no pending invites' },
    { label: 'Access schedules', value: accessManagedUsers.length, note: 'accounts with start and end dates' },
    { label: 'Municipal coverage', value: municipalitiesCovered, note: 'municipalities assigned to accounts' },
  ];
  const accountStats = [
    { label: 'Visible Accounts', value: filteredUsers.length, detail: `${activeRoleLabel.toLowerCase()} | ${activeStatusLabel.toLowerCase()}` },
    { label: 'Active', value: visibleStatusCounts.Active || 0, detail: 'matching filters' },
    { label: 'Pending', value: visibleStatusCounts.Pending || 0, detail: 'scheduled access' },
    { label: 'Inactive', value: visibleStatusCounts.Inactive || 0, detail: 'disabled access' },
  ];

  const resetInviteForm = () => {
    setInviteForm(createInitialInviteForm(defaultMunicipality));
  };

  const handleInviteSubmit = () => {
    actions.requestConfirmation({
      title: 'Send access invite?',
      message: 'Review the account details, municipality, and access dates before creating this user account.',
      confirmLabel: 'Send Invite',
      onConfirm: async () => {
        const result = await actions.createUserAccount(inviteForm);
        if (result?.ok) {
          resetInviteForm();
          setSearch('');
          setInviteModalOpen(false);
        }
      },
    });
  };

  const handleStatusToggle = (user) => {
    const isActive = user.status === 'Active';

    actions.requestConfirmation({
      title: isActive ? 'Deactivate account?' : 'Activate account?',
      message: `${isActive ? 'Deactivate' : 'Activate'} ${user.name}'s account only after confirming the access status is correct.`,
      confirmLabel: isActive ? 'Deactivate Account' : 'Activate Account',
      tone: isActive ? 'danger' : 'accent',
      onConfirm: () => actions.toggleUserStatus(user.id),
    });
  };

  const selectedNotesUser = data.users.find((user) => user.id === notesUserId) || null;
  const selectedNotesPayload = selectedNotesUser ? getUserNotePayload(selectedNotesUser) : null;
  const workspaceFocusLabel = 'Visible accounts';
  const workspaceFocusValue = filteredUsers.length;
  const workspaceFocusNote = search.trim()
    ? `${activeRoleLabel} with ${activeStatusLabel.toLowerCase()} matching the current search filters.`
    : expiringSoonCount
      ? `${expiringSoonCount} access window${expiringSoonCount === 1 ? '' : 's'} end within the next 7 days.`
      : `${activeRoleLabel} with ${activeStatusLabel.toLowerCase()} and live filters visible.`;
  const inviteDescription = isCaptainWorkspace
    ? 'Assign the municipality, set the access dates, and send the staff magic link with a generated temporary password. System admins and system secretaries can create municipal mayor accounts from this workspace.'
    : `Assign the staff role, set the access dates, and send the staff magic link with a generated temporary password. ${getAccountRoleLabel(session)} accounts can only create staff inside their current hierarchy.`;
  const accountDirectoryColumns = [
    {
      header: 'Role',
      key: 'role',
      render: (user) => (
        <span className={`role-pill role-pill-${user.role}`}>
          {getAccountRoleLabel(user)}
        </span>
      ),
    },
    {
      header: 'Account',
      key: 'name',
      render: (user) => (
        <div className="account-profile">
          <span className={`account-avatar is-${user.role}`}>{getUserInitials(user.name)}</span>
          <div className="account-list-cell-stack">
            <strong>{user.name}</strong>
            <small className="account-secondary">
              {user.username ? `@${user.username}` : user.title || 'No username yet'}
            </small>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      key: 'email',
      render: (user) => (
        <div className="account-list-cell-stack">
          <span className="account-email">{user.email}</span>
          <small className="account-secondary">{user.title || getAccountRoleLabel(user)}</small>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (user) => (
        <div className="account-list-cell-stack">
          <StatusPill status={user.status} />
          <small className="account-secondary">{formatAccessWindow(user)}</small>
        </div>
      ),
    },
    {
      header: 'Last Logged In',
      key: 'lastActive',
      render: (user) => (
        <div className="account-list-cell-stack">
          <span className="account-last-login">{user.lastActive || 'Never'}</span>
          <small className="account-secondary">
            {user.dateAssigned ? `Assigned ${formatAccessDate(user.dateAssigned)}` : 'No assignment date'}
          </small>
        </div>
      ),
    },
    {
      header: 'Notes',
      key: 'notes',
      render: (user) => (
        <AppButton
          className="account-note-trigger"
          onClick={() => setNotesUserId(user.id)}
          variant="plain"
        >
          View Notes
        </AppButton>
      ),
    },
    {
      header: 'Access',
      key: 'access',
      render: (user) => {
        const isActive = user.status === 'Active';

        return (
          <AppSwitch
            aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
            checked={isActive}
            className="status-switch"
            label={isActive ? 'Enabled' : 'Disabled'}
            onChange={() => handleStatusToggle(user)}
          />
        );
      },
    },
  ];

  return (
    <>
      <div className="dashboard-grid">
        <div className="section-card admin-account-shell">
          <div className="admin-workspace-banner">
            <div className="admin-workspace-copy">
              <p className="eyebrow">Account governance</p>
              <h2>{isCaptainWorkspace ? 'System access workspace' : 'Hierarchy account workspace'}</h2>
              <p className="body-text">
                Review user access, schedule invite windows, and keep account management in one cleaner workspace.
              </p>

              <div className="admin-workspace-highlights">
                {workspaceHighlights.map((item) => (
                  <article className="admin-workspace-highlight-card" key={item.label}>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                    <span>{item.note}</span>
                  </article>
                ))}
              </div>
            </div>

            <aside className="admin-workspace-focus">
              <small>{workspaceFocusLabel}</small>
              <strong>{workspaceFocusValue}</strong>
              <span>{workspaceFocusNote}</span>
            </aside>
          </div>

          <div className="admin-account-panel">
            <div className="admin-account-overview">
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
              <div className="admin-account-panel-head">
                <div className="admin-account-toolbar">
                  <p className="eyebrow">User directory</p>
                  <h3>Manage current access</h3>
                  <p className="body-text">
                    Filter accounts, review access notes, and open a modal when you need to add another user.
                  </p>
                </div>
                <AppButton onClick={() => setInviteModalOpen(true)} variant="primary">
                  Add User
                </AppButton>
              </div>

              <div className="admin-account-toolbar-grid">
                <FormField
                  label="Search accounts"
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by role, full name, email, municipality, or status"
                />
                <SelectField
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                />
                <SelectField
                  label="Sort by"
                  value={sortKey}
                  onChange={setSortKey}
                  options={SORT_OPTIONS}
                />
              </div>

              <div className="admin-role-filters" aria-label="Filter accounts by role">
                {roleFilters.map((filter) => (
                  <AppButton
                    key={filter.value}
                    className={`admin-role-filter ${roleFilter === filter.value ? 'is-active' : ''}`}
                    onClick={() => setRoleFilter(filter.value)}
                    variant="plain"
                  >
                    {filter.label}
                  </AppButton>
                ))}
              </div>
            </div>

            {filteredUsers.length ? (
              <div className="account-list-table-shell">
                <div className="admin-account-meta">
                  <p>
                    Showing <strong>{filteredUsers.length}</strong> account{filteredUsers.length === 1 ? '' : 's'}
                    {' '}under <strong>{activeRoleLabel}</strong> with <strong>{activeStatusLabel}</strong>.
                  </p>
                </div>

                <AppTable
                  className="account-directory-shell"
                  columns={accountDirectoryColumns}
                  getRowKey={(user) => user.id}
                  rows={filteredUsers}
                  tableClassName="account-directory-table"
                />
              </div>
            ) : (
              <EmptyState title="No accounts found" text="Try a different name, email, role, or status keyword." />
            )}
          </div>
        </div>
      </div>

      {isInviteModalOpen ? (
        <div className="admin-account-modal-backdrop" onClick={() => setInviteModalOpen(false)} role="presentation">
          <div
            aria-modal="true"
            className="admin-account-modal is-wide"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="admin-account-modal-header">
              <div className="admin-account-modal-copy">
                <small>Municipality access</small>
                <strong>Add user</strong>
                <p>{inviteDescription}</p>
              </div>
              <button className="account-note-close" onClick={() => setInviteModalOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="admin-account-modal-body is-compose">
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
                      onChange={(value) => setInviteForm({ ...inviteForm, role: value, staffRole: value === 'personnel' ? staffRoleOptions[0]?.value || '' : '' })}
                      options={roleOptions}
                    />
                    {showStaffRoleField ? (
                      <SelectField
                        label="Personnel role"
                        value={inviteForm.staffRole}
                        onChange={(value) => setInviteForm({ ...inviteForm, staffRole: value })}
                        options={staffRoleOptions}
                      />
                    ) : null}
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
                      The Gmail address entered here will receive the staff magic link together with
                      a generated temporary password.
                    </p>
                  </div>

                  <div className="card-actions wrap-actions">
                    <AppButton onClick={handleInviteSubmit} variant="primary">
                      Send Access Invite
                    </AppButton>
                    <AppButton onClick={resetInviteForm} variant="ghost">
                      Reset Form
                    </AppButton>
                  </div>
                </div>

                <div className="admin-sidecar-stack">
                  <aside className="admin-sidecar-card">
                    <p className="eyebrow">Access window</p>
                    <h3>Invite preview</h3>
                    <div className="detail-grid">
                      <DetailItem label="Role" value={inviteForm.role === 'personnel' ? getStaffRoleLabel(inviteForm.staffRole || staffRoleOptions[0]?.value || 'municipal_mayor') : ROLE_LABELS[inviteForm.role]} />
                      <DetailItem label="Municipality" value={inviteForm.municipality} />
                      <DetailItem label="Scope" value={inviteForm.role === 'personnel' ? 'Municipality-wide staff scope' : 'Standard access'} />
                      <DetailItem label="Starts" value={inviteForm.accessStartDate} />
                      <DetailItem label="Ends" value={inviteForm.accessEndDate} />
                    </div>
                    <p className="body-text">
                      New invites appear in the user directory immediately. Future start dates stay
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
                                {getAccountRoleLabel(user)}
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
          </div>
        </div>
      ) : null}

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
                    {getAccountRoleLabel(selectedNotesUser)}
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
