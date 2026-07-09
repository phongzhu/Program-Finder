import { SectionHeading, StatusPill } from 'Components/UI';
import { getOfficePrograms } from 'Services/Personnel/personnel-utils';

export default function EligibilityCriteriaScreen({ session, data }) {
  const programs = getOfficePrograms(data, session);

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Rules per program" title="Eligibility criteria" text="Government personnel can review the requirement and eligibility setup of every office program from this module." />
      <div className="stack-list">
        {programs.map((program) => (
          <article className="program-list-card static-card" key={program.id}>
            <div className="program-list-top">
              <strong>{program.title}</strong>
              <StatusPill status={program.status} />
            </div>
            <strong className="subsection-title">Requirements</strong>
            <div className="tag-cloud">
              {program.requirements.map((item) => (
                <span className="tag-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <strong className="subsection-title">Eligibility rules</strong>
            <div className="stack-list compact">
              {program.eligibility.map((item) => (
                <div className="list-row" key={item}>
                  <span className="bullet-mark" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
