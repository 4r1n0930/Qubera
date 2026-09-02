import express from "express";
import { createLesson,
    getLessonById,
    deleteLesson
} from "../controllers/lessonController.js";

const router = express.Router();

router.post("/", createLesson);
router.get("/:lessonId", getLessonById);
router.delete("/:lessonId", deleteLesson);

export default router;