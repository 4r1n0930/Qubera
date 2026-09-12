/**
 * Lazy MongoDB connection for the Qubera MCP server.
 *
 * The MCP server must never block its stdio handshake on the database, so the
 * connection happens on demand inside the progress tools (and eagerly when
 * MCP_CONNECT_DB=1).
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const CONNECT_TIMEOUT_MS = 4000;

export function dbReady() {
  return mongoose.connection.readyState === 1;
}

export async function ensureDb() {
  if (dbReady()) return true;
  if (!process.env.MONGODB_URI) return false;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    });
    return true;
  } catch (error) {
    console.warn("[mcp] MongoDB unavailable:", error.message);
    return false;
  }
}

export function disconnectDb() {
  return mongoose.disconnect();
}