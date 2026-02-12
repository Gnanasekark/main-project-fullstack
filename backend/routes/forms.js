import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM forms ORDER BY created_at DESC",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});



/* GET SINGLE FORM BY ID */
router.get("/:id", (req, res) => {
  const formId = req.params.id;

  db.query(
    "SELECT * FROM forms WHERE id = ?",
    [formId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error" });

      if (result.length === 0) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.json(result[0]);
    }
  );
});





router.get("/:id/student-status",  (req, res) => {
  const formId = req.params.id;

  try {
    // Get assignments
    db.query(
      "SELECT assigned_to_user_id, assigned_to_group_id FROM form_assignments WHERE form_id = ?",
      [formId],
      (err, assignments) => {
        if (err) return res.status(500).json({ message: "Error" });

        const directUserIds = assignments
          .filter(a => a.assigned_to_user_id)
          .map(a => a.assigned_to_user_id);

        const groupIds = assignments
          .filter(a => a.assigned_to_group_id)
          .map(a => a.assigned_to_group_id);

        if (groupIds.length > 0) {
          db.query(
            "SELECT user_id FROM group_memberships WHERE group_id IN (?)",
            [groupIds],
            (err2, memberships) => {
              if (err2) return res.status(500).json({ message: "Error" });

              const groupMemberIds = memberships.map(m => m.user_id);
              const allUserIds = [...new Set([...directUserIds, ...groupMemberIds])];

              fetchProfilesAndSubmissions(allUserIds);
            }
          );
        } else {
          const allUserIds = [...new Set(directUserIds)];
          fetchProfilesAndSubmissions(allUserIds);
        }

        function fetchProfilesAndSubmissions(userIds) {
          if (userIds.length === 0) return res.json([]);

          db.query(
            "SELECT id, full_name, email, reg_no FROM profiles WHERE id IN (?)",
            [userIds],
            (err3, profiles) => {
              if (err3) return res.status(500).json({ message: "Error" });

              db.query(
                "SELECT user_id, submitted_at, submission_data FROM form_submissions WHERE form_id = ?",
                [formId],
                (err4, submissions) => {
                  if (err4) return res.status(500).json({ message: "Error" });

                  const submissionMap = new Map(
                    submissions.map(s => [s.user_id, s])
                  );

                  const result = profiles.map(p => {
                    const sub = submissionMap.get(p.id);
                    return {
                      id: p.id,
                      full_name: p.full_name,
                      email: p.email,
                      reg_no: p.reg_no,
                      submitted: !!sub,
                      submitted_at: sub?.submitted_at || null,
                      submission_data: sub?.submission_data || null,
                    };
                  });

                  res.json(result);
                }
              );
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/:id/stats", (req, res) => {
  const formId = req.params.id;

  const submissionQuery = `
    SELECT COUNT(*) AS submitted
    FROM form_submissions
    WHERE form_id = ?
  `;

  const assignmentQuery = `
    SELECT assigned_to_user_id, assigned_to_group_id, due_date
    FROM form_assignments
    WHERE form_id = ?
  `;

  db.query(submissionQuery, [formId], (err1, submissionResult) => {
    if (err1) return res.status(500).json({ message: "Error" });

    const submitted = submissionResult[0].submitted;

    db.query(assignmentQuery, [formId], (err2, assignments) => {
      if (err2) return res.status(500).json({ message: "Error" });

      let totalAssigned = 0;
      let groupIds = [];

      assignments.forEach(a => {
        if (a.assigned_to_user_id) totalAssigned++;
        if (a.assigned_to_group_id) groupIds.push(a.assigned_to_group_id);
      });

      if (groupIds.length === 0) {
        return sendResponse();
      }

      db.query(
        `SELECT COUNT(*) AS count FROM group_memberships WHERE group_id IN (?)`,
        [groupIds],
        (err3, groupResult) => {
          if (!err3) {
            totalAssigned += groupResult[0].count;
          }
          sendResponse();
        }
      );

      function sendResponse() {
        const pending = Math.max(0, totalAssigned - submitted);

        const dueDates = assignments
          .filter(a => a.due_date)
          .map(a => new Date(a.due_date))
          .sort((a, b) => a - b);

        const nearestDueDate =
          dueDates.length > 0 ? dueDates[0].toISOString() : null;

        const isOverdue =
          nearestDueDate ? new Date(nearestDueDate) < new Date() : false;

        res.json({
          totalAssigned,
          submitted,
          pending,
          nearestDueDate,
          isOverdue,
        });
      }
    });
  });
});


/* GET SINGLE FORM */
router.get("/:id", (req, res) => {
  const formId = req.params.id;

  db.query(
    "SELECT * FROM forms WHERE id = ?",
    [formId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch form" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Form not found" });
      }

      const form = results[0];

      // 🔥 IMPORTANT: Parse config JSON
      form.config =
        typeof form.config === "string"
          ? JSON.parse(form.config)
          : form.config;

      res.json(form);
    }
  );
});



router.put("/:id/fields", (req, res) => {
  const formId = req.params.id;
  const { fields } = req.body;

  if (!fields || !Array.isArray(fields)) {
    return res.status(400).json({ message: "Invalid fields data" });
  }

  const config = JSON.stringify({ fields });

  db.query(
    "UPDATE forms SET config = ?, updated_at = NOW() WHERE id = ?",
    [config, formId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Update failed" });
      }

      res.json({ message: "Fields updated" });
    }
  );
});



router.get("/:id/responses", (req, res) => {
  const formId = req.params.id;

  const query = `
    SELECT 
      fs.id,
      fs.submitted_at,
      fs.submission_data,
      fs.user_id,
      p.full_name,
      p.email,
      p.reg_no
    FROM form_submissions fs
    LEFT JOIN profiles p ON fs.user_id = p.id
    WHERE fs.form_id = ?
    ORDER BY fs.submitted_at DESC
  `;

  db.query(query, [formId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch responses" });
    }

    const formatted = results.map(row => ({
      id: row.id,
      submitted_at: row.submitted_at,
      submission_data:
        typeof row.submission_data === "string"
          ? JSON.parse(row.submission_data)
          : row.submission_data,
      user_id: row.user_id,
      profile: {
        full_name: row.full_name,
        email: row.email,
        reg_no: row.reg_no,
      },
    }));

    res.json(formatted);
  });
});

/* CHECK IF STUDENT ALREADY SUBMITTED */
router.get("/:id/submission-status/:userId", (req, res) => {
  const formId = req.params.id;
  const userId = req.params.userId;

  db.query(
    "SELECT id FROM form_submissions WHERE form_id = ? AND user_id = ?",
    [formId, userId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error" });
      }

      res.json({
        submitted: result.length > 0
      });
    }
  );
});




router.post("/", (req, res) => {
  const {
    title,
    description,
    original_filename,
    created_by,
    config
  } = req.body;

  const query = `
    INSERT INTO forms 
    (title, description, original_filename, created_by, config, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, NOW())
  `;

  db.query(
    query,
    [
      title,
      description,
      original_filename,
      created_by,
      JSON.stringify(config),
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Insert failed" });
      }

      res.json({
        id: result.insertId,
        title,
      });
    }
  );
});





router.delete("/:id", (req, res) => {
  db.query("DELETE FROM forms WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "Deleted" });
  });
});
router.post("/:id/submit", (req, res) => {
  const formId = req.params.id;
  const { submission_data } = req.body;

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.id;

    const query = `
      INSERT INTO form_submissions
      (form_id, user_id, submission_data, submitted_at)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(
      query,
      [formId, userId, JSON.stringify(submission_data)],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Submission failed" });
        }

        res.json({ message: "Submitted successfully" });
      }
    );

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
});


export default router;  