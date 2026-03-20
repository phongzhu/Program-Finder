import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../../data/prototypeSeed';
import { APPLICANT_MODULES } from '../../applicant/config';
import { PERSONNEL_MODULES } from '../../personnel/config';
import { SectionHeading } from '../../../shared/components/ui';
import { ADMIN_MODULES } from '../config';

const modulesByRole = {
  admin: ADMIN_MODULES,
  personnel: PERSONNEL_MODULES,
  applicant: APPLICANT_MODULES,
};

export default function RolesPermissionsScreen() {
  return (
    <div className="content-grid">
      {Object.entries(ROLE_LABELS).map(([role, label]) => (
        <article className="section-card" key={role}>
          <SectionHeading eyebrow={label} title="Roles and permissions" text={ROLE_DESCRIPTIONS[role]} />
          <div className="tag-cloud">
            {(modulesByRole[role] || []).filter((item) => !item.hiddenInNav).map((item) => (
              <span className="tag-chip" key={item.key}>
                {item.label}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
