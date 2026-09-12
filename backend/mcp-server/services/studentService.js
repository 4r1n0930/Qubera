/**
 * Student progress/difficulty data for the tutor's MCP tools.
 *
 * Reads the existing Progress + Module + User models and the lightweight
 * LearningEvent log. All queries are scoped by the studentId the authenticated
 * tutor session passes in — a tool never receives another user's id from the
 * LLM, so no cross-student data can leak.
 */

import mongoose from "mongoose";
import Progress from "../../models/Progress.js";
import Module from "../../models/Module.js";
import LearningEvent from "../../models/LearningEvent.js";

function dbReady() {
  return mongoose.connection.readyState === 1;
}

function objectId(value) {
  // Accept a real ObjectId string or the mock id used by the local preview.
  return mongoose.isValidObjectId(value) ? value : value;
}

export async function getStudentProgress(studentId) {
  if (!studentId) {
    return { modules: [], overall: 0, available: false };
  }

  try {
    if (!dbReady()) {
      return { modules: [], overall: 0, available: false };
    }

    const rows = await Progress.find({ userId: objectId(studentId) }).lean();
    const moduleIds = rows.map((r) => r.moduleId);
    const modules =
      moduleIds.length > 0
        ? await Module.find({ _id: { $in: moduleIds } })
            .select("title _id")
            .lean()
        : [];

    const byId = new Map(modules.map((m) => [String(m._id), m]));

    const mapped = rows
      .map((r) => ({
        moduleId: String(r.moduleId),
        name: byId.get(String(r.moduleId))?.title || "Unknown module",
        completion: r.progress,
        status: r.status,
      }))
      .sort((a, b) => b.completion - a.completion);

    const overall =
      mapped.length === 0
        ? 0
        : Math.round(
            mapped.reduce((sum, m) => sum + m.completion, 0) / mapped.length
          );

    return { modules: mapped, overall, available: true };
  } catch (error) {
    console.error("[tutor:progress] failed to load progress:", error.message);
    return { modules: [], overall: 0, available: false, error: error.message };
  }
}

/**
 * Derives learning difficulties from existing signals only — no new analytics
 * machinery. A module is flagged when it has been started but is below
 * threshold; a topic is flagged when it accumulated repeated tutor events.
 */
export async function getStudentDifficulties(studentId) {
  if (!studentId || !dbReady()) {
    return { difficulties: [] };
  }

  try {
    const progress = await getStudentProgress(studentId);
    const difficulties = [];

    for (const mod of progress.modules) {
      if (mod.status === "Completed") continue;
      if (mod.completion > 0 && mod.completion < 60) {
        difficulties.push({
          topic: mod.name,
          signal: "in_progress_below_threshold",
          completion: mod.completion,
          note: "Started but not completed yet — likely worth revisiting.",
        });
      }
    }

    const events = await LearningEvent.find({ userId: String(studentId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const topicCounts = new Map();
    for (const ev of events) {
      const topic = ev.topic || "unknown";
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }

    for (const [topic, count] of topicCounts) {
      if (count > 1) {
        difficulties.push({
          topic,
          signal: "repeated_tutor_events",
          eventCount: count,
          note: "The student returned to this topic several times.",
        });
      }
    }

    return { difficulties: difficulties.slice(0, 8) };
  } catch (error) {
    console.error("[tutor:difficulties] failed:", error.message);
    return { difficulties: [] };
  }
}

export async function recordLearningEvent({ studentId, topic, event, difficulty = "beginner" }) {
  if (!studentId || !topic || !event) {
    throw new Error("studentId, topic and event are required.");
  }
  if (!dbReady()) {
    throw new Error("Student data service is unavailable (database not connected).");
  }

  const doc = await LearningEvent.create({
    userId: String(studentId),
    topic,
    event,
    difficulty,
  });

  return {
    recorded: true,
    id: String(doc._id),
    topic,
    event,
    difficulty,
    createdAt: doc.createdAt,
  };
}