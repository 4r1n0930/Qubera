/**
 * Deterministic tool → action/activity mapping for the tutor agent.
 *
 * UI actions are derived from the *arguments the agent actually used*, never
 * from model prose, so nothing fragile is parsed out of free text.
 */

import { labelFor } from "../../mcp-server/tutor/navigation.js";

/**
 * Returns a frontend-executable action for a tool call, or null if the tool
 * produced no UI action (pure read/execution tools).
 */
export function actionFor(toolName, args = {}) {
  switch (toolName) {
    case "navigate_to": {
      const action = { type: "navigate", target: args.page };
      if (args.lesson && typeof args.lesson === "string") {
        action.lesson = args.lesson;
      }
      return action;
    }
    case "highlight_element":
      return { type: "highlight", target: args.elementId };
    case "highlight_text":
      return { type: "highlight_text", target: args.elementId };
    case "highlight_code":
      return { type: "highlight_code", line: args.line };
    case "clear_highlights":
      return { type: "clear_highlights" };
    default:
      return null;
  }
}

/** Human-readable activity label shown to the student during a turn. */
export function activityFor(toolName, args = {}) {
  switch (toolName) {
    case "navigate_to":
      return args.lesson
        ? `Opening ${labelFor(args.page)} — the ${args.lesson} lesson…`
        : args.page
          ? `Opening ${labelFor(args.page)}…`
          : "Moving to another screen…";
    case "highlight_element":
    case "highlight_text":
      return "Pointing to something on your screen…";
    case "highlight_code":
      return `Looking at line ${args.line} of your code…`;
    case "clear_highlights":
      return "Clearing highlights…";
    case "get_current_screen":
      return "Looking at what's on your screen…";
    case "get_current_context":
      return "Getting context…";
    case "get_current_code":
      return "Checking your code…";
    case "get_current_circuit":
      return "Looking at your circuit…";
    case "analyze_current_circuit":
      return "Analyzing your circuit…";
    case "execute_current_circuit":
      return "Running your circuit…";
    case "get_student_progress":
      return "Checking your progress…";
    case "get_student_difficulties":
      return "Reviewing what you might find tricky…";
    case "record_learning_event":
      return "Noting that down…";
    default:
      return "Working…";
  }
}

/** Copies args and enforces the authenticated studentId (LLM cannot choose it). */
export function withStudentId(args, studentId) {
  return { ...(args || {}), studentId };
}