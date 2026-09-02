import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from 'node:dns';
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});