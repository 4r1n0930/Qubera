import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";

import {
  NAV_WHITELIST,
  ROUTES,
  LABELS,
  isAllowedPage,
  routeFor,
  labelFor,
} from "../mcp-server/tutor/navigation.js";
import {
  actionFor,
  activityFor,
  withStudentId,
} from "../tutor/agent/mapping.js";
import {
  RagUnavailableError,
  askKnowledge,
} from "../tutor/services/ragClient.js";
import { runTutorAgent } from "../tutor/agent/tutorAgent.js";
import { extractTopic } from "../tutor/agent/heuristic.js";

test("navigation whitelist allows only known pages", () => {
  assert.equal(isAllowedPage("quantumLab"), true);
  assert.equal(isAllowedPage("learn"), true);
  assert.equal(isAllowedPage("dashboard"), true);
  assert.equal(isAllowedPage("https://evil.invalid"), false);
  assert.equal(isAllowedPage("javascript:alert(1)"), false);
  assert.equal(isAllowedPage("playground"), false);
});

test("every whitelisted page has a route and a label", () => {
  for (const page of NAV_WHITELIST) {
    assert.ok(routeFor(page), `route missing for ${page}`);
    assert.ok(labelFor(page), `label missing for ${page}`);
    assert.ok(ROUTES[page].startsWith("/dashboard"), `route not scoped: ${page}`);
  }
});

test("routeFor deep-links the learn page with an encoded lesson query", () => {
  assert.equal(routeFor("learn", "Superposition"), "/dashboard/learn?q=Superposition");
  assert.equal(
    routeFor("learn", "What is Qubit & the Hadamard Gate?"),
    "/dashboard/learn?q=What%20is%20Qubit%20%26%20the%20Hadamard%20Gate%3F"
  );
  assert.equal(routeFor("progress"), "/dashboard/progress");
  assert.equal(routeFor(null), null);
});

test("tool names map to whitelisted pages only", () => {
  assert.deepEqual(actionFor("navigate_to", { page: "progress" }), {
    type: "navigate",
    target: "progress",
  });
  // The MCP server enforces the whitelist; the action mapper only forwards.
  assert.equal(actionFor("navigate_to", { page: "not-real" })?.target, "not-real");
  // An optional lesson is forwarded for learn deep links.
  assert.deepEqual(actionFor("navigate_to", { page: "learn", lesson: "Superposition" }), {
    type: "navigate",
    target: "learn",
    lesson: "Superposition",
  });
});

test("highlight/clear tools produce deterministic actions", () => {
  assert.deepEqual(actionFor("highlight_element", { elementId: "hadamard-gate" }), {
    type: "highlight",
    target: "hadamard-gate",
  });
  assert.deepEqual(actionFor("highlight_text", { elementId: "superposition-definition" }), {
    type: "highlight_text",
    target: "superposition-definition",
  });
  assert.deepEqual(actionFor("highlight_code", { line: 5 }), {
    type: "highlight_code",
    line: 5,
  });
  assert.deepEqual(actionFor("clear_highlights", {}), { type: "clear_highlights" });
  assert.equal(actionFor("get_student_progress", {}), null);
});

test("read/execution tools get activity labels, not actions", () => {
  assert.equal(activityFor("get_current_code"), "Checking your code…");
  assert.equal(activityFor("navigate_to", { page: "progress" }), "Opening Progress…");
  assert.equal(
    activityFor("navigate_to", { page: "learn", lesson: "Superposition" }),
    "Opening Learning path — the Superposition lesson…"
  );
  assert.equal(actionFor("execute_current_circuit", {}), null);
});

test("withStudentId injects the authenticated id and blocks LLM-specified ids", () => {
  assert.deepEqual(withStudentId({}, "student-1"), { studentId: "student-1" });
  assert.deepEqual(withStudentId({ page: "learn", studentId: "evil" }, "student-1"), {
    page: "learn",
    studentId: "student-1",
  });
});

test("rag client surfaces a structured error when the service is unreachable", async (t) => {
  const post = t.mock.method(axios, "post", async () => {
    throw new Error("Network Error");
  });
  await assert.rejects(
    askKnowledge("what is a qubit"),
    (err) => err instanceof RagUnavailableError
  );
  assert.equal(post.mock.callCount(), 1);
  post.mock.restore();
});

test("rag client parses a successful response", async (t) => {
  t.mock.method(axios, "post", async () => ({
    status: 200,
    data: {
      success: true,
      message: "A qubit is the basic unit of quantum information.",
      grounded: true,
      sources: [{ source: "abc", filename: "Qubit" }],
    },
  }));

  const result = await askKnowledge("what is a qubit", { studentId: "s1" });
  assert.equal(result.grounded, true);
  assert.equal(result.message, "A qubit is the basic unit of quantum information.");
  assert.equal(result.sources.length, 1);
  axios.post.mock.restore();
});

