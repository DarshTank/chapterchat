/**
 * Groq model IDs, overridable via env vars.
 *
 * Groq periodically decommissions models — llama-3.3-70b-versatile was
 * retired 2026-08-16, per Groq's own deprecation notice — and requests to a
 * decommissioned model fail immediately with a 404 model_not_found.
 * Hardcoding the model string in each route meant a code change + redeploy
 * to react. These read from env first so swapping a model is a dashboard
 * env var change (still needs a redeploy/restart to pick up the new value,
 * but no code change or review cycle).
 *
 * Defaults below were confirmed live against GET /openai/v1/models on
 * 2026-08-18: llama-3.3-70b-versatile is gone; openai/gpt-oss-120b (Groq's
 * recommended replacement) is available. TTS/STT models were unaffected by
 * this deprecation.
 */
export const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b';
export const GROQ_TTS_MODEL = process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english';
export const GROQ_STT_MODEL = process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo';
