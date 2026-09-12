/**
 * MCP client for the Qubera tutor agent.
 *
 * Spawns the existing Qubera MCP server (`backend/mcp-server/server.js`) as a
 * child over stdio and exposes a small, safe surface: list tools, call tools.
 * All tool calls from the agent are funneled through here; the server remains
 * the single source of truth for application capabilities.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { pathToFileURL } from "node:url";

// The MCP server module lives next to this package's sibling folder.
const SERVER_PATH = pathToFileURL(
  new URL("../../mcp-server/server.js", import.meta.url).pathname
).pathname;

const HIDDEN_TOOLS = new Set(["set_context"]);

let client = null;
let transport = null;
let cachedTools = null;

async function ensureClient() {
  if (client) return client;

  transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
    cwd: process.cwd(),
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      // Enable the MCP server's own MongoDB connection when one is configured.
      ...(process.env.MONGODB_URI
        ? { MCP_CONNECT_DB: "1" }
        : { MCP_CONNECT_DB: "0" }),
    },
    stderr: "pipe",
  });

  client = new Client({ name: "qubera-tutor-agent", version: "1.0.0" });

  // Recover from a crashed/closed child by resetting the singleton.
  transport.onclose?.();
  client.onclose = () => {
    client = null;
    transport = null;
    cachedTools = null;
  };

  await client.connect(transport); // eslint-disable-line no-await-in-loop
  return client;
}

/** Lists tutor-visible tools (hides internal plumbing like set_context). */
export async function listTools() {
  if (cachedTools) return cachedTools;
  const mcp = await ensureClient();
  const { tools } = await mcp.listTools();
  cachedTools = tools.filter((t) => !HIDDEN_TOOLS.has(t.name));
  return cachedTools;
}

/**
 * Calls an MCP tool with the given arguments.
 * Resolves with `{ ok: true, data }` or `{ ok: false, error }` — never throws
 * for tool-level failures (the agent should handle them gracefully).
 */
export async function callTool(name, args = {}) {
  const mcp = await ensureClient();
  try {
    const result = await mcp.callTool({ name, arguments: args });
    const text =
      result?.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n") ?? "";

    if (result?.isError) {
      let error = text;
      try {
        const parsed = JSON.parse(text);
        error = parsed.error || text;
      } catch {
        // keep raw text
      }
      return { ok: false, error };
    }
    return { ok: true, data: text };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "MCP tool execution failed.",
    };
  }
}

/** Calls `set_context` (internal plumbing) without exposing it to the agent. */
export async function pushContext(payload) {
  const mcp = await ensureClient();
  try {
    await mcp.callTool({ name: "set_context", arguments: payload });
  } catch (error) {
    console.warn("[tutor:mcp] context push failed:", error.message);
  }
}

export async function closeMcp() {
  if (client) {
    try {
      await client.close();
    } catch {
      // ignore
    }
  }
  client = null;
  transport = null;
  cachedTools = null;
}