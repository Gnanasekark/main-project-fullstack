import express from "express";
import db from "../config/db.js";
import jwt from "jsonwebtoken";


import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";



const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const query = `
      SELECT DISTINCT f.*, u.full_name AS sender_name, u.email AS sender_email
      FROM forms f
      LEFT JOIN form_permissions fp ON f.id = fp.form_id
      LEFT JOIN users u ON f.created_by = u.id
      WHERE 
        f.created_by = ?
        OR fp.user_id = ?
      ORDER BY f.created_at DESC
    `;

    db.query(query, [userId, userId], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

 
router.get("/:id/stats", (req, res) => {
  const formId = req.params.id;

  const query = `
  SELECT 
    COUNT(DISTINCT u.id) AS totalAssigned,
    COUNT(DISTINCT fs.user_id) AS submitted
  FROM form_assignments fa
  LEFT JOIN group_memberships gm 
    ON fa.assigned_to_group_id = gm.group_id
  LEFT JOIN users u 
    ON u.id = COALESCE(fa.assigned_to_user_id, gm.user_id)
  LEFT JOIN form_submissions fs
    ON fs.form_id = fa.form_id
    AND fs.user_id = u.id
  WHERE fa.form_id = ?
  `;

  db.query(query, [formId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error" });

    const totalAssigned = result[0].totalAssigned || 0;
    const submitted = result[0].submitted || 0;
    const pending = totalAssigned - submitted;

    res.json({
      totalAssigned,
      submitted,
      pending,
      nearestDueDate: null,
      isOverdue: false,
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

/* REJECT SUBMISSION (Resend Form) */
router.put("/:formId/reject/:userId", (req, res) => {
  const { formId, userId } = req.params;

  const query = `
    UPDATE form_submissions
    SET status = 'rejected'
    WHERE form_id = ? AND user_id = ?
  `;

  db.query(query, [formId, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Reject failed" });
    }

    res.json({ message: "Form resent to student" });
  });
});


router.put("/:id/fields", (req, res) => {
  const formId = req.params.id;
  const { fields } = req.body;

  if (!fields || !Array.isArray(fields)) {
    return res.status(400).json({ message: "Invalid fields data" });
  }

  const config = JSON.stringify({ fields });

  db.query(
"UPDATE forms SET config = ? WHERE id = ?",
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
  u.full_name,
  u.email,
  u.reg_no
FROM form_submissions fs
LEFT JOIN users u ON fs.user_id = u.id
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
      user_id: row.user_id,
      submitted_at: row.submitted_at,
      submission_data: typeof row.submission_data === "string"
        ? JSON.parse(row.submission_data)
        : row.submission_data,
      profile: {
        full_name: row.full_name || "Unknown",
        email: row.email || "-",
        reg_no: row.reg_no || "-",
      },
    }));

    res.json(formatted);
  });
});

/* Students status */
/* Students status (Direct + Group Support) */
router.get("/:id/student-status", (req, res) => {
  const formId = req.params.id;

  const query = `
  SELECT DISTINCT
    u.id,
    u.full_name,
    u.email,
    u.reg_no,
    u.mobile,                 -- ✅ ADD THIS
    fs.submitted_at
  FROM form_assignments fa

  LEFT JOIN group_memberships gm
    ON fa.assigned_to_group_id = gm.group_id

  LEFT JOIN users u
    ON u.id = COALESCE(fa.assigned_to_user_id, gm.user_id)

  LEFT JOIN form_submissions fs
    ON fs.form_id = fa.form_id
    AND fs.user_id = u.id

  WHERE fa.form_id = ?
`;

  db.query(query, [formId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    const formatted = results
    .filter(row => row.id !== null)
    .map(row => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      reg_no: row.reg_no,
      phone: row.mobile, // ADD THIS
      submitted: !!row.submitted_at,
      submitted_at: row.submitted_at || null
    }));

    res.json(formatted);
  });
});





/* GET ASSIGNED GROUPS FOR FORM */

