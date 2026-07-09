import { useEffect, useMemo, useState } from 'react';

const AI_BUSY_MESSAGE =
  'The AI assistant is currently busy. Please try again in a few moments.';
const AI_UNAVAILABLE_MESSAGE =
  'The AI assistant is temporarily unavailable. Please try again shortly.';

function toProgramSummary(program) {
  return {
    id: program?.id || '',
    title: program?.title || '',
    description: program?.description || program?.summary || '',
    benefits: program?.benefits || '',
    office: program?.offices?.office_name || program?.office || '',
    category: program?.program_categories?.category_name || program?.category || '',
    eligibility_rules: program?.program_eligibility_rules || program?.eligibilityRules || {},
    requirements: program?.program_requirements || program?.requirementRecords || program?.requirements || [],
  };
}

function buildAnalyzeMessage(searchQuery, visiblePrograms, programSummary) {
  const cleanedQuery = String(searchQuery || '').trim();
  const resultCount = visiblePrograms.length;
  const titles = visiblePrograms
    .map((program) => String(program?.title || '').trim())
    .filter(Boolean);
  const titleText = titles.length ? titles.join(' and ') : '';
  const intro = cleanedQuery
    ? `The applicant searched for "${cleanedQuery}". The page currently shows ${resultCount} matching program(s).`
    : `The page currently shows ${resultCount} available program(s).`;
  const summaryLine = titles.length
    ? `I found ${resultCount} program(s): ${titleText}. I can help explain eligibility, missing details, and requirements.`
    : `I found ${resultCount} program(s). I can help explain eligibility, missing details, and requirements.`;

  return `${intro}
${summaryLine}
Visible programs:
${JSON.stringify(programSummary, null, 2)}

Recommend programs from this visible list only and explain eligibility, missing details, and requirements.`;
}

function LauncherIcon() {
  return (
    <span
      style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3h8A2.5 2.5 0 0 1 17 5.5v5A2.5 2.5 0 0 1 14.5 13H11l-3.5 3v-3H6.5A2.5 2.5 0 0 1 4 10.5v-5Z"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 13h2.5A2.5 2.5 0 0 0 17 10.5V8.8A2.2 2.2 0 0 1 19.2 11v1.5A2.5 2.5 0 0 1 16.7 15H15v2.2L12 15.3"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#d7b24b',
          border: '2px solid var(--pf-accent)',
        }}
      />
    </span>
  );
}

