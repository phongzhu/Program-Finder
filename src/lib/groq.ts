import OpenAI from "openai";

export const GROQ_MODEL =
  process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_KEY_ENV_NAMES = ["GROQ_API_KEY"];

function resolveGroqApiKey() {
  for (const envName of GROQ_KEY_ENV_NAMES) {
    const rawValue = process.env[envName];

    if (!rawValue) continue;

    const normalized = String(rawValue).trim().replace(/^["']|["']$/g, "");

    if (!normalized) continue;

    return normalized;
  }

  return "";
}

export function getGroqClient() {
  const apiKey = resolveGroqApiKey();

  if (!apiKey) {
    throw new Error(
      `Missing Groq API key. Set one of ${GROQ_KEY_ENV_NAMES.join(
        ", "
      )} in .env.local, then restart the dev server.`
    );
  }

  if (!/^gsk_[0-9A-Za-z]{20,}/.test(apiKey)) {
    throw new Error(
      "Groq API key format looks invalid. Paste the key exactly from your Groq dashboard without quotes or extra spaces."
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
  });
}