router.get("/:id/assigned-groups", (req, res) => {
  const formId = req.params.id;

  const query = `
    SELECT DISTINCT g.id, g.name
    FROM form_assignments fa
    JOIN \`groups\` g 
      ON g.id = fa.assigned_to_group_id
    WHERE fa.form_id = ?
      AND fa.assigned_to_group_id IS NOT NULL
  `;

  db.query(query, [formId], (err, results) => {
    if (err) {
      console.error("Assigned groups error:", err.sqlMessage);
      return res.status(500).json({ message: err.sqlMessage });
    }

    res.json(results);
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

/* RESEND FORM TO PARTICULAR USER */
router.put("/:id/resend/:userId", (req, res) => {
  const { id, userId } = req.params;

  db.query(
    "DELETE FROM form_submissions WHERE form_id = ? AND user_id = ?",
    [id, userId],
    (err) => {
      if (err) return res.status(500).json({ message: "Error" });

      res.json({ message: "Resent successfully" });
    }
  );
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      original_filename,
      created_by,
      config,
      view_permission,
      assign_permission,
      folder_id,
      assigners,
      viewers,
    } = req.body;

    const [result] = await db.promise().query(
      `INSERT INTO forms 
       (title, description, original_filename, created_by, config, view_permission, assign_permission, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        original_filename,
        created_by,
        JSON.stringify(config),
        view_permission,
        assign_permission,
        folder_id,
      ]
    );

    const formId = result.insertId;

    // Insert assign permissions
    if (assigners && assigners.length > 0) {
      for (let userId of assigners) {
        await db.promise().query(
          `INSERT INTO form_permissions (form_id, user_id, permission_type)
           VALUES (?, ?, 'assign')`,
          [formId, userId]
        );
      }
    }

    // Insert view permissions
    if (viewers && viewers.length > 0) {
      for (let userId of viewers) {
        await db.promise().query(
          `INSERT INTO form_permissions (form_id, user_id, permission_type)
           VALUES (?, ?, 'view')`,
          [formId, userId]
        );
      }
    }

    res.json({ id: formId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});




router.delete("/:id", (req, res) => {
  db.query("DELETE FROM forms WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "Deleted" });
  });
});




router.post("/:id/submit", upload.any(), (req, res) => {
  const formId = req.params.id;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const submissionData = {};

    // Handle text fields
    Object.keys(req.body).forEach(key => {
      submissionData[key] = req.body[key];
    });

    // Handle file fields
    if (req.files) {
      req.files.forEach(file => {
        submissionData[file.fieldname] = file.filename;
      });
    }

    const query = `
      INSERT INTO form_submissions
      (form_id, user_id, submission_data, submitted_at)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(
      query,
      [formId, userId, JSON.stringify(submissionData)],
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

/* REMIND ALL STUDENTS */
router.post("/:id/remind-all", async (req, res) => {
  const formId = req.params.id;
  const { channel } = req.body;

  try {
    // Get all pending students
    const query = `
     SELECT fa.assigned_to_user_id
      FROM form_assignments fa
      LEFT JOIN form_submissions fs 
        ON fa.form_id = fs.form_id 
        AND fa.assigned_to_user_id = fs.user_id
      WHERE fa.form_id = ? 
      AND fs.id IS NULL
    `;

    db.query(query, [formId], (err, students) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (students.length === 0) {
        return res.json({ message: "No pending students" });
      }

      const values = students.map(s => [
        s.assigned_to_user_id,
        "Form Reminder",
        "Please complete your assigned form.",
        channel || "both",
        formId,
        "sent",
        new Date(),
      ]);

      const insertQuery = `
        INSERT INTO notifications
        (user_id, title, message, channel, related_form_id, status, sent_at)
        VALUES ?
      `;

      db.query(insertQuery, [values], (err2) => {
        if (err2) return res.status(500).json({ message: "Insert error" });

        res.json({ message: "Reminders sent successfully" });
      });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 