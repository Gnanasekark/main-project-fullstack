import express from "express";
import db from "../config/db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let totalQuery;
    let readQuery;
    let params = [];

    // 🎓 STUDENT
    if (role === "student") {
      totalQuery = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ?";
      readQuery = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 1";
      params = [userId];
    }

    // 👨‍🏫 TEACHER
    else if (role === "teacher") {
      totalQuery = "SELECT COUNT(*) as count FROM notifications WHERE created_by = ?";
      readQuery = "SELECT COUNT(*) as count FROM notifications WHERE created_by = ? AND is_read = 1";
      params = [userId];
    }

    // 👑 ADMIN (SEE ALL)
    else if (role === "admin") {
      totalQuery = "SELECT COUNT(*) as count FROM notifications";
      readQuery = "SELECT COUNT(*) as count FROM notifications WHERE is_read = 1";
      params = [];
    }

    const [totalRows] = await db.promise().query(totalQuery, params);
    const [readRows] = await db.promise().query(readQuery, params);

    const total = totalRows[0].count;
    const read = readRows[0].count;
    const unread = total - read;

    res.json({
      total,
      read,
      unread,
      successRate: total > 0 ? Math.round((read / total) * 100) : 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Analytics error" });
  }
});

export default router;