/**
 * Tutor API — the application gateway for the QUBERA AI Tutor.
 *
 *   POST /api/tutor/chat     one agent turn (message + live context)
 *   POST /api/tutor/context  push a live context snapshot (screen/lab state)
 *
 * The Node layer keeps all orchestration here: RAG grounding, MCP tool
 * execution, and structured UI actions. The frontend only ever talks to this
 * gateway — it never reaches the LLM, the MCP server, or the RAG service
 * directly.
 */

import { Router } from "express";
import { runTutorAgent } from "../agent/tutorAgent.js";
import { callTool, listTools } from "../services/mcpClient.js";
import { syncContext } from "../services/contextSync.js";

const deps = { callTool, listTools };

const MAX_MESSAGE_LENGTH = 4000;
const MAX_STUDENT_ID_LENGTH = 128;

function httpError(res, status, type, message) {
  res.status(status).json({ success: false, error: { type, message } });
}

function normalizeStudentId(value) {
  if (typeof value !== "string" || !value.trim()) return "guest";
  return value.trim().slice(0, MAX_STUDENT_ID_LENGTH);
}

function normalizeContext(value) {
  if (!value || typeof value !== "object") return null;
  return value;
}

export function createTutorRouter() {
  const router = Router();

  router.post("/tutor/chat", async (req, res) => {
    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return httpError(res, 400, "INVALID_MESSAGE", "A message is required.");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return httpError(res, 400, "MESSAGE_TOO_LONG", `Message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
    }

    const studentId = normalizeStudentId(body.studentId);
    const context = normalizeContext(body.context);

    if (context) syncContext({ studentId, context });

    try {
      const result = await runTutorAgent({
        message,
        studentId,
        context,
        deps,
      });
      return res.json({ success: true, ...result });
    } catch (error) {
      console.error("[tutor:chat] failed:", error.message);
      return httpError(res, 502, "TUTOR_FAILED", "The tutor service is temporarily unavailable.");
    }
  });

  router.post("/tutor/context", (req, res) => {
    const body = req.body || {};
    const context = normalizeContext(body.context);

    if (!context) {
      return httpError(res, 400, "INVALID_CONTEXT", "A context object is required.");
    }

    const studentId = normalizeStudentId(body.studentId);
    syncContext({ studentId, context });
    return res.json({ success: true, synced: true });
  });

  return router;
}

export default createTutorRouter();