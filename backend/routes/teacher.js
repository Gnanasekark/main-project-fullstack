import express from "express";
import db from "../db.js";

const router = express.Router();

// GET Form Analytics Stats
router.get("/forms/stats", (req, res) => {

  db.query("SELECT * FROM forms", (err, forms) => {
    if (err) {
      console.error("Error fetching forms:", err);
      return res.status(500).json({ error: "Failed to fetch forms" });
    }

    const stats = {};
    let completed = 0;

    if (forms.length === 0) {
      return res.json(stats);
    }

    forms.forEach((form) => {
      const formId = form.id;

      db.query(
        `SELECT assigned_to_user_id, assigned_to_group_id 
         FROM form_assignments 
         WHERE form_id = ?`,
        [formId],
        (err1, assignments) => {
          if (err1) return;

          let assigned = 0;

          const directUsers = assignments.filter(a => a.assigned_to_user_id);
          assigned += directUsers.length;

          const groupIds = assignments
            .filter(a => a.assigned_to_group_id)
            .map(a => a.assigned_to_group_id);

          const handleSubmissions = (assignedCount) => {
            db.query(
              `SELECT COUNT(*) as count 
               FROM form_submissions 
               WHERE form_id = ?`,
              [formId],
              (err3, submissions) => {
                if (err3) return;

                const submitted = submissions[0].count;
                const pending = Math.max(0, assignedCount - submitted);

                stats[formId] = {
                  assigned: assignedCount,
                  submitted,
                  pending,
                };

                completed++;
                if (completed === forms.length) {
                  res.json(stats);
                }
              }
            );
          };

          if (groupIds.length > 0) {
            db.query(
              `SELECT COUNT(*) as count 
               FROM group_memberships 
               WHERE group_id IN (?)`,
              [groupIds],
              (err2, groupMembers) => {
                if (!err2) {
                  assigned += groupMembers[0].count;
                }
                handleSubmissions(assigned);
              }
            );
          } else {
            handleSubmissions(assigned);
          }
        }
      );
    });

  });
});




router.get("/assignment-stats", (req, res) => {
  res.json({ assigned: 0, submitted: 0 });
});

router.get("/responses/count", (req, res) => {
  res.json({ count: 0 });
});
router.get("/forms", (req, res) => {
  db.query("SELECT * FROM forms ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});


export default router;
