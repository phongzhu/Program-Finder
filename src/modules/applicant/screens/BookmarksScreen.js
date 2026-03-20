import { EmptyState, SectionHeading } from '../../../shared/components/ui';

export default function BookmarksScreen({ data, actions }) {
  const bookmarkedPrograms = data.programs.filter((program) => data.bookmarks.includes(program.id));

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Saved programs" title="Bookmarks" text="Keep shortlisted programs visible and reopen them in the Search Programs workspace whenever you are ready." />
      {bookmarkedPrograms.length ? (
        <div className="stack-list">
          {bookmarkedPrograms.map((program) => (
            <article className="bookmark-card" key={program.id} style={{ border: '1px solid rgba(18,32,25,.08)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ width: '100%', height: 120, overflow: 'hidden' }}>
                <img src={program.image || program.imageReference || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=60'} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 8 }}><span className="soft-badge">{program.category}</span></div>
                  <h3 style={{ margin: '0 0 6px' }}>{program.title}</h3>
                  <p style={{ margin: 0, color: '#4a6356' }}>{program.summary}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <button className="primary-button" onClick={() => actions.startApplication(program.id)}>
                    Apply
                  </button>
                  <button className="secondary-button" onClick={() => actions.selectProgram(program.id)}>
                    View Program
                  </button>
                  <button className="ghost-button" onClick={() => actions.toggleBookmark(program.id)}>
                    Remove
                  </button>
                </div>
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