test("heuristic tutor navigates on a navigation request and yields a navigate action", async () => {
  const deps = {
    callTool: async (name, args) => {
      if (name === "navigate_to") {
        return { ok: true, data: JSON.stringify({ page: args.page }) };
      }
      throw new Error(`unexpected tool ${name}`);
    },
    listTools: async () => [],
  };

  const result = await runTutorAgent({
    message: "take me to my progress",
    studentId: "s1",
    context: { screen: "dashboard", topic: "" },
    deps,
  });

  assert.deepEqual(result.actions, [{ type: "navigate", target: "progress" }]);
  assert.match(result.message, /Progress/);
});

test("heuristic tutor summarizes progress via the student tool", async () => {
  const deps = {
    callTool: async (name) => {
      if (name === "get_student_progress") {
        return {
          ok: true,
          data: JSON.stringify({
            overall: 50,
            modules: [
              { moduleId: "m1", name: "Superposition", completion: 72, status: "In Progress" },
              { moduleId: "m2", name: "Measurement", completion: 35, status: "In Progress" },
            ],
          }),
        };
      }
      throw new Error(`unexpected tool ${name}`);
    },
    listTools: async () => [],
  };

  const result = await runTutorAgent({
    message: "how am I doing",
    studentId: "s1",
    context: {},
    deps,
  });

  assert.equal(result.actions.length, 0);
  assert.match(result.message, /Superposition/);
  assert.match(result.message, /50%/);
});

test("heuristic tutor executes the current circuit and summarizes counts", async () => {
  const deps = {
    callTool: async (name) => {
      if (name === "execute_current_circuit") {
        return {
          ok: true,
          data: JSON.stringify({ counts: { "0": 750, "1": 250 } }),
        };
      }
      throw new Error(`unexpected tool ${name}`);
    },
    listTools: async () => [],
  };

  const result = await runTutorAgent({
    message: "run my circuit please",
    studentId: "s1",
    context: {},
    deps,
  });

  assert.match(result.message, /most frequent results/);
  assert.match(result.message, /0 \(75%\)/);
});

test("heuristic tutor answers pure questions from RAG grounding and opens the lesson", async (t) => {
  t.mock.method(axios, "post", async () => ({
    status: 200,
    data: {
      success: true,
      message: "Superposition lets a qubit represent both states at once.",
      grounded: true,
      sources: [],
    },
  }));

  const deps = {
    callTool: async () => {
      throw new Error("no tools expected");
    },
    listTools: async () => [],
  };

  const result = await runTutorAgent({
    message: "what is superposition?",
    studentId: "s1",
    context: { screen: "quantum-lab", topic: "superposition" },
    deps,
  });

  // The tutor answers AND deep-links to the matching lesson.
  assert.deepEqual(result.actions, [
    { type: "navigate", target: "learn", lesson: "superposition" },
  ]);
  assert.match(result.message, /Superposition/);
  axios.post.mock.restore();
});

test("extractTopic pulls a searchable topic from tutor-style questions", () => {
  assert.equal(extractTopic("what is superposition?"), "superposition");
  assert.equal(extractTopic("explain entanglement for me"), "entanglement");
  assert.equal(extractTopic("Tell me about the Hadamard gate!"), "hadamard gate");
  assert.equal(extractTopic("how does a qubit work?"), "qubit work");
  assert.equal(extractTopic("is a qubit real?"), "qubit real");
  assert.equal(extractTopic("hi"), null);
  assert.equal(extractTopic(""), null);
});

test("student id is injected into tool args for every agent tool call", async () => {
  const seen = [];
  const deps = {
    callTool: async (name, args) => {
      seen.push([name, args]);
      if (name === "get_student_difficulties") {
        return { ok: true, data: JSON.stringify({ difficulties: [] }) };
      }
      throw new Error(`unexpected tool ${name}`);
    },
    listTools: async () => [],
  };

  await runTutorAgent({
    message: "what am I struggling with",
    studentId: "student-9",
    context: {},
    deps,
  });

  assert.ok(seen.length > 0);
  for (const [, args] of seen) {
    assert.equal(args.studentId, "student-9");
  }
});

test("grounded RAG answer with a source lesson deep-links to that lesson", async (t) => {
  t.mock.method(axios, "post", async () => ({
    status: 200,
    data: {
      success: true,
      message: "Answer from the lesson.",
      grounded: true,
      sources: [{ source: "abc", filename: "Introduction to Superposition" }],
    },
  }));

  const deps = {
    callTool: async () => {
      throw new Error("no tools expected");
    },
    listTools: async () => [],
  };

  const result = await runTutorAgent({
    message: "what is superposition?",
    studentId: "s1",
    context: { screen: "quantum-lab", topic: "superposition" },
    deps,
  });

  assert.deepEqual(result.actions, [
    { type: "navigate", target: "learn", lesson: "Introduction to Superposition" },
  ]);
  axios.post.mock.restore();
});

test("un-grounded RAG (service down) answers without forcing navigation", async (t) => {
  t.mock.method(axios, "post", async () => {
    throw new Error("Network Error");
  });

  const deps = {
    callTool: async () => {
      throw new Error("no tools expected");
    },
    listTools: async () => [],
  };

  const result = await runTutorAgent({
    message: "hi there",
    studentId: "s1",
    context: { screen: "quantum-lab" },
    deps,
  });

  assert.equal(result.grounded, false);
  axios.post.mock.restore();
});