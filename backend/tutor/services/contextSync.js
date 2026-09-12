/**
 * Live context syncer for the tutor.
 *
 * The frontend pushes small snapshots of the student's current screen +
 * Quantum Lab state. This module caches them server-side and forwards them to
 * the MCP server (which is authoritative for context-reading tools), throttled
 * so rapid lab edits do not flood the child process.
 */

import { pushContext } from "./mcpClient.js";

const ALLOWED_FIELDS = [
  "screen",
  "route",
  "page",
  "topic",
  "code",
  "framework",
  "circuit",
  "selectedGate",
  "lastExecutionResult",
  "lesson",
  "simulation",
  "userProgress",
];

const THROTTLE_MS = 500;
const lastPush = new Map();

function pickFields(context = {}) {
  const clean = {};
  for (const field of ALLOWED_FIELDS) {
    if (context[field] !== undefined && context[field] !== null) {
      clean[field] = context[field];
    }
  }
  return clean;
}

/**
 * Stores (locally) and pushes (throttled to MCP) a student's context snapshot.
 */
export function syncContext({ studentId, context }) {
  if (!studentId) return;
  const now = Date.now();
  const last = lastPush.get(studentId) || 0;
  if (now - last < THROTTLE_MS) return;

  lastPush.set(studentId, now);
  const payload = pickFields(context);
  if (Object.keys(payload).length === 0) return;

  pushContext({ studentId, ...payload }).catch((error) => {
    console.warn("[tutor:context] push failed:", error.message);
  });
}

/** Returns the last pushed snapshot for a student (for reads/tests). */
export function getSyncedContext(studentId) {
  return lastPush.get(studentId) ?? null;
}