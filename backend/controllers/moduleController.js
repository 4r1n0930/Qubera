import Module from "../models/Module.js";

export const createModule = async (req, res) => {
  try {
    const { title, description, order, difficulty, estimatedTime } = req.body;

    // Validate required fields
    if (!title || !description || !order || !estimatedTime) {
      return res.status(400).json({
        message: "Title, description, order and estimatedTime are required",
      });
    }

    // Create module
    const module = await Module.create({
      title,
      description,
      order,
      difficulty,
      estimatedTime,
    });

    res.status(201).json({
      message: "Module created successfully",
      module,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create module",
      error: error.message,
    });
  }
};
export const getModules = async (req, res) => {
  try {
    const modules = await Module.find().sort({ order: 1 });

    res.status(200).json({
      message: "Modules fetched successfully",
      modules,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch modules",
      error: error.message,
    });
  }
};