/**
 * Live tutor context store (per student).
 *
 * Holds the minimal snapshot the frontend publishes about the student's
 * current screen and Quantum Lab state (code + canonical Circuit IR). This is
 * deliberately a small, validated whitelist of teaching-relevant fields — the
 * frontend never sends full application state here.
 */

const ALLOWED_FIELDS = [
  "studentId",
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

const DEFAULTS = {
  screen: "dashboard",
  route: "/dashboard",
  topic: "",
};

class ContextService {
  constructor() {
    this.contexts = new Map();
  }

  sanitize(input = {}) {
    const clean = {};
    for (const field of ALLOWED_FIELDS) {
      if (input[field] !== undefined) clean[field] = input[field];
    }
    return clean;
  }

  setContext(studentId, payload = {}) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("A non-empty studentId is required.");
    }
    if (!payload || typeof payload !== "object") {
      throw new Error("Context payload must be an object.");
    }

    const clean = this.sanitize(payload);
    const existing = this.contexts.get(studentId) || {};
    this.contexts.set(
      studentId,
      { ...DEFAULTS, ...existing, ...clean, updatedAt: Date.now() }
    );
    return this.contexts.get(studentId);
  }

  getContext(studentId) {
    if (!studentId) return null;
    return this.contexts.get(studentId) || null;
  }

  /** Removes a student's snapshot (e.g. on sign out). */
  clearContext(studentId) {
    this.contexts.delete(studentId);
  }
}

export default new ContextService();