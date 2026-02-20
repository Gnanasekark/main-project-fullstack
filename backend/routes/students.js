import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.get("/:userId/assigned-forms", (req, res) => {
  const userId = req.params.userId;

  // Get group memberships
  db.query(
    "SELECT group_id FROM group_memberships WHERE user_id = ?",
    [userId],
    (err, memberships) => {
      if (err) return res.status(500).json(err);

      const groupIds = memberships.map(m => m.group_id);

      // Build assignment query
      let query = `
      SELECT DISTINCT 
        fa.id, 
        fa.form_id, 
        fa.due_date, 
        f.title, 
        f.description,
    
        u.full_name AS sender_name,
        u.email AS sender_email
    
      FROM form_assignments fa
      JOIN forms f ON f.id = fa.form_id
      JOIN users u ON u.id = f.created_by   -- 🔥 IMPORTANT
    
      WHERE (
        fa.assigned_to_user_id = ?
    `;

if (groupIds.length > 0) {
  query += ` OR fa.assigned_to_group_id IN (${groupIds.map(() => "?").join(",")})`;
}

query += `)`;
    

      db.query(query, [userId, ...groupIds], (err2, assignments) => {
        if (err2) return res.status(500).json(err2);

        if (assignments.length === 0) {
          return res.json({
            forms: [],
            stats: { pending: 0, completed: 0, overdue: 0 }
          });
        }

        // Get submissions
        db.query(
          "SELECT form_id, submitted_at FROM form_submissions WHERE user_id = ?",
          [userId],
          (err3, submissions) => {
            if (err3) return res.status(500).json(err3);

            const submissionMap = new Map();
            submissions.forEach(s => {
              submissionMap.set(s.form_id, s.submitted_at);
            });

            const now = new Date();
            let pending = 0;
            let completed = 0;
            let overdue = 0;

            const forms = assignments.map(a => {
              const isSubmitted = submissionMap.has(a.form_id);
              const submittedAt = submissionMap.get(a.form_id) || null;
              const dueDate = a.due_date ? new Date(a.due_date) : null;

              if (isSubmitted) completed++;
              else if (dueDate && dueDate < now) overdue++;
              else pending++;

              return {
                id: a.id,
                form_id: a.form_id,
                title: a.title,
                description: a.description,
                due_date: a.due_date,
                is_submitted: isSubmitted,
                submitted_at: submittedAt,
              
                sender_name: a.sender_name,
                sender_email: a.sender_email,
              };
            });

            // Remove duplicate forms
            const unique = [];
            const seen = new Set();
            for (let f of forms) {
              if (!seen.has(f.form_id)) {
                seen.add(f.form_id);
                unique.push(f);
              }
            }

            res.json({
              forms: unique,
              stats: { pending, completed, overdue }
            });
          }
        );
      });
    }
  );
});

export default router;
