/**
 * Tutor capability tools for the Qubera MCP server.
 *
 * Tool groups (all with explicit schemas + safe error handling):
 *   - Navigation   : get_current_screen, navigate_to (strict whitelist)
 *   - UI guidance  : highlight_element, highlight_text, highlight_code, clear_highlights
 *   - Context      : get_current_context, get_current_code, get_current_circuit
 *   - Quantum lab  : execute_current_circuit, analyze_current_circuit
 *   - Student data : get_student_progress, get_student_difficulties, record_learning_event
 *   - (internal)   : set_context
 *
 * MCP tools never manipulate the DOM, navigate, or run quantum circuits
 * directly — they return structured values/actions the controlling layer
 * executes.
 */

import { z } from "zod";
import contextService from "./contextService.js";
import { getStudentProgress, getStudentDifficulties, recordLearningEvent } from "./studentService.js";
import { executeCircuit } from "./executionService.js";
import { ensureDb } from "./db.js";
import {
  NAV_WHITELIST,
  ROUTES,
  LABELS,
  isAllowedPage,
  routeFor,
  labelFor,
} from "../tutor/navigation.js";

const PAGE_ENUM = z.enum(NAV_WHITELIST);
const STUDENT_INPUT = z.string().min(1).max(128).optional().default("guest");

function text(payload) {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function fail(message) {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

/** Structured description of the live circuit (no simulation). */
function describeCircuit(circuit) {
  if (!circuit || typeof circuit.num_qubits !== "number") {
    return null;
  }
  const ops = Array.isArray(circuit.operations) ? circuit.operations : [];
  const byWire = {};
  for (const op of ops) {
    for (const target of op.targets) {
      if (!byWire[target]) byWire[target] = [];
      byWire[target].push({ gate: op.gate, moment: op.moment, params: op.params });
    }
  }
  const wires = Object.keys(byWire)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wire) => ({
      wire,
      gates: byWire[wire].map((g) => `${g.gate}` + (g.params?.length ? `(${g.params.join(", ")})` : "")),
      gateCount: byWire[wire].length,
    }));

  const gateCounts = {};
  for (const op of ops) {
    gateCounts[op.gate] = (gateCounts[op.gate] || 0) + 1;
  }

  return {
    num_qubits: circuit.num_qubits,
    totalOperations: ops.length,
    wires,
    gateCounts,
  };
}

