/**
 * Rule-based fallback tutor.
 *
 * Used when the Gemini-powered agent is unavailable (no API key or a runtime
 * failure). It grants the same safety properties as the LLM path: navigation
 * goes through the whitelist, reasoning uses the MCP tools, and outputs the
 * same `{ message, actions, activity }` contract. Because it cannot author
 * free-form teaching text, pure questions fall through to the RAG pipeline.
 */

import { withStudentId, actionFor, activityFor } from "./mapping.js";
import { routeFor, labelFor, isAllowedPage } from "../../mcp-server/tutor/navigation.js";

const PAGE_KEYWORDS = [
  ["quantum playground", "quantumLab"],
  ["quantum lab", "quantumLab"],
  ["playground", "quantumLab"],
  ["lab", "quantumLab"],
  ["learn", "learn"],
  ["lesson", "learn"],
  ["progress", "progress"],
  ["leaderboard", "leaderboard"],
  ["profile", "profile"],
  ["settings", "settings"],
  ["resources", "resources"],
  ["dashboard", "dashboard"],
  ["home", "dashboard"],
];

function parseData(result) {
  if (!result || !result.ok) return null;
  try {
    return JSON.parse(result.data);
  } catch {
    return null;
  }
}

const NAV_RE =
  /(go to|go into|open|take me to|navigate|bring me to|head to|show me)\b/;

