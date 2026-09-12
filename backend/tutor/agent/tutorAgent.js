/**
 * Qubera tutor agent orchestration layer.
 *
 * One turn = optional RAG grounding + an LLM loop that may call Qubera MCP
 * tools. UI actions are derived deterministically from the tool calls the
 * agent actually made; the model never emits raw UI code.
 *
 * When the Gemini model is unavailable (no API key, or a runtime failure) the
 * agent falls back to a safe rule-based tutor so the feature keeps working.
 */

import { GoogleGenAI } from "@google/genai";
import { askKnowledge, RagUnavailableError } from "../services/ragClient.js";
import { buildFunctionDeclarations } from "./toolDeclarations.js";
import { actionFor, activityFor, withStudentId } from "./mapping.js";
import { runHeuristicAgent } from "./heuristic.js";

const MODEL = process.env.TUTOR_LLM_MODEL || "gemini-2.0-flash";
const MAX_STEPS = 8;
const MAX_OUTPUT_CHARS = 8000;

const UI_ACTION_TOOLS = new Set([
  "navigate_to",
  "highlight_element",
  "highlight_text",
  "highlight_code",
  "clear_highlights",
]);

/**
 * Deterministically attaches a "open the matching lesson" navigation whenever
 * the answer was grounded in a real lesson and no navigation was already
 * planned. The model never decides to deep-link — this does.
 */
export function attachLessonNavigation(actions, rag) {
  if (!rag?.grounded || !Array.isArray(rag.sources)) return actions;
  const filename = rag.sources[0]?.filename;
  if (!filename) return actions;
  if (actions.some((a) => a.type === "navigate")) return actions;
  return [...actions, { type: "navigate", target: "learn", lesson: filename }];
}

function truncateOutput(data) {
  if (typeof data === "string" && data.length > MAX_OUTPUT_CHARS) {
    return `${data.slice(0, MAX_OUTPUT_CHARS)}\n…[output truncated]`;
  }
  return data;
}

function circuitSummary(circuit) {
  if (!circuit || typeof circuit !== "object") return null;
  const qubits = circuit.num_qubits;
  const ops = Array.isArray(circuit.operations) ? circuit.operations : [];
  const gates = new Map();
  for (const op of ops) {
    if (!op.gate || op.gate === "measure" || op.gate === "barrier") continue;
    gates.set(op.gate, (gates.get(op.gate) || 0) + 1);
  }
  const parts = [...gates.entries()].map(([gate, n]) => `${gate}×${n}`);
  return `${qubits} qubit${qubits === 1 ? "" : "s"}, ${ops.length} operation${ops.length === 1 ? "" : "s"}${
    parts.length ? ` (${parts.join(", ")})` : ""
  }`;
}

function buildSystemPrompt({ context, rag }) {
  const screen = context?.screen || "dashboard";
  const topic = context?.topic || "unknown";
  const page = context?.page || screen;
  const grounding =
    rag?.grounded && rag?.message
      ? rag.message
      : "Live knowledge retrieval is currently unavailable; rely on what you know and the MCP tools.";

  const liveContext = describeLiveContext(context);
  const liveBlock = liveContext
    ? [
        "",
        "The student's live app state the frontend is sharing with you right now:",
        liveContext,
      ]
    : [];

  return [
    "You are Berry, the QUBERA AI Tutor — a friendly, encouraging mentor for students learning quantum computing.",
    "",
    "You live inside the student's Qubera app and can act on their behalf using tools only. The frontend executes your chosen tools automatically — never describe DOM changes or emit UI code yourself.",
    "",
    "Capabilities:",
    "  - navigate_to        – move the student to a whitelisted screen when the current one is wrong for the activity.",
    "  - highlight_*        – point at UI elements, teaching text, or specific code lines.",
    "  - get_current_*      – read the student's live screen/code/circuit without executing anything.",
    "  - analyze_current_circuit / execute_current_circuit – explain or run the student's circuit (execution uses the real quantum gateway).",
    "  - get_student_progress / get_student_difficulties / record_learning_event – read/record progress signals.",
    "",
    "Ground rules:",
    "  - Use the grounding knowledge below as your primary source for quantum facts. Do not invent physics.",
    "  - Only navigate when the current screen is wrong for the request. For a simple question, just answer.",
    "  - When the student asks a conceptual question (e.g. 'what is superposition?'), also open the matching lesson: navigate_to(page='learn', lesson='<topic or lesson title>').",
    "  - Never invent progress or results — read them with tools.",
    "  - Prefer a short concept highlight (e.g. highlight_text) over navigating away when the student is already on the right screen.",
    "  - Speak conversationally in 2–5 sentences, teach, encourage, and end with a single follow-up question when useful.",
    "",
    `Student is currently on: ${screen} (screen page: ${page}, topic: ${topic}).`,
    ...liveBlock,
    "",
    "Grounding knowledge:",
    grounding,
  ].join("\n");
}

