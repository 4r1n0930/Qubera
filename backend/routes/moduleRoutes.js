import express from "express";
import { createModule,getModules } from "../controllers/moduleController.js";
import { getLessonsByModule } from "../controllers/lessonController.js";


const router = express.Router();

router.post("/", createModule);
router.get("/", getModules);
router.get("/:moduleId/lessons", getLessonsByModule);

export default router;