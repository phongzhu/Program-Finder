import { EmptyState, SectionHeading } from '../../../shared/components/ui';

export default function BookmarksScreen({ data, actions }) {
  const bookmarkedPrograms = data.programs.filter((program) => data.bookmarks.includes(program.id));

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Saved programs" title="Bookmarks" text="Keep shortlisted programs visible and reopen them in the Search Programs workspace whenever you are ready." />
      {bookmarkedPrograms.length ? (
        <div className="stack-list">
          {bookmarkedPrograms.map((program) => (
            <article className="bookmark-card" key={program.id}>
              <div>
                <span className="soft-badge">{program.category}</span>
                <h3>{program.title}</h3>
                <p>{program.summary}</p>
              </div>
              <div className="card-actions">
                <button className="primary-button" onClick={() => actions.startApplication(program.id)}>
                  Apply
                </button>
                <button className="secondary-button" onClick={() => actions.openProgramDetails(program.id)}>
                  View Program
                </button>
                <button className="ghost-button" onClick={() => actions.toggleBookmark(program.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No bookmarked programs" text="Save programs from Search Programs to keep them visible here." />
      )}
    </div>
  );
}
