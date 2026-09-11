import "dotenv/config";
import mongoose from "mongoose";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import Lesson from "../models/Lesson.js";

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/qubera";
const FENCE = /```(python|qiskit)\r?\n([\s\S]*?)```/gi;

export function reformatQiskit(code) {
  const qubitMatch = code.match(/QuantumCircuit\s*\(\s*(\d+)/i);
  if (!qubitMatch) return null;

  const lines = code.split(/\r?\n/);
  const statements = [];
  let buffer = "";
  let depth = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (buffer) {
      buffer += ` ${line}`;
      depth += countBrackets(line);
      if (depth > 0) continue;
      acceptStatement(statements, buffer);
      buffer = "";
      continue;
    }

    if (isSkippable(line)) continue;

    depth = countBrackets(line);
    if (depth > 0) {
      buffer = line;
    } else {
      acceptStatement(statements, line);
    }
  }

  if (buffer) acceptStatement(statements, buffer);

  const out = [
    "from qiskit import QuantumCircuit",
    `qc = QuantumCircuit(${qubitMatch[1]})`,
    ...statements,
    "qc.measure_all()",
  ];

  return out.join("\n");
}

function countBrackets(line) {
  let depth = 0;
  for (const ch of line) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
  }
  return depth;
}

function isSkippable(line) {
  return (
    /^(from\s+|import\s+|#)/.test(line) ||
    /^qc\.measure/i.test(line) ||
    /^qc\s*=\s*QuantumCircuit\s*\(/i.test(line)
  );
}

function acceptStatement(statements, statement) {
  const trimmed = statement.trim();
  if (!trimmed || isSkippable(trimmed)) return;
  statements.push(trimmed);
}

export function reformatContent(content) {
  const parts = [];
  let lastIndex = 0;
  let changed = false;
  const log = [];
  let m;
  FENCE.lastIndex = 0;
  while ((m = FENCE.exec(content))) {
    parts.push(content.slice(lastIndex, m.index));
    const lang = m[1].toLowerCase();
    const code = m[2];
    const reformatted = reformatQiskit(code);
    if (reformatted === null || reformatted === code) {
      parts.push(m[0]);
      log.push({ lang, changed: false });
    } else {
      parts.push(`\`\`\`${lang}\n${reformatted}\n\`\`\``);
      changed = true;
      log.push({ lang, changed: true });
    }
    lastIndex = FENCE.lastIndex;
  }
  parts.push(content.slice(lastIndex));
  return { content: parts.join(""), changed, blocks: log };
}

async function loadLessons() {
  await mongoose.connect(process.env.MONGODB_URI || DEFAULT_MONGODB_URI);
  return Lesson.find({}).sort({ _id: 1 }).lean();
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const lessons = await loadLessons();

  let totalBlocks = 0;
  let totalChanged = 0;
  let lessonsChanged = 0;

  for (const lesson of lessons) {
    const result = reformatContent(lesson.content || "");
    totalBlocks += result.blocks.length;
    const changed = result.changed && result.content !== lesson.content;
    if (!changed) continue;
    lessonsChanged += 1;
    totalChanged += result.blocks.filter((b) => b.changed).length;
    if (dryRun) {
      console.log(`[${lesson._id}] ${lesson.title}`);
      for (const b of result.blocks) {
        if (b.changed) console.log(`  - reformat one \`\`\`${b.lang}\`\`\` block`);
      }
    }
  }

  console.log(`Lessons scanned: ${lessons.length}`);
  console.log(`Code blocks found: ${totalBlocks}`);
  console.log(`Lessons with changes: ${lessonsChanged}`);
  console.log(`Code blocks to change: ${totalChanged}`);

  if (dryRun) {
    console.log("Dry-run only; nothing was written.");
    await mongoose.disconnect();
    return;
  }

  const backupDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "backups");
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `lessons-backup-${stamp}.json`);
  await writeFile(
    backupPath,
    JSON.stringify(
      lessons.map((l) => ({ _id: String(l._id), title: l.title, content: l.content })),
      null,
      2
    )
  );
  console.log(`Backup written: ${backupPath}`);

  for (const lesson of lessons) {
    const result = reformatContent(lesson.content || "");
    if (!result.changed || result.content === lesson.content) continue;
    await Lesson.updateOne({ _id: lesson._id }, { $set: { content: result.content } });
  }

  console.log("Migration complete.");
  await mongoose.disconnect();
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  run().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}