import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import circuitService from "./services/circuitService.js";
import { z } from "zod";

const server = new McpServer({
  name: "quantum-circuit-server",
  version: "1.0.0",
});

server.tool(
  "add_gate",
  "Add a quantum gate to a circuit",
  {
    circuitId: z.string().default("default"),
    gate: z.enum(["H", "X", "Y", "Z", "S", "T"]),
    qubit: z.number().int().min(0),
    column: z.number().int().min(0),
  },
  async ({ circuitId, gate, qubit, column }) => {
    try {
      const circuit = circuitService.addGate(
        circuitId,
        gate,
        qubit,
        column
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(circuit, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);
server.tool(
  "get_circuit",
  "Get the current quantum circuit",
  {
    circuitId: z.string(),
  },
  async ({ circuitId }) => {
    const circuit = circuitService.getCircuit(circuitId);

    if (!circuit) {
      return {
        content: [
          {
            type: "text",
            text: `Circuit '${circuitId}' not found`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(circuit, null, 2),
        },
      ],
    };
  }
);
server.tool(
  "remove_gate",
  "Remove a quantum gate from a circuit",
  {
    circuitId: z.string(),
    qubit: z.number().int().min(0),
    column: z.number().int().min(0),
  },
  async ({ circuitId, qubit, column }) => {
    try {
      const circuit = circuitService.removeGate(
        circuitId,
        qubit,
        column
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(circuit, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);
server.tool(
  "clear_circuit",
  "Remove all gates from a circuit",
  {
    circuitId: z.string(),
  },
  async ({ circuitId }) => {
    try {
      const circuit = circuitService.clearCircuit(circuitId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(circuit, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);
server.tool(
  "delete_circuit",
  "Delete an entire quantum circuit",
  {
    circuitId: z.string(),
  },
  async ({ circuitId }) => {
    try {
      const result = circuitService.deleteCircuit(circuitId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);


const transport = new StdioServerTransport();

await server.connect(transport);