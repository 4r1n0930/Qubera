/**
 * AI Tutor API client.
 *
 * Talks to the Node gateway at /api/tutor/*. The gateway runs the agent
 * (MCP capabilities + RAG knowledge) and returns a deterministic reply:
 * a message plus whitelisted UI actions. The frontend only ever executes
 * those actions — it never interprets model prose.
 */

import type { TutorChatRequest, TutorContextSnapshot, TutorReply } from '../tutor/types'

const TUTOR_CONTEXT_URL = '/api/tutor/context'
const TUTOR_CHAT_URL = '/api/tutor/chat'

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Tutor service responded with status ${response.status}`)
  }
  return (await response.json()) as T
}

/**
 * Send one tutoring message and receive the agent's reply.
 * Sends the latest snapshot so the agent sees the student's screen.
 */
export async function chatTutorApi(
  request: Omit<TutorChatRequest, 'context'> & { context?: Partial<TutorContextSnapshot> },
  signal?: AbortSignal,
): Promise<TutorReply> {
  const reply = await postJson<TutorReply>(TUTOR_CHAT_URL, request, signal)
  return {
    grounded: Boolean(reply.grounded),
    sources: reply.sources ?? [],
    actions: Array.isArray(reply.actions) ? reply.actions : [],
    activity: reply.activity ?? null,
    message: reply.message ?? '',
  }
}

/** Push the live student snapshot (throttled by the caller). */
export async function syncTutorContextApi(
  snapshot: TutorContextSnapshot,
  signal?: AbortSignal,
): Promise<void> {
  await postJson<{ success: boolean }>(
    TUTOR_CONTEXT_URL,
    { studentId: 'guest', context: snapshot },
    signal,
  )
}