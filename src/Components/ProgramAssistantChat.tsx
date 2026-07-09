import { FormEvent, useState } from "react";

const AI_BUSY_MESSAGE =
  "The AI assistant is currently busy. Please try again in a few moments.";
const AI_UNAVAILABLE_MESSAGE =
  "The AI assistant is temporarily unavailable. Please try again shortly.";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type ProgramAssistantChatProps = {
  searchQuery?: string;
  visiblePrograms: any[];
  applicantContext?: any;
  className?: string;
};

export default function ProgramAssistantChat({
  searchQuery = "",
  visiblePrograms,
  applicantContext,
  className = "",
}: ProgramAssistantChatProps) {
  void searchQuery;
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userMessage = input.trim();

    if (!userMessage || loading) {
      return;
    }

    setError("");
    setLoading(true);
    setMessages((previous) => [...previous, { role: "user", text: userMessage }]);
    setInput("");

    try {
      const res = await fetch("/api/ai/program-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          applicant: applicantContext,
          programs: visiblePrograms,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("AI assistant failed:", data);
        throw new Error(res.status === 503 ? AI_BUSY_MESSAGE : AI_UNAVAILABLE_MESSAGE);
      }

      if (!data?.answer) {
        throw new Error("AI returned no answer.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.answer },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : AI_UNAVAILABLE_MESSAGE;
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: message },
      ]);
      setError("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={className}>
      <div>
        {messages.length === 0 ? (
          <p>Ask about eligibility, missing details, or program requirements.</p>
        ) : (
          messages.map((message, index) => (
            <p key={`${message.role}-${index}`}>
              <strong>{message.role === "user" ? "You" : "ProgramFinder AI"}:</strong>{" "}
              {message.text}
            </p>
          ))
        )}
      </div>

      <form onSubmit={sendMessage}>
        <input
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your question..."
          value={input}
        />
        <button disabled={loading || !input.trim()} type="submit">
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
