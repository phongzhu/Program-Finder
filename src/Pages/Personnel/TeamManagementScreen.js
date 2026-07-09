import { useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  EmptyState,
  FormField,
  ModalShell,
  SelectField,
  StatusPill,
} from 'Components/UI';
import {
  canManageStaffAccounts,
  getAccountRoleLabel,
  getAssignableStaffRoles,
  getManagedStaffUsers,
  getStaffRoleKey,
  getStaffRoleLabel,
} from 'Utils/staffHierarchy';
import { STAFF_LOGIN_ROUTE } from 'Services/Routing/router';
import { isSupabaseConfigured } from 'Services/Supabase/client';
import { listStaffProfiles } from 'Services/Supabase/staff-auth';
import { listOfficeManagementRecords } from 'Services/Supabase/offices';

const STAFF_TERM_YEARS = 3;
const PROVINCE_SCOPE = 'Province of Bulacan';
const SUFFIX_OPTIONS = [
  { label: 'No suffix', value: '' },
  { label: 'Jr.', value: 'Jr.' },
  { label: 'Sr.', value: 'Sr.' },
  { label: 'I', value: 'I' },
  { label: 'II', value: 'II' },
  { label: 'III', value: 'III' },
  { label: 'IV', value: 'IV' },
  { label: 'V', value: 'V' },
];

const BARANGAY_SCOPED_ROLES = ['barangay_captain', 'barangay_secretary'];
const STAFF_STATUS_FILTERS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTermEndDate(startDateValue) {
  const startDate = startDateValue ? new Date(`${startDateValue}T12:00:00`) : new Date();

  if (Number.isNaN(startDate.getTime())) {
    return getDateInputValue((STAFF_TERM_YEARS * 365) - 1);
  }

  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + STAFF_TERM_YEARS);
  endDate.setDate(endDate.getDate() - 1);
  return formatDateInputValue(endDate);
}

function isProvinceScope(value) {
  return String(value || '').trim().toLowerCase() === PROVINCE_SCOPE.toLowerCase();
}

function normalizeComparable(value) {
  return String(value || '').trim().toLowerCase();
}

function createInviteForm(session, roles, municipality = '') {
  const accessStartDate = getDateInputValue();
  const defaultMunicipality = municipality || session?.municipality || PROVINCE_SCOPE;

  return {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    mobileNumber: '',
    alternateContactNumber: '',
    staffRole: roles[0] || '',
    municipality: defaultMunicipality,
    barangay: '',
    accessStartDate,
    accessEndDate: getTermEndDate(accessStartDate),
  };
}

