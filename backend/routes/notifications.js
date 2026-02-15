import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ========================= */
/* GET SENT BY CURRENT USER  */
/* ========================= */
router.get("/", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    db.query(
      `SELECT * FROM notifications 
       WHERE created_by = ? 
       ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(rows);
      }
    );
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});


/* ========================= */
/* GET USER NOTIFICATIONS    */
/* ========================= */
router.get("/user/:id", (req, res) => {
  db.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(results);
    }
  );
});


/* ========================= */
/* BULK REMINDER (FIXED)     */
/* ========================= */
router.post("/bulk", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const senderId = decoded.id;

    const { user_ids, title, message, form_id } = req.body;

    if (!user_ids || user_ids.length === 0) {
      return res.status(400).json({ message: "No recipients selected" });
    }

    const values = user_ids.map(id => [
      id,
      title,
      message,
      "both",
      form_id || null,
      "sent",
      senderId,
      new Date()
    ]);

    const sql = `
      INSERT INTO notifications
      (user_id, title, message, channel, related_form_id, status, created_by, created_at)
      VALUES ?
    `;

    db.query(sql, [values], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      res.json({ message: "Bulk notifications sent" });
    });

  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});


/* ========================= */
/* SEND SINGLE / CUSTOM      */
/* ========================= */
router.post("/", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { user_ids, title, message, channel } = req.body;

    const values = user_ids.map((uid) => [
      uid,
      title,
      message,
      channel,
      "sent",
      userId,
      new Date(),
    ]);

    const insertQuery = `
      INSERT INTO notifications 
      (user_id, title, message, channel, status, created_by, created_at)
      VALUES ?
    `;

    db.query(insertQuery, [values], (err) => {
      if (err) return res.status(500).json({ message: "Insert error" });
      res.json({ message: "Notification sent" });
    });

  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});


/* ========================= */
/* MARK READ                 */
/* ========================= */
router.put("/read/:id", (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = true WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ message: "Marked as read" });
    }
  );
});


/* ========================= */
/* STATS BY FORM             */
/* ========================= */
router.get("/stats/:formId", (req, res) => {
  const { formId } = req.params;

  db.query(
    `SELECT channel, COUNT(*) as count
     FROM notifications
     WHERE related_form_id = ?
     GROUP BY channel`,
    [formId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Error" });
      res.json(results);
    }
  );
});

export default router;
