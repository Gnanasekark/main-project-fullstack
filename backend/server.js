import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import studentRoutes from "./routes/students.js";
import dashboardRoutes from "./routes/dashboard.js";
import fileRoutes from "./routes/files.js";
import circularRoutes from "./routes/circulars.js";
import authRoutes from "./routes/auth.js";
import teacherRoutes from "./routes/teacher.js";
import formRoutes from "./routes/forms.js";
import groupRoutes from "./routes/groups.js";
import formAssignmentsRoutes from "./routes/formAssignments.js";
import notificationsRoutes from "./routes/notifications.js";
import folderRoutes from "./routes/folders.js";





dotenv.config();

const app = express();

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));

// ✅ SESSION MIDDLEWARE (MUST be before routes)
app.use(
  session({
    name: "formflow.sid",
    secret: "super-secret-key", // change later
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true only in HTTPS
      sameSite: "lax",
    },
  })
);

// ROUTES
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/files", fileRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/circulars", circularRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/form-assignments", formAssignmentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/folders", folderRoutes);
app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
