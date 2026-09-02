import Lesson from "../models/Lesson.js";

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