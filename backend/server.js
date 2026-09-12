import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from 'node:dns';
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import conversionRoutes from "./routes/conversionRoutes.js";
import quantumRoutes from "./routes/quantumRoutes.js";
import tutorRoutes from "./tutor/routes/tutorRoutes.js";
import progressRoutes from "./routes/progressRouter.js";

dotenv.config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

// Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/conversion", conversionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api", quantumRoutes);
app.use("/api", tutorRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});