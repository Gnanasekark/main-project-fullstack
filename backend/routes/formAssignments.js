import express from "express";
import db from "../config/db.js";

import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;





/* ================= CREATE FORM ASSIGNMENTS ================= */
router.post("/", async (req, res) => {
  try {
    const assignments = req.body;

    for (const item of assignments) {
      const {
        form_id,
        assigned_by,
        assigned_to_group_id,
        assigned_to_user_id,
        due_date,
        reminder_interval_hours,
        reminder_trigger_time,
      } = item;

      if (assigned_to_group_id) {
        const [students] = await db.promise().query(
          `SELECT user_id FROM group_memberships WHERE group_id = ?`,
          [assigned_to_group_id]
        );

        for (const student of students) {
          await db.promise().query(
            `INSERT INTO form_assignments
            (form_id, assigned_by, assigned_to_user_id, assigned_to_group_id, due_date, reminder_interval_hours, reminder_trigger_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              form_id,
              assigned_by,
              student.user_id,
              assigned_to_group_id,
              due_date,
              reminder_interval_hours,
              reminder_trigger_time,
            ]
          );
        }
      }

      if (assigned_to_user_id) {
        await db.promise().query(
          `INSERT INTO form_assignments
          (form_id, assigned_by, assigned_to_user_id, assigned_to_group_id, due_date, reminder_interval_hours, reminder_trigger_time)
          VALUES (?, ?, ?, NULL, ?, ?, ?)`,
          [
            form_id,
            assigned_by,
            assigned_to_user_id,
            due_date,
            reminder_interval_hours,
            reminder_trigger_time,
          ]
        );
      }
    }

    res.json({ message: "Assigned successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Assignment failed" });
  }
});


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





export default router;
