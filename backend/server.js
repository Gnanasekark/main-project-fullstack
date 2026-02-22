import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import http from "http";   // ✅ ADD THIS
import { Server } from "socket.io";

// routes imports...
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
import notificationAnalytics from "./routes/notificationAnalytics.js";


dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));

app.use(
  session({
    name: "formflow.sid",
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);




app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ROUTES
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/circulars", circularRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/form-assignments", formAssignmentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/folders", folderRoutes);

app.use("/api/notificationAnalytics", notificationAnalytics);

// ✅ CREATE HTTP SERVER (NOT app.listen)
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});

global.io = io;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});



// ✅ USE server.listen (NOT app.listen)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});