const LESSON_LEADING =
  /^(please\s+)?(explain|tell\s+me\s+(about|what)|in\s+simple\s+terms\s*,?\s*|define|describe|what\s+is|what\s+are|what's|whats|what\s+does|what\s+do|how\s+does|how\s+do|how\s+is|what)\s+/;

const LESSON_STOP = new Set([
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "at",
  "to",
  "what",
  "is",
  "are",
  "does",
  "do",
  "please",
  "it",
  "this",
  "that",
  "me",
  "for",
]);

const LESSON_CUT = /\s+(like|for|versus|vs|meaning|example)\b/;

const GREETINGS =
  /^(hi+|hello+|hey+|yo|howdy|thanks|thank you|thx|ok|okay|good (morning|evening|afternoon)|bye|goodbye|cool|nice|awesome|great|sure)\b/i;

/**
 * Extracts a short searchable lesson topic from a tutor-style question,
 * e.g. "what is superposition?" → "superposition".
 */
export function extractTopic(message) {
  const raw = String(message || "");
  if (!raw.trim() || GREETINGS.test(raw)) return null;

  let phrase = raw
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  phrase = phrase.replace(LESSON_LEADING, (m) => "");
  phrase = phrase.replace(LESSON_CUT, "");
  phrase = phrase.replace(/\s+(please|now)$/, "");

  const words = phrase.split(" ").filter(Boolean).filter((w) => !LESSON_STOP.has(w));
  const topic = words.slice(0, 4).join(" ").trim();
  return topic.length >= 2 ? topic : null;
}

function detectNav(message) {
  if (!NAV_RE.test(message)) return null;
  const lower = message.toLowerCase();
  for (const [keyword, page] of PAGE_KEYWORDS) {
    if (lower.includes(keyword)) return page;
  }
  return null;
}

function summaryLine(moduleSummary) {
  const { overall = 0, modules = [] } = moduleSummary || {};
  if (!Array.isArray(modules) || modules.length === 0) {
    return "You haven't started any modules yet — try 'Teach me superposition' to begin.";
  }
  const inProgress = modules
    .filter((m) => m.completion > 0 && m.completion < 100)
    .slice(0, 3)
    .map((m) => `${m.name} (${m.completion}%)`);
  const done = modules.filter((m) => m.completion >= 100).length;
  const parts = [`You have ${done} module${done === 1 ? "" : "s"} complete.`];
  if (inProgress.length) {
    parts.push(`Still working on: ${inProgress.join(", ")}.`);
  }
  parts.push(`Overall progress: ${overall}%.`);
  return parts.join(" ");
}

function countsSummary(executionData) {
  const counts = executionData?.counts;
  if (!counts || typeof counts !== "object") {
    return "The circuit ran without counts — try running it again from the Quantum Lab.";
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([bit, n]) => `${bit} (${Math.round((n / total) * 100)}%)`);
  return `I ran your circuit and the most frequent results were ${top.join(", ")}.`;
}

function circuitSummary(circuitDesc) {
  if (!circuitDesc?.circuit) {
    return "You don't have a circuit built yet — try adding a few gates in the Quantum Lab.";
  }
  const c = circuitDesc.circuit;
  const gates = Object.entries(c.gateCounts || {})
    .map(([g, n]) => `${g} ×${n}`)
    .join(", ");
  return `Your circuit uses ${c.num_qubits} qubit${c.num_qubits === 1 ? "" : "s"} across ${c.totalOperations} operation${c.totalOperations === 1 ? "" : "s"}${gates ? ` (${gates}).` : "."} `;
}

async function runIntent(intent, deps, studentId) {
  const calls = [];
  let message = null;

  switch (intent.kind) {
    case "navigate": {
      calls.push(["navigate_to", { page: intent.page }]);
      message = `Let's head to ${labelFor(intent.page)}.`;
      break;
    }
    case "progress":
      calls.push(["get_student_progress", {}]);
      break;
    case "execute":
      calls.push(["execute_current_circuit", { backend: "qiskit", shots: 1000 }]);
      break;
    case "analyze":
      calls.push(["get_current_circuit", {}]);
      calls.push(["analyze_current_circuit", {}]);
      break;
    case "code":
      calls.push(["get_current_code", {}]);
      break;
    case "difficulties":
      calls.push(["get_student_difficulties", {}]);
      break;
    default:
      break;
  }

  const actions = [];
  const activity = [];
  const results = {};

  for (const [tool, args] of calls) {
    const result = await deps.callTool(tool, withStudentId(args, studentId));
    results[tool] = result;
    activity.push(activityFor(tool, args));
    const action = actionFor(tool, args);
    if (action) actions.push(action);
  }

  switch (intent.kind) {
    case "navigate":
      break; // message set above
    case "progress":
      message = summaryLine(parseData(results.get_student_progress));
      break;
    case "execute":
      message = countsSummary(parseData(results.execute_current_circuit));
      break;
    case "analyze":
      message =
        circuitSummary(parseData(results.analyze_current_circuit)) +
        (parseData(results.get_current_circuit)?.circuit
          ? "I can run it if you'd like — just say 'run my circuit'."
          : "");
      break;
    case "code": {
      const code = parseData(results.get_current_code);
      if (!code) {
        message = "You're not viewing the code editor right now — open the Quantum Lab split view to see your code.";
      } else {
        const lines = code.code.split("\n").length;
        message = `You have a ${code.framework} program with ${lines} lines in the editor. Ask me what a specific part does!`;
      }
      break;
    }
    case "difficulties": {
      const d = parseData(results.get_student_difficulties);
      const list = (d?.difficulties || []).map((x) => x.topic);
      message = list.length
        ? `It looks like ${list.slice(0, 3).join(", ")} might be worth revisiting. Want to review one?`
        : "No obvious trouble spots yet — keep going!";
      break;
    }
    default:
      break;
  }

  return { message, actions, activity };
}

/**
 * Runs the heuristic tutor for `message`.
 *
 * @param {object} opts
 * @param {string} opts.message            student message
 * @param {string} opts.studentId
 * @param {object} opts.deps               { callTool }
 * @param {object|null} opts.rag           optional RAG result from the main agent
 * @returns {Promise<{message, actions, activity, grounded, sources?}>}
 */
export async function runHeuristicAgent({ message, studentId, deps, rag }) {
  const lower = message.toLowerCase();

  let intent = null;
  const navPage = detectNav(message);
  if (navPage && isAllowedPage(navPage)) {
    intent = { kind: "navigate", page: navPage };
  } else if (/(my |the )?(progress|how am i doing|how far|am i doing)/.test(lower)) {
    intent = { kind: "progress" };
  } else if (/\b(run|execute|simulate)\b/.test(lower) && /(circuit|experiment|program|code)/.test(lower)) {
    intent = { kind: "execute" };
  } else if (/(what|how).*(my|the).*circuit|analyze.*(circuit)|circuit.*(do|mean)/.test(lower)) {
    intent = { kind: "analyze" };
  } else if (/my code|the code|code editor|in my code|(bugs?|errors?)/.test(lower)) {
    intent = { kind: "code" };
  } else if (/(difficult|struggl|hard|stuck|tricky)/.test(lower)) {
    intent = { kind: "difficulties" };
  }

  if (!intent) {
    // Pure knowledge question → RAG answer, and open the matching lesson.
    const groundedLesson =
      rag?.grounded && Array.isArray(rag.sources) ? rag.sources[0]?.filename : null;
    const lessonQuery = groundedLesson || extractTopic(message);
    const actions = lessonQuery
      ? [{ type: "navigate", target: "learn", lesson: lessonQuery }]
      : [];
    const activity = ["Searching my notes…"];
    if (lessonQuery) activity.push("Opening the lesson…");

    return {
      message:
        rag?.message ||
        "I could not find a relevant answer. Try asking about superposition, entanglement, or a gate.",
      actions,
      activity,
      grounded: Boolean(rag?.grounded),
      sources: rag?.sources,
    };
  }

  const result = await runIntent(intent, deps, studentId);
  return {
    message: result.message || "Here you go!",
    actions: result.actions,
    activity: result.activity,
    grounded: false,
    sources: rag?.sources,
  };
}

export { routeFor };