export default function ProgramAssistantChat({
  searchQuery = '',
  visiblePrograms = [],
  applicantContext = null,
  triggerRequest = null,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask me about your current program search, eligibility, and missing details.',
    },
  ]);

  const programSummary = useMemo(
    () => visiblePrograms.map((program) => toProgramSummary(program)),
    [visiblePrograms]
  );

  async function requestAssistant(message, nextHistory) {
    const res = await fetch('/api/ai/program-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        applicant: applicantContext,
        programs: programSummary,
        history: nextHistory.slice(-8),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('AI assistant failed:', data);
      throw new Error(res.status === 503 ? AI_BUSY_MESSAGE : AI_UNAVAILABLE_MESSAGE);
    }

    if (!data?.answer) {
      throw new Error('AI returned no answer.');
    }

    return data;
  }

  async function sendToAssistant(customMessage = '') {
    const message = String(customMessage || question || '').trim();
    if (!message || loading) {
      return;
    }

    const nextHistory = [...messages, { role: 'user', text: message }];
    setMessages(nextHistory);
    setQuestion('');
    setError('');
    setLoading(true);
    setIsOpen(true);

    try {
      const payload = await requestAssistant(message, nextHistory);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: payload.answer,
        },
      ]);
    } catch (requestError) {
      const fallbackMessage =
        requestError instanceof Error ? requestError.message : AI_UNAVAILABLE_MESSAGE;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: fallbackMessage,
        },
      ]);
      setError('');
    } finally {
      setLoading(false);
    }
  }

  function analyzeVisiblePrograms() {
    const message = buildAnalyzeMessage(searchQuery, visiblePrograms, programSummary);
    sendToAssistant(message);
  }

  useEffect(() => {
    if (!triggerRequest?.id) {
      return;
    }

    if (triggerRequest?.mode === 'analyze') {
      analyzeVisiblePrograms();
      return;
    }

    if (triggerRequest?.prompt) {
      sendToAssistant(triggerRequest.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRequest?.id]);

  function submit(event) {
    event.preventDefault();
    sendToAssistant();
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? 'Hide AI chat' : 'Open AI chat'}
        title={isOpen ? 'Hide AI chat' : 'Open AI chat'}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 1200,
          border: 'none',
          borderRadius: '50%',
          background: 'var(--pf-accent)',
          color: 'var(--pf-on-primary)',
          width: 68,
          height: 68,
          display: 'grid',
          placeItems: 'center',
          padding: 0,
          lineHeight: 0,
          boxShadow: '0 16px 30px color-mix(in srgb, var(--pf-accent) 26%, transparent)',
        }}
      >
        <LauncherIcon />
      </button>

      {isOpen ? (
        <section
          style={{
            position: 'fixed',
            right: 20,
            bottom: 74,
            width: 'min(420px, calc(100vw - 24px))',
            height: 'min(72vh, 680px)',
            zIndex: 1200,
            border: '1px solid var(--pf-border)',
            borderRadius: 18,
            background: 'var(--pf-card)',
            boxShadow: '0 26px 44px rgba(8, 25, 19, .26)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--pf-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <strong style={{ color: 'var(--pf-ink)', fontSize: 15 }}>
              ProgramFinder AI Chat
            </strong>
            <button
              type="button"
              onClick={analyzeVisiblePrograms}
              disabled={loading}
              style={{
                border: '1px solid var(--pf-border)',
                background: 'var(--pf-accent-soft)',
                color: 'var(--pf-on-tertiary)',
                borderRadius: 999,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze Search'}
            </button>
          </div>

          <div
            style={{
              overflowY: 'auto',
              padding: 12,
              display: 'grid',
              gap: 10,
              alignContent: 'start',
              background: 'color-mix(in srgb, var(--pf-accent) 2%, var(--pf-card))',
            }}
          >
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                style={{
                  justifySelf: item.role === 'user' ? 'end' : 'start',
                  maxWidth: '88%',
                  padding: '9px 11px',
                  borderRadius: 12,
                  border: '1px solid var(--pf-border)',
                  background: item.role === 'user' ? 'var(--pf-accent-soft)' : 'var(--pf-surface)',
                  color: 'var(--pf-ink)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.45,
                  fontSize: 13,
                }}
              >
                {item.text}
              </div>
            ))}

            {error ? (
              <div
                role="alert"
                style={{
                  borderRadius: 12,
                  border: '1px solid color-mix(in srgb, #cc4b4b 32%, transparent)',
                  background: 'color-mix(in srgb, #cc4b4b 8%, transparent)',
                  color: '#9b2f2f',
                  padding: '8px 10px',
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={submit}
            style={{
              borderTop: '1px solid var(--pf-border)',
              padding: 10,
              display: 'grid',
              gap: 8,
            }}
          >
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your eligibility, missing details, or requirements."
              rows={3}
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: 10,
                border: '1px solid var(--pf-border)',
                padding: 9,
                fontFamily: 'inherit',
                fontSize: 13,
                background: 'var(--pf-surface)',
                color: 'var(--pf-ink)',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--pf-ink-muted)' }}>
                Guidance only. Final approval is handled by authorized staff.
              </span>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                style={{
                  border: 'none',
                  background: 'var(--pf-accent)',
                  color: 'var(--pf-on-primary)',
                  borderRadius: 999,
                  padding: '7px 12px',
                  fontWeight: 700,
                  minWidth: 72,
                }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
