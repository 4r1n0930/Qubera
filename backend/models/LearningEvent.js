import mongoose from "mongoose";

/**
 * Lightweight learning-event log for the AI tutor.
 *
 * Intentional minimalism: this is not a general analytics system. The tutor
 * writes one document per meaningful interaction (e.g. hint_used,
 * lesson_completed) so future teaching adaptation has a small signal to read.
 * Application progress itself continues to live in the existing Progress model.
 */
const learningEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    event: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
  },
  {
    timestamps: true,
  }
);

const LearningEvent = mongoose.model("LearningEvent", learningEventSchema);

export default LearningEvent;