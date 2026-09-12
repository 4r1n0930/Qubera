import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";

/**
 * Full-text-ish lesson search for the AI tutor's deep links.
 * GET /api/modules/search?q=superposition → matching lessons (title match).
 */
export const searchLessons = async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    return res.status(400).json({ message: "Query parameter q is required", lessons: [] });
  }

  try {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lessons = await Lesson.find({ title: { $regex: escaped, $options: "i" } })
      .sort({ order: 1 })
      .limit(10)
      .lean();

    const moduleIds = [...new Set(lessons.map((l) => l.moduleId))];
    const modules = await Module.find({ _id: { $in: moduleIds } })
      .select("title")
      .lean();
    const titleById = new Map(modules.map((m) => [String(m._id), m.title]));

    const result = lessons.map((l) => ({
      ...l,
      moduleTitle: titleById.get(String(l.moduleId)) || null,
    }));

    res.status(200).json({ message: "Lessons found", lessons: result });
  } catch (error) {
    res.status(500).json({
      message: "Failed to search lessons",
      error: error.message,
      lessons: [],
    });
  }
};

export const createLesson = async (req, res) => {
  try {
    const {
      moduleId,
      title,
      content,
      order,
      duration,
    } = req.body;

    // Validate required fields
    if (!moduleId || !title || !content || !order) {
      return res.status(400).json({
        message: "moduleId, title, content and order are required",
      });
    }

    // Create lesson
    const lesson = await Lesson.create({
      moduleId,
      title,
      content,
      order,
      duration,
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create lesson",
      error: error.message,
    });
  }
};
export const getLessonsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const lessons = await Lesson.find({ moduleId })
      .sort({ order: 1 });

    res.status(200).json({
      message: "Lessons fetched successfully",
      lessons,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch lessons",
      error: error.message,
    });
  }
};
export const getLessonById = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      message: "Lesson fetched successfully",
      lesson,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch lesson",
      error: error.message,
    });
  }
};
export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findByIdAndDelete(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete lesson",
      error: error.message,
    });
  }
};