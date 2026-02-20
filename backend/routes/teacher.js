import express from "express";
import db from "../config/db.js";

import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";



/* GET ALL STAFF (Teachers) */
router.get("/staff", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);

    const [rows] = await db.promise().query(
      "SELECT id, full_name, email FROM users WHERE role = 'teacher'"
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching staff" });
  }
});

// GET Form Analytics Stats
router.get("/forms/stats", async (req, res) => {
  try {
    const [forms] = await db.promise().query("SELECT id FROM forms");

    const stats = {};

    for (const form of forms) {
      const formId = form.id;

      const [assignedRows] = await db.promise().query(
        `SELECT COUNT(DISTINCT assigned_to_user_id) as count
         FROM form_assignments
         WHERE form_id = ?`,
        [formId]
      );

      const assigned = assignedRows[0].count;

      const [submittedRows] = await db.promise().query(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM form_submissions
         WHERE form_id = ?`,
        [formId]
      );

      const submitted = submittedRows[0].count;
      const pending = Math.max(0, assigned - submitted);

      stats[formId] = { assigned, submitted, pending };
    }

    res.json(stats);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});




router.get("/assignment-stats", async (req, res) => {
  try {
    const [assignedRows] = await db.promise().query(
      `SELECT COUNT(*) as count FROM form_assignments`
    );

    const [submittedRows] = await db.promise().query(
      `SELECT COUNT(*) as count FROM form_submissions`
    );

    const assigned = assignedRows[0].count;
    const submitted = submittedRows[0].count;
    const pending = Math.max(0, assigned - submitted);

    res.json({
      assigned,
      submitted,
      pending,
    });

  } catch (error) {
    console.error("Assignment stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});


router.get("/responses/count", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT COUNT(*) as count FROM form_submissions`
    );

    res.json({ count: rows[0].count });

  } catch (error) {
    console.error("Response count error:", error);
    res.status(500).json({ message: "Failed to fetch response count" });
  }
});


export default router;
