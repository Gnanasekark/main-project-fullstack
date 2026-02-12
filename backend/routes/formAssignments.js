import express from "express";
import db from "../db.js";

const router = express.Router();

/* ================= ASSIGN FORM ================= */

router.post("/", (req, res) => {
  const assignments = req.body;

  if (!Array.isArray(assignments)) {
    return res.status(400).json({ message: "Invalid data" });
  }
  const values = assignments.map(a => [
    a.form_id,
    a.assigned_by,
    a.assigned_to_group_id || null,  // goes to group_id
    a.assigned_to_user_id || null,   // goes to student_id
    a.due_date || null,
    a.reminder_interval_hours || null,
    a.reminder_trigger_time || null
  ]);
  

  db.query(
    `INSERT INTO form_assignments
(form_id, assigned_by, group_id, student_id, due_date, reminder_interval_hours, reminder_time)

    VALUES ?`,
    [values],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Insert failed" });
      }
      res.json({ message: "Assigned successfully" });
    }
  );
});

export default router;
