/**
 * RAG client — talks to the AI Tutor HTTP service.
 *
 * Knowledge retrieval stays in the Python RAG pipeline; this module is only
 * the Node-side transport. It is intentionally small: it never duplicates
 * retrieval/generation logic.
 */

import axios from "axios";

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:9000"
).replace(/\/$/, "");

export class RagUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "RagUnavailableError";
    this.cause = cause;
  }
}

export async function askKnowledge(message, { studentId, context } = {}) {
  let response;
  try {
    response = await axios.post(
      `${AI_SERVICE_URL}/api/tutor/chat`,
      {
        message,
        ...(studentId ? { studentId } : {}),
        context: { topic: context?.topic, top_k: 3 },
      },
      { timeout: 30000, validateStatus: () => true }
    );
  } catch (error) {
    throw new RagUnavailableError(
      `Knowledge service unreachable (${error.message}).`,
      error
    );
  }

  if (response.status >= 500 || response.status === 503) {
    throw new RagUnavailableError(
      `Knowledge service returned HTTP ${response.status}.`,
      null
    );
  }

  const body = response.data || {};
  if (body.success === false) {
    throw new RagUnavailableError(
      body.error?.message || "Knowledge service reported an error.",
      null
    );
  }

  return {
    message: body.message,
    grounded: body.grounded === true,
    sources: Array.isArray(body.sources) ? body.sources : [],
  };
}