/** Compact, human-readable rendering of the live snapshot fields we allow. */
function describeLiveContext(context = {}) {
  const lines = [];
  if (context.lesson) {
    const lesson = context.lesson;
    const title = lesson.title || lesson.id || "a lesson";
    const topic = lesson.topic ? ` (topic: ${lesson.topic})` : "";
    if (lesson.id) lines.push(`  - Reading lesson "${title}"${topic} (id: ${lesson.id}).`);
    else lines.push(`  - Reading lesson "${title}"${topic}.`);
  }
  const circuit = circuitSummary(context.circuit);
  if (circuit) {
    lines.push(`  - Circuit in the lab: ${circuit}.`);
    lines.push("    p.s. if they ask about their circuit, prioritize their Circuit IR over any example.");
  }
  if (context.simulation) {
    const sim = context.simulation;
    const counts =
      sim.counts && typeof sim.counts === "object" && Object.keys(sim.counts).length
        ? Object.entries(sim.counts)
            .slice(0, 4)
            .map(([key, n]) => `${key}:${n}`)
            .join(", ")
        : null;
    const probs =
      sim.probabilities && typeof sim.probabilities === "object" && Object.keys(sim.probabilities).length
        ? Object.entries(sim.probabilities)
            .slice(0, 4)
            .map(([key, value]) => `${key}:${value}`)
            .join(", ")
        : null;
    const bits = [];
    if (counts) bits.push(`counts {${counts}}`);
    if (probs) bits.push(`probs {${probs}}`);
    if (bits.length) lines.push(`  - Last run result: ${bits.join(" ")}.`);
  }
  if (context.userProgress) {
    const p = context.userProgress;
    const bits = [];
    if (typeof p.completedLessons === "number") bits.push(`${p.completedLessons} lessons done`);
    if (p.currentTopic) bits.push(`topic: ${p.currentTopic}`);
    if (p.difficulty) bits.push(`difficulty: ${p.difficulty}`);
    if (bits.length) lines.push(`  - Progress: ${bits.join(", ")}.`);
  }
  if (lines.length === 0) return "";
  return lines.join("\n");
}

async function getGrounding(message, studentId, context) {
  try {
    return await askKnowledge(message, { studentId, context });
  } catch (error) {
    if (error instanceof RagUnavailableError) {
      console.warn("[tutor] RAG unavailable:", error.message);
      return { message: null, grounded: false, sources: [], ragError: error.message };
    }
    throw error;
  }
}

/**
 * Runs one agent turn.
 *
 * @param {object} opts
 * @param {string}        opts.message
 * @param {string}        opts.studentId
 * @param {object|null}   opts.context     live app context (screen, topic, ...)
 * @param {object}        opts.deps        { callTool, listTools }
 * @returns {Promise<{message, actions, activity, grounded, sources}>}
 */
export async function runTutorAgent({ message, studentId = "guest", context, deps }) {
  const rag = await getGrounding(message, studentId, context);

  const actions = [];
  const activity = [];
  const usedTools = [];

  const canUseGemini = Boolean(process.env.GEMINI_API_KEY);

  let finalMessage = null;

  if (!canUseGemini) {
    const fallback = await runHeuristicAgent({ message, studentId, deps, rag });
    return {
      ...fallback,
      actions: dedupe(fallback.actions),
      activity: fallback.activity || [],
    };
  }

  try {
    finalMessage = await runGeminiTurn({
      message,
      studentId,
      context,
      rag,
      deps,
      usedTools,
    });
  } catch (error) {
    console.warn("[tutor] Gemini turn failed, falling back to heuristic:", error.message);
    usedTools.length = 0;
    const fallback = await runHeuristicAgent({ message, studentId, deps, rag });
    return {
      ...fallback,
      actions: dedupe(fallback.actions),
      activity: fallback.activity || [],
    };
  }

  for (const tool of usedTools) {
    const action = actionFor(tool.name, tool.args);
    if (action) actions.push(action);
    const label = activityFor(tool.name, tool.args);
    if (label && !activity.includes(label)) activity.push(label);
  }

  return {
    message: finalMessage || rag?.message || "How can I help?",
    actions: dedupe(attachLessonNavigation(actions, rag)),
    activity,
    grounded: Boolean(rag?.grounded),
    sources: rag?.sources,
  };
}

async function runGeminiTurn({ message, studentId, context, rag, deps, usedTools }) {
  const mcpTools = await deps.listTools();
  const functionDeclarations = buildFunctionDeclarations(mcpTools);
  const tools = [{ functionDeclarations }];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstruction = buildSystemPrompt({ context, rag });

  const contents = [
    { role: "user", parts: [{ text: message }] },
  ];

  let finalText = null;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        tools,
        systemInstruction,
        temperature: 0.4,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall);

    if (calls.length === 0) {
      finalText = parts.map((p) => p.text ?? "").join("").trim();
      break;
    }

    contents.push({ role: "model", parts });

    const functionResponses = [];
    for (const part of calls) {
      const name = part.functionCall.name;
      const args = part.functionCall.args ?? {};
      usedTools.push({ name, args });

      const result = await deps.callTool(name, withStudentId(args, studentId));

      const output = result.ok
        ? truncateOutput(result.data)
        : { error: result.error || "Tool failed." };

      functionResponses.push({ name, response: { output } });
    }

    if (functionResponses.length) {
      contents.push({
        role: "user",
        parts: functionResponses.map((r) => ({ functionResponse: r })),
      });
    }
  }

  return finalText || "I couldn't finish that — ask me again!";
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export { UI_ACTION_TOOLS };