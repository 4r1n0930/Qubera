/**
 * Converts MCP tool schemas into Gemini function declarations.
 *
 * The Qubera MCP server is the authority on tool names/schemas; the LLM
 * receives a faithful projection of that list (minus internal plumbing).
 */

/** Strips non-schema keys that Gemini rejects (e.g. the draft-07 marker). */
function cleanParameters(inputSchema = {}) {
  if (!inputSchema || typeof inputSchema !== "object") {
    return { type: "object", properties: {} };
  }
  const { $schema, ...rest } = inputSchema;
  return rest;
}

export function buildFunctionDeclarations(mcpTools) {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description || tool.title || tool.name,
    parameters: cleanParameters(tool.inputSchema),
  }));
}