export default function TeamManagementScreen({ session, data, actions }) {
  const actorStaffRole = getStaffRoleKey(session);
  const canManageTeam = canManageStaffAccounts(session);
  const assignableStaffRoles = getAssignableStaffRoles(session);
  const [inviteForm, setInviteForm] = useState(() => createInviteForm(session, assignableStaffRoles));
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [profileRows, setProfileRows] = useState([]);
  const [managementRecords, setManagementRecords] = useState({ municipalities: [], barangays: [], offices: [] });
  const [profileLoadError, setProfileLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!assignableStaffRoles.length) {
      return;
    }

    if (!assignableStaffRoles.includes(inviteForm.staffRole)) {
      setInviteForm((current) => ({ ...current, staffRole: assignableStaffRoles[0] }));
    }
  }, [assignableStaffRoles, inviteForm.staffRole]);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setProfileRows([]);
      setProfileLoadError('');
      return undefined;
    }

    Promise.all([listStaffProfiles(), listOfficeManagementRecords()])
      .then(([rows, records]) => {
        if (isMounted) {
          setProfileRows(rows);
          setManagementRecords(records);
          setProfileLoadError('');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setProfileRows([]);
          setManagementRecords({ municipalities: [], barangays: [], offices: [] });
          setProfileLoadError(error.message || 'Unable to load staff profiles.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [data.users]);

  const teamUsers = useMemo(
    () =>
      getManagedStaffUsers(isSupabaseConfigured ? profileRows : data.users, session).filter((user) => {
        const roleKey = getStaffRoleKey(user);
        return user.id !== session.id && roleKey !== 'system_admin';
      }),
    [data.users, profileRows, session]
  );

  const actorProfile = useMemo(
    () => profileRows.find((user) => user.id === session.id || normalizeComparable(user.email) === normalizeComparable(session.email)) || null,
    [profileRows, session.email, session.id]
  );
  const actorOfficeRecord = useMemo(() => {
    const sessionOffice = normalizeComparable(session.office || actorProfile?.office);

    if (!sessionOffice) {
      return null;
    }

    return managementRecords.offices.find((office) => {
      const officeName = normalizeComparable(office.officeName || office.name);
      return officeName === sessionOffice || officeName.includes(sessionOffice) || sessionOffice.includes(officeName);
    }) || null;
  }, [actorProfile?.office, managementRecords.offices, session.office]);
  const actorProfileMunicipality =
    actorProfile?.municipality && !isProvinceScope(actorProfile.municipality) ? actorProfile.municipality : '';
  const actorOfficeMunicipality =
    actorOfficeRecord?.municipalityName || actorOfficeRecord?.municipality || '';
  const actorMunicipality = (
    session.municipality && !isProvinceScope(session.municipality)
      ? session.municipality
      : actorProfileMunicipality || actorOfficeMunicipality
  ) || PROVINCE_SCOPE;

  const municipalityOptions = useMemo(() => {
    const canPickMunicipality = ['system_admin', 'system_secretary'].includes(actorStaffRole) && inviteForm.staffRole === 'municipal_mayor';
    const scopedMunicipalities =
      canPickMunicipality
        ? [...new Set([
            ...(managementRecords.municipalities || []).map((municipality) => municipality.municipalityName || municipality.name),
            ...(data.municipalities || []).map((municipality) => municipality.name),
          ].filter(Boolean))]
        : [actorMunicipality].filter(Boolean);

    return scopedMunicipalities.map((municipality) => ({ label: municipality, value: municipality }));
  }, [actorMunicipality, actorStaffRole, data.municipalities, inviteForm.staffRole, managementRecords.municipalities]);

  const barangayOptions = useMemo(() => {
    const barangaySource = managementRecords.barangays.length ? managementRecords.barangays : (data.barangays || []);

    return barangaySource
      .filter((barangay) => normalizeComparable(barangay.municipality) === normalizeComparable(inviteForm.municipality))
      .map((barangay) => ({
        label: barangay.name || barangay.barangayName,
        value: barangay.name || barangay.barangayName,
      }))
      .filter((option) => option.value);
  }, [data.barangays, inviteForm.municipality, managementRecords.barangays]);

  const scopeLocked = !(['system_admin', 'system_secretary'].includes(actorStaffRole) && inviteForm.staffRole === 'municipal_mayor');
  const roleCounts = teamUsers.reduce((summary, user) => {
    const roleLabel = getStaffRoleLabel(user.staffRole || user.title);
    summary[roleLabel] = (summary[roleLabel] || 0) + 1;
    return summary;
  }, {});
  const roleFilterOptions = useMemo(() => {
    const roles = [...new Set(teamUsers.map((user) => getStaffRoleLabel(user.staffRole || user.title)).filter(Boolean))];
    return [{ label: 'All roles', value: 'all' }, ...roles.map((role) => ({ label: role, value: role }))];
  }, [teamUsers]);
  const filteredTeamUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teamUsers.filter((user) => {
      const roleLabel = getStaffRoleLabel(user.staffRole || user.title);
      if (roleFilter !== 'all' && roleLabel !== roleFilter) {
        return false;
      }
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [
        user.name,
        user.firstName,
        user.middleName,
        user.lastName,
        user.email,
        roleLabel,
        user.office,
        user.municipality,
        user.mobileNumber,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [roleFilter, search, statusFilter, teamUsers]);

  useEffect(() => {
    if (!scopeLocked) {
      if (!municipalityOptions.some((option) => option.value === inviteForm.municipality)) {
        setInviteForm((current) => ({ ...current, municipality: municipalityOptions[0]?.value || '' }));
      }
      return;
    }

    setInviteForm((current) => ({
      ...current,
      municipality: actorMunicipality,
    }));
  }, [actorMunicipality, inviteForm.municipality, municipalityOptions, scopeLocked]);

  useEffect(() => {
    if (!BARANGAY_SCOPED_ROLES.includes(inviteForm.staffRole)) {
      if (inviteForm.barangay) {
        setInviteForm((current) => ({ ...current, barangay: '' }));
      }
      return;
    }

    const preferredBarangay = session.barangay || barangayOptions[0]?.value || '';

    if (!barangayOptions.some((option) => option.value === inviteForm.barangay)) {
      setInviteForm((current) => ({ ...current, barangay: preferredBarangay }));
    }
  }, [barangayOptions, inviteForm.barangay, inviteForm.staffRole, session.barangay]);

  const updateAccessStartDate = (value) => {
    setInviteForm((current) => ({
      ...current,
      accessStartDate: value,
      accessEndDate: getTermEndDate(value),
    }));
  };

  const resetForm = () => {
    setInviteForm(createInviteForm(session, assignableStaffRoles, actorMunicipality));
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    resetForm();
  };

  const handleCreate = () => {
    const roleLabel = getStaffRoleLabel(inviteForm.staffRole);

    actions.requestConfirmation({
      title: `Create ${roleLabel}?`,
      message: `A temporary password will be generated and sent with the personnel login link (${STAFF_LOGIN_ROUTE}). Review the role, municipality scope, and access dates before creating this ${roleLabel.toLowerCase()} account.`,
      confirmLabel: 'Create Staff Account',
      onConfirm: async () => {
        const result = await actions.createUserAccount({
          ...inviteForm,
          name: [inviteForm.firstName, inviteForm.middleName, inviteForm.lastName, inviteForm.suffix].filter(Boolean).join(' '),
          role: 'personnel',
          staffRole: inviteForm.staffRole,
          municipality: inviteForm.municipality || session.municipality,
          barangay: inviteForm.barangay,
        });

        if (result?.ok) {
          closeAccountModal();
        }
      },
    });
  };

  const handleStatusToggle = (user) => {
    const isActive = user.status === 'Active';

    actions.requestConfirmation({
      title: isActive ? 'Deactivate staff account?' : 'Activate staff account?',
      message: `${isActive ? 'Deactivate' : 'Activate'} ${user.name}'s ${getStaffRoleLabel(user.staffRole || user.title).toLowerCase()} account.`,
      confirmLabel: isActive ? 'Deactivate Account' : 'Activate Account',
      tone: isActive ? 'danger' : 'accent',
      onConfirm: () => actions.toggleUserStatus(user.id),
    });
  };
  const activeMembers = teamUsers.filter((user) => user.status === 'Active').length;
  const inactiveMembers = teamUsers.filter((user) => user.status !== 'Active').length;
  const assignableRolesLabel = assignableStaffRoles.map((role) => getStaffRoleLabel(role)).join(', ');

  if (!canManageTeam || !assignableStaffRoles.length) {
    return (
      <div className="section-card">
        <EmptyState
          title="No staff creation access"
          text={`${getAccountRoleLabel(session)} accounts cannot create subordinate staff. Use the system admin, municipal mayor, or barangay captain account for hierarchy setup.`}
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .tm-shell {
          display: grid;
          gap: 14px;
          padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
          box-sizing: border-box;
          font-family: var(--pf-font-body, system-ui, sans-serif);
          color: #1a3356;
        }
        .tm-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .tm-stat {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .tm-stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .07em;
          color: #7a8fa6;
        }
        .tm-stat-value {
          font-size: 1.75rem;
          line-height: 1;
          font-weight: 700;
          color: #0f2f63;
        }
        .tm-stat-detail {
          font-size: 0.76rem;
          color: #7a8fa6;
          line-height: 1.35;
        }
        .tm-toolbar {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .tm-search {
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
        .tm-filter-row {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 260px));
        }
        .tm-select-wrap {
          display: grid;
          gap: 4px;
        }
        .tm-label {
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .09em;
          color: #7a8fa6;
        }
        .tm-select {
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
        .tm-panel {
          background: #ffffff;
          border: 1px solid #d7dde8;
          box-shadow: 0 1px 4px rgba(15,47,99,.05);
          overflow: hidden;
        }
        .tm-panel-top {
          padding: 16px 20px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .tm-eyebrow {
          display: block;
          font-size: .67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
          margin-bottom: 3px;
        }
        .tm-panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f2f63;
          line-height: 1.2;
        }
        .tm-panel-subtitle {
          margin: 4px 0 0;
          font-size: .84rem;
          color: #4a5e7a;
        }
        .tm-add-btn {
          background: #0f2f63;
          color: #ffffff;
          border: none;
          min-height: 38px;
          padding: 0 18px;
          font: inherit;
          font-size: .86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .tm-panel-body {
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .tm-role-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tm-role-pill {
          border: 1px solid #d7dde8;
          background: #f8fafd;
          color: #2a4e8c;
          font-size: .76rem;
          font-weight: 700;
          padding: 4px 10px;
        }
        .tm-table {
          border: 1px solid #d7dde8;
          overflow: hidden;
        }
        .tm-table-head,
        .tm-table-row {
          display: grid;
          grid-template-columns: minmax(170px, 1.1fr) minmax(160px, 1fr) minmax(150px, .8fr) minmax(160px, .9fr) minmax(140px, .8fr) minmax(160px, .9fr) minmax(100px, .6fr) 120px;
          gap: 10px;
          align-items: center;
        }
        .tm-table-head {
          padding: 10px 16px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
        }
        .tm-table-row {
          padding: 12px 16px;
          border-bottom: 1px solid #e8ecf2;
          background: #ffffff;
        }
        .tm-table-row:last-child {
          border-bottom: 0;
        }
        .tm-cell {
          min-width: 0;
          display: grid;
          gap: 3px;
        }
        .tm-cell strong {
          font-size: .88rem;
          font-weight: 700;
          color: #1a3356;
          line-height: 1.3;
        }
        .tm-cell small {
          margin: 0;
          font-size: .76rem;
          color: #6d8198;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tm-status-cell {
          display: inline-flex;
          align-items: center;
        }
        .tm-action-cell {
          display: flex;
          justify-content: flex-end;
        }
        .tm-action-btn {
          border: 1px solid #c8d8f5;
          background: #ffffff;
          color: #2a4e8c;
          min-height: 32px;
          padding: 0 12px;
          font: inherit;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .tm-action-btn.is-danger {
          border-color: #f1c4bf;
          color: #8f2f28;
          background: #fff7f6;
        }
        .tm-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1240px) {
          .tm-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .tm-table-head {
            display: none;
          }
          .tm-table-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .tm-action-cell {
            justify-content: flex-start;
          }
        }
        @media (max-width: 760px) {
          .tm-filter-row {
            grid-template-columns: 1fr;
          }
          .tm-stats {
            grid-template-columns: 1fr;
          }
          .tm-table-row {
            grid-template-columns: 1fr;
          }
          .tm-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="tm-shell">
        <section className="tm-stats">
          <article className="tm-stat">
            <span className="tm-stat-label">Signed-in role</span>
            <strong className="tm-stat-value">{getAccountRoleLabel(session)}</strong>
            <small className="tm-stat-detail">{actorMunicipality || 'No municipality assigned'}</small>
          </article>
          <article className="tm-stat">
            <span className="tm-stat-label">Assignable roles</span>
            <strong className="tm-stat-value">{assignableStaffRoles.length}</strong>
            <small className="tm-stat-detail">{assignableRolesLabel}</small>
          </article>
          <article className="tm-stat">
            <span className="tm-stat-label">Managed staff</span>
            <strong className="tm-stat-value">{teamUsers.length}</strong>
            <small className="tm-stat-detail">{activeMembers} active · {inactiveMembers} inactive</small>
          </article>
          <article className="tm-stat">
            <span className="tm-stat-label">Municipality scope</span>
            <strong className="tm-stat-value">{actorMunicipality || PROVINCE_SCOPE}</strong>
            <small className="tm-stat-detail">{scopeLocked ? 'Inherited from your account' : 'Filtered from municipality records'}</small>
          </article>
        </section>

        <section className="tm-toolbar">
          <input
            className="tm-search"
            type="text"
            placeholder="Search name, role, email, office, or municipality..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="tm-filter-row">
            <div className="tm-select-wrap">
              <label className="tm-label" htmlFor="tm-role-filter">Role</label>
              <select
                id="tm-role-filter"
                className="tm-select"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                {roleFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="tm-select-wrap">
              <label className="tm-label" htmlFor="tm-status-filter">Status</label>
              <select
                id="tm-status-filter"
                className="tm-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STAFF_STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="tm-panel">
          <div className="tm-panel-top">
            <div>
              <span className="tm-eyebrow">Managed records</span>
              <h2 className="tm-panel-title">Current hierarchy members</h2>
              <p className="tm-panel-subtitle">Create and maintain subordinate personnel accounts under your assigned government scope.</p>
            </div>
            <button type="button" className="tm-add-btn" onClick={() => setIsAccountModalOpen(true)}>
              Add Account
            </button>
          </div>

          <div className="tm-panel-body">
            {Object.keys(roleCounts).length ? (
              <div className="tm-role-pills">
                {Object.entries(roleCounts).map(([roleLabel, count]) => (
                  <span className="tm-role-pill" key={`${roleLabel}-${count}`}>{roleLabel}: {count}</span>
                ))}
              </div>
            ) : null}

            {filteredTeamUsers.length ? (
              <div className="tm-table">
                <div className="tm-table-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Office</span>
                  <span>Municipality</span>
                  <span>Mobile</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <div>
                  {filteredTeamUsers.map((user) => (
                    <article className="tm-table-row" key={user.id}>
                      <div className="tm-cell">
                        <strong>{user.name}</strong>
                        <small>{[user.firstName, user.middleName, user.lastName, user.suffix].filter(Boolean).join(' ') || 'No full name details'}</small>
                      </div>
                      <div className="tm-cell">
                        <strong>{user.email || 'No email'}</strong>
                        <small>Personnel login contact</small>
                      </div>
                      <div className="tm-cell">
                        <strong>{getStaffRoleLabel(user.staffRole || user.title)}</strong>
                        <small>Assigned role</small>
                      </div>
                      <div className="tm-cell">
                        <strong>{user.office || 'No office assigned'}</strong>
                        <small>Office scope</small>
                      </div>
                      <div className="tm-cell">
                        <strong>{user.municipality || 'No municipality'}</strong>
                        <small>Coverage area</small>
                      </div>
                      <div className="tm-cell">
                        <strong>{[user.mobileNumber, user.alternateContactNumber].filter(Boolean).join(' / ') || 'No mobile details'}</strong>
                        <small>Primary / alternate</small>
                      </div>
                      <div className="tm-status-cell">
                        <StatusPill status={user.status} />
                      </div>
                      <div className="tm-action-cell">
                        <button
                          type="button"
                          className={`tm-action-btn ${user.status === 'Active' ? 'is-danger' : ''}`}
                          onClick={() => handleStatusToggle(user)}
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title={profileLoadError ? 'Unable to load staff profiles' : 'No linked staff found'}
                text={profileLoadError || 'No staff matched the current search and filter settings.'}
              />
            )}
          </div>
        </section>
      </div>
 
      {isAccountModalOpen ? (
        <ModalShell
          title="Add a personnel account"
          onClose={closeAccountModal}
          footer={<ActionButton tone="primary" onClick={handleCreate}>Create Account</ActionButton>}
        >
          <div className="tm-modal-grid">
            <FormField label="First name" required value={inviteForm.firstName} onChange={(value) => setInviteForm({ ...inviteForm, firstName: value })} />
            <FormField label="Middle name" value={inviteForm.middleName} onChange={(value) => setInviteForm({ ...inviteForm, middleName: value })} />
            <FormField label="Last name" required value={inviteForm.lastName} onChange={(value) => setInviteForm({ ...inviteForm, lastName: value })} />
            <SelectField label="Suffix" value={inviteForm.suffix} onChange={(value) => setInviteForm({ ...inviteForm, suffix: value })} options={SUFFIX_OPTIONS} />
            <FormField label="Gmail address" required type="email" value={inviteForm.email} onChange={(value) => setInviteForm({ ...inviteForm, email: value })} />
            <FormField label="Mobile number" value={inviteForm.mobileNumber} onChange={(value) => setInviteForm({ ...inviteForm, mobileNumber: value })} />
            <FormField label="Alternate contact number" value={inviteForm.alternateContactNumber} onChange={(value) => setInviteForm({ ...inviteForm, alternateContactNumber: value })} />
            <SelectField
              label="Staff role"
              required
              value={inviteForm.staffRole}
              onChange={(value) => setInviteForm({ ...inviteForm, staffRole: value })}
              options={assignableStaffRoles.map((role) => ({ label: getStaffRoleLabel(role), value: role }))}
            />
            <SelectField
              label={BARANGAY_SCOPED_ROLES.includes(inviteForm.staffRole) ? 'Barangay personnel municipality' : 'Municipality scope'}
              required
              value={inviteForm.municipality}
              onChange={(value) => setInviteForm({ ...inviteForm, municipality: value })}
              options={municipalityOptions}
              disabled={scopeLocked}
            />
            {BARANGAY_SCOPED_ROLES.includes(inviteForm.staffRole) ? (
              <SelectField
                label="Barangay office"
                required
                value={inviteForm.barangay}
                onChange={(value) => setInviteForm({ ...inviteForm, barangay: value })}
                options={barangayOptions}
                disabled={actorStaffRole === 'barangay_captain'}
              />
            ) : null}
            <FormField label="Access start date" required type="date" value={inviteForm.accessStartDate} onChange={updateAccessStartDate} />
            <FormField label="Access end date" required type="date" value={inviteForm.accessEndDate} onChange={(value) => setInviteForm({ ...inviteForm, accessEndDate: value })} />
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
