import express from "express";
import Progress from "../models/Progress.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Update module progress
router.put("/:moduleId", protect, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { progress } = req.body;

    // Validate progress
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        message: "Progress must be between 0 and 100",
      });
    }

    // Decide status based on progress
    let status = "Not Started";

    if (progress > 0 && progress < 100) {
      status = "In Progress";
    } else if (progress === 100) {
      status = "Completed";
    }

    const updateData = {
      progress,
      status,
    };

    // Add completion time when module is completed
    if (progress === 100) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    // Create if doesn't exist, otherwise update
    const updatedProgress = await Progress.findOneAndUpdate(
      {
        userId: req.user.userId,
        moduleId,
      },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: "Progress updated successfully",
      progress: updatedProgress,
    });
  } catch (error) {
    console.error("Update progress error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// Get progress of a specific module
router.get("/:moduleId", protect, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user.userId,
      moduleId: req.params.moduleId,
    }).populate("moduleId", "title");

    if (!progress) {
      return res.status(404).json({
        message: "Progress not found",
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error("Get progress error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// Get all module progress of logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const progress = await Progress.find({
      userId: req.user.userId,
    })
      .populate("moduleId", "title order difficulty")
      .sort({ "moduleId.order": 1 });

    res.status(200).json(progress);
  } catch (error) {
    console.error("Get all progress error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;
