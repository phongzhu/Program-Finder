import { ROLE_DESCRIPTIONS, ROLE_LABELS } from 'Data/appConstants';
import { APPLICANT_MODULES } from 'Data/Modules/applicant-user-modules-config';
import { CAPTAIN_MODULES } from 'Services/Navigation/moduleRegistry';
import { PERSONNEL_MODULES } from 'Data/Modules/personnel-user-modules-config';
import { STAFF_ROLE_DESCRIPTIONS, STAFF_ROLE_LABELS } from 'Utils/staffHierarchy';
import { SectionHeading } from 'Components/UI';

const workspaceCards = [
  {
    key: 'system_admin',
    eyebrow: 'System Admin Workspace',
    title: 'Roles and permissions',
    text: 'Top-level workspace for system governance across users, municipalities, offices, reports, settings, and staff hierarchy.',
    modules: CAPTAIN_MODULES,
  },
  {
    key: 'personnel',
    eyebrow: ROLE_LABELS.personnel,
    title: 'Roles and permissions',
    text: ROLE_DESCRIPTIONS.personnel,
    modules: PERSONNEL_MODULES,
  },
  {
    key: 'applicant',
    eyebrow: ROLE_LABELS.applicant,
    title: 'Roles and permissions',
    text: ROLE_DESCRIPTIONS.applicant,
    modules: APPLICANT_MODULES,
  },
];

const staffPermissionMatrix = {
  system_admin: ['Create municipal mayor accounts', 'Manage offices and municipalities', 'Review reports', 'Manage system settings'],
  municipal_mayor: ['Create barangay captain accounts', 'Create programs', 'Post programs', 'View applicants', 'Set release status'],
  barangay_captain: ['Create barangay secretary accounts', 'Manage barangay offices', 'Create programs', 'Post programs', 'View applicants', 'Set release status'],
  barangay_secretary: ['Manage barangay offices', 'Create programs', 'Post programs', 'View applicants'],
};

export default function RolesPermissionsScreen() {
  return (
    <div className="content-grid">
      {workspaceCards.map((card) => (
        <article className="section-card" key={card.key}>
          <SectionHeading eyebrow={card.eyebrow} title={card.title} text={card.text} />
          <div className="tag-cloud">
            {card.modules.filter((item) => !item.hiddenInNav).map((item) => (
              <span className="tag-chip" key={item.key}>
                {item.label}
              </span>
            ))}
          </div>
        </article>
      ))}

      <article className="section-card">
        <SectionHeading
          eyebrow="Personnel hierarchy"
          title="System to barangay chain"
          text="System admins create municipal mayors. Municipal mayors create barangay captains. Barangay captains create barangay secretaries."
        />

        <div className="content-grid">
          {Object.entries(STAFF_ROLE_LABELS)
            .filter(([role]) => ['system_admin', 'system_secretary', 'municipal_mayor', 'municipal_secretary', 'barangay_captain', 'barangay_secretary'].includes(role))
            .map(([role, label]) => (
              <article className="section-card" key={role}>
                <SectionHeading eyebrow={label} title="Staff permissions" text={STAFF_ROLE_DESCRIPTIONS[role]} />
                <div className="tag-cloud">
                  {(staffPermissionMatrix[role] || []).map((item) => (
                    <span className="tag-chip" key={`${role}-${item}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </article>
    </div>
  );
}
