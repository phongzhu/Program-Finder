import { useMemo, useState } from 'react';
import { FormField, SectionHeading, StatusPill } from '../../../shared/components/ui';
import { getApplicantApplications } from './helpers';

export default function SearchProgramsScreen({ session, data, actions }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [municipalityScope, setMunicipalityScope] = useState('my-area');

  const applicantApplications = useMemo(
    () => getApplicantApplications(data, session),
    [data, session]
  );
  const existingApplicationProgramIds = new Set(applicantApplications.map((application) => application.programId));

  const allCategories = ['All', ...new Set(data.programs.map((program) => program.category))];
  const allStatuses = ['All', ...new Set(data.programs.map((program) => program.status))];

  const filteredPrograms = data.programs.filter((program) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      program.title.toLowerCase().includes(normalizedSearch) ||
      program.office.toLowerCase().includes(normalizedSearch) ||
      program.summary.toLowerCase().includes(normalizedSearch);
    const matchesCategory = category === 'All' || program.category === category;
    const matchesStatus = status === 'All' || program.status === status;

    const inApplicantMunicipality =
      program.municipality === 'Province-wide' ||
      program.municipality === data.applicantProfile.municipality ||
      program.municipality === session.municipality;
    const hasExistingApplication = existingApplicationProgramIds.has(program.id);

    const matchesScope =
      municipalityScope === 'all'
        ? true
        : municipalityScope === 'existing'
          ? hasExistingApplication
          : inApplicantMunicipality;

    return matchesSearch && matchesCategory && matchesStatus && matchesScope;
  });

  const recommendedPrograms = [...data.programs]
    .filter((program) => !existingApplicationProgramIds.has(program.id))
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, 3);

  return (
    <div className="content-grid">
      <div className="section-card section-card-wide">
        <SectionHeading
          eyebrow="Program directory"
          title="Search programs"
          text="Search open listings, filter by your area, and open each card to view full program details before applying."
        />

        <div className="program-showcase">
          {recommendedPrograms.map((program) => (
            <article className="program-showcase-card" key={program.id}>
              <div className="program-showcase-top">
                <span className="soft-badge">Recommended</span>
                <StatusPill status={`${program.fitScore}% fit`} />
              </div>
              <h3>{program.title}</h3>
              <p>{program.summary}</p>
              <small>
                {program.office} | {program.municipality}
              </small>
              <div className="card-actions">
                <button className="secondary-button" onClick={() => actions.openProgramDetails(program.id)}>
                  View Program
                </button>
                <button className="primary-button" onClick={() => actions.startApplication(program.id)}>
                  Apply
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="filters">
          <FormField label="Search program" value={search} onChange={setSearch} placeholder="Search by title, office, or keyword" />
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {allCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {allStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Location scope</span>
            <select value={municipalityScope} onChange={(event) => setMunicipalityScope(event.target.value)}>
              <option value="my-area">My municipality and province-wide</option>
              <option value="existing">Programs with my existing applications</option>
              <option value="all">All municipalities</option>
            </select>
          </label>
        </div>

        {filteredPrograms.length ? (
          <div className="program-results-grid">
            {filteredPrograms.map((program) => {
              const hasExisting = existingApplicationProgramIds.has(program.id);
              return (
                <article className="program-list-card" key={program.id}>
                  <div className="program-list-top">
                    <span className="soft-badge">{program.category}</span>
                    <StatusPill status={program.status} />
                  </div>
                  <h3>{program.title}</h3>
                  <p>{program.summary}</p>
                  <small>
                    {program.office} | {program.municipality}
                  </small>
                  {hasExisting ? <StatusPill status="Existing Application" /> : null}
                  <div className="card-actions">
                    <button className="secondary-button" onClick={() => actions.openProgramDetails(program.id)}>
                      View Program
                    </button>
                    <button className="primary-button" onClick={() => actions.startApplication(program.id)}>
                      Apply
                    </button>
                    <button className="ghost-button" onClick={() => actions.toggleBookmark(program.id)}>
                      {data.bookmarks.includes(program.id) ? 'Remove bookmark' : 'Bookmark'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No programs matched your search and filters.</strong>
            <p>Try changing your location scope, status, or category filter to see more programs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