export function registerTutorTools(server) {
  /* ---------------- Navigation ---------------- */

  server.tool(
    "get_current_screen",
    "Use this when you need to know which Qubera screen the student is currently looking at.",
    { studentId: STUDENT_INPUT },
    ({ studentId }) => {
      const ctx = contextService.getContext(studentId);
      return text({
        screen: ctx?.screen || "dashboard",
        route: ctx?.route || "/dashboard",
      });
    }
  );

  server.tool(
    "navigate_to",
    "Navigate the student to a specific Qubera learning screen when the current screen is not appropriate for the requested learning activity. Only pages on the whitelist are allowed. For the 'learn' page, pass a short `lesson` phrase (e.g. the lesson title or topic the student asked about) to open that exact lesson.",
    {
      studentId: STUDENT_INPUT,
      page: PAGE_ENUM,
      lesson: z.string().min(1).max(256).optional(),
    },
    ({ studentId, page, lesson }) => {
      if (!isAllowedPage(page)) {
        return fail(`Navigation blocked: "${page}" is not an allowed page.`);
      }
      return text({
        action: { type: "navigate", target: page, lesson },
        page,
        route: routeFor(page, lesson),
        label: labelFor(page),
        lesson: lesson || null,
        allowed: true,
      });
    }
  );

  /* ---------------- UI guidance ---------------- */

  server.tool(
    "highlight_element",
    "Highlight a UI element identified by its data-tutor-id (e.g. 'hadamard-gate'). Use this to draw the student's attention to a gate, button, or concept in the current screen.",
    { studentId: STUDENT_INPUT, elementId: z.string().min(1).max(256) },
    ({ elementId }) =>
      text({ action: { type: "highlight", target: elementId }, elementId })
  );

  server.tool(
    "highlight_text",
    "Highlight a block of teaching text by its data-tutor-id (e.g. 'superposition-definition'). Alias of highlight_element for semantic clarity.",
    { studentId: STUDENT_INPUT, elementId: z.string().min(1).max(256) },
    ({ elementId }) =>
      text({ action: { type: "highlight_text", target: elementId }, elementId })
  );

  server.tool(
    "highlight_code",
    "Highlight a specific line in the current Quantum Lab code editor. Input is a 1-based line number.",
    { studentId: STUDENT_INPUT, line: z.number().int().min(1) },
    ({ line }) => text({ action: { type: "highlight_code", line }, line })
  );

  server.tool(
    "clear_highlights",
    "Remove all active tutor highlights from the current screen.",
    {},
    () => text({ action: { type: "clear_highlights" }, cleared: true })
  );

  /* ---------------- Context ---------------- */

  server.tool(
    "set_context",
    "(internal) Update the stored live snapshot for a student. Called by the application gateway when the student's screen or lab state changes.",
    {
      studentId: z.string().min(1).max(128),
      screen: z.string().optional(),
      route: z.string().optional(),
      topic: z.string().optional(),
      code: z.string().optional(),
      framework: z.string().optional(),
      circuit: z.record(z.unknown()).optional(),
      selectedGate: z.string().optional(),
    },
    ({ studentId, ...payload }) => {
      const stored = contextService.setContext(studentId, payload);
      return text({
        stored: true,
        fields: Object.keys(contextService.sanitize(payload)),
        updatedAt: stored.updatedAt,
      });
    }
  );

  server.tool(
    "get_current_context",
    "Use this at the start of a tutoring turn to understand where the student is: screen, topic, circuit and code availability, and student progress.",
    { studentId: STUDENT_INPUT },
    async ({ studentId }) => {
      await ensureDb();
      const ctx = contextService.getContext(studentId);
      const progress = await getStudentProgress(studentId);
      return text({
        screen: ctx?.screen || "dashboard",
        route: ctx?.route || "/dashboard",
        topic: ctx?.topic || null,
        selectedGate: ctx?.selectedGate || null,
        circuitAvailable: Boolean(ctx?.circuit),
        codeAvailable: typeof ctx?.code === "string",
        studentProgress: progress,
      });
    }
  );

  server.tool(
    "get_current_code",
    "Use this when the student asks about their code or when diagnosing a quantum-programming mistake.",
    { studentId: STUDENT_INPUT },
    ({ studentId }) => {
      const ctx = contextService.getContext(studentId);
      if (typeof ctx?.code !== "string") {
        return fail("No code is available — the student is not viewing the Quantum Lab code editor.");
      }
      return text({
        framework: ctx.framework || "qiskit",
        code: ctx.code,
        screen: ctx?.screen || "dashboard",
      });
    }
  );

  server.tool(
    "get_current_circuit",
    "Read the student's current circuit in canonical Circuit IR. Use this to inspect what circuit the student has built.",
    { studentId: STUDENT_INPUT },
    ({ studentId }) => {
      const ctx = contextService.getContext(studentId);
      if (!ctx?.circuit) {
        return fail("No circuit available — the student has not built one in the Quantum Lab.");
      }
      return text({ circuit: ctx.circuit, sourceScreen: ctx.screen || "dashboard" });
    }
  );

  /* ---------------- Quantum lab ---------------- */

  server.tool(
    "execute_current_circuit",
    "Use this when the student needs to observe the result of their current quantum circuit. Runs through the existing quantum execution gateway and returns the normalized counts, probabilities, statevector, and Bloch vectors.",
    {
      studentId: STUDENT_INPUT,
      backend: z.enum(["qiskit", "pennylane", "cirq"]).optional().default("qiskit"),
      shots: z.number().int().min(1).max(100000).optional().default(1000),
    },
    async ({ studentId, backend, shots }) => {
      const ctx = contextService.getContext(studentId);
      if (!ctx?.circuit) {
        return fail("No circuit available to execute. Ask the student to build one in the Quantum Lab first.");
      }
      try {
        const result = await executeCircuit(ctx.circuit, { backend, shots });
        return text({
          executed: true,
          backend,
          shots,
          counts: result.counts || null,
          probabilities: result.probabilities || null,
          statevector: result.statevector || null,
          bloch_vectors: result.bloch_vectors || null,
          elapsed_time_ms: result.elapsed_time_ms || null,
        });
      } catch (error) {
        return fail(error.message);
      }
    }
  );

  server.tool(
    "analyze_current_circuit",
    "Inspect the student's current circuit and describe what it does (gates per wire, gate counts). Does not execute anything — use this before explaining a circuit's behavior.",
    { studentId: STUDENT_INPUT },
    ({ studentId }) => {
      const ctx = contextService.getContext(studentId);
      if (!ctx?.circuit) {
        return fail("No circuit available to analyze.");
      }
      const description = describeCircuit(ctx.circuit);
      return text({ analyzed: true, circuit: description });
    }
  );

  /* ---------------- Student data ---------------- */

  server.tool(
    "get_student_progress",
    "Read the authenticated student's learning progress (modules, completion percentages, overall). Use this to recommend the next lesson or gauge readiness.",
    { studentId: z.string().min(1).max(128) },
    async ({ studentId }) => {
      await ensureDb();
      const progress = await getStudentProgress(studentId);
      return text(progress);
    }
  );

  server.tool(
    "get_student_difficulties",
    "Return likely difficulties for the authenticated student, derived from progress and past tutor events. Use this when adapting an explanation or choosing a review activity.",
    { studentId: z.string().min(1).max(128) },
    async ({ studentId }) => {
      await ensureDb();
      const difficulties = await getStudentDifficulties(studentId);
      return text(difficulties);
    }
  );

  server.tool(
    "record_learning_event",
    "Record a meaningful learning interaction (e.g. hint_used, experiment_ran, lesson_read) for later teaching adaptation. Use sparingly — not after every chat message.",
    {
      studentId: z.string().min(1).max(128),
      topic: z.string().min(1).max(128),
      event: z.string().min(1).max(128),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
    },
    async ({ studentId, topic, event, difficulty }) => {
      await ensureDb();
      try {
        const recorded = await recordLearningEvent({ studentId, topic, event, difficulty });
        return text(recorded);
      } catch (error) {
        return fail(error.message);
      }
    }
  );

  return server;
}

export { NAV_WHITELIST, ROUTES, LABELS };