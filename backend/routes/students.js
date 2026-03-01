import express from "express";
import db from "../config/db.js";
import multer from "multer";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";
const router = express.Router();
const upload = multer({ dest: "uploads/" });



/* ================= UPLOAD STUDENTS EXCEL ================= */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });


    for (const row of data) {
    
      const regNo = row["Registration no"] || "";
      const email = row["Email"] || "";
    
      if (!email || !regNo) continue;
    
      // 🔐 Password = registration number
      const hashedPassword = await bcrypt.hash(regNo, 10);
    
      // 1️⃣ Insert into users table WITH PASSWORD
      const [result] = await db.promise().query(
        `INSERT INTO users
         (full_name, email, password, mobile, reg_no, degree, branch, year, section, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'student')
         ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         mobile = VALUES(mobile),
         degree = VALUES(degree),
         branch = VALUES(branch),
         year = VALUES(year),
         section = VALUES(section)`,
         [
          row["Name"] || "",
          row["Email"] || "",
          row["Mobile"] || "",
          row["Reg No"] || "",
          row["Degree"] || "",
          row["Branch"] || "",
          row["Year"] || "",
          row["Section"] || "",
        ]
      );
    
      // 🔥 VERY IMPORTANT FIX
      let userId = result.insertId;
    
      // If duplicate email → fetch existing user id
      if (!userId) {
        const [existing] = await db.promise().query(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );
        userId = existing[0].id;
      }
    
     // After insert/update → get correct user ID
const [userRow] = await db.promise().query(
  "SELECT id FROM users WHERE email = ?",
  [row["Email"]]
);


if (req.body.groupId && userId) {
  await db.promise().query(
    `INSERT IGNORE INTO group_memberships (group_id, user_id)
     VALUES (?, ?)`,
    [req.body.groupId, userId]
  );
}
    }
    res.json({ message: "Students uploaded successfully" });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);  // 👈 important
    res.status(500).json({ message: "Upload failed" });
  }
});


/* ================= PREFILL STUDENT DETAILS ================= */
router.get("/prefill/:regNo", async (req, res) => {
  try {
    const { regNo } = req.params;

    const [rows] = await db.promise().query(
      `SELECT full_name, email, mobile, reg_no, degree, branch, year, section 
       FROM students_master 
       WHERE reg_no = ?`,
      [regNo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Prefill error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ASSIGNED FORMS ================= */
router.get("/:userId/assigned-forms", (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT group_id FROM group_memberships WHERE user_id = ?",
    [userId],
    (err, memberships) => {
      if (err) return res.status(500).json(err);

      const groupIds = memberships.map(m => m.group_id);

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
        JOIN users u ON u.id = f.created_by
        WHERE (fa.assigned_to_user_id = ?
      `;

      if (groupIds.length > 0) {
        query += ` OR fa.assigned_to_group_id IN (${groupIds.map(() => "?").join(",")})`;
      }

      query += `)`;

      db.query(query, [userId, ...groupIds], (err2, assignments) => {
        if (err2) return res.status(500).json(err2);

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

            const unique = [];
            const seen = new Set();

            assignments.forEach(a => {
              if (seen.has(a.form_id)) return;
              seen.add(a.form_id);

              const isSubmitted = submissionMap.has(a.form_id);
              const submittedAt = submissionMap.get(a.form_id) || null;
              const dueDate = a.due_date ? new Date(a.due_date) : null;

              if (isSubmitted) completed++;
              else if (dueDate && dueDate < now) overdue++;
              else pending++;

              unique.push({
                id: a.id,
                form_id: a.form_id,
                title: a.title,
                description: a.description,
                due_date: a.due_date,
                is_submitted: isSubmitted,
                submitted_at: submittedAt,
                sender_name: a.sender_name,
                sender_email: a.sender_email,
              });
            });

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


// UPDATE STUDENT
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      mobile,
      degree,
      branch,
      year,
      section,
    } = req.body;

    await db.promise().query(
      `
      UPDATE users
      SET full_name=?, email=?, mobile=?, degree=?, branch=?, year=?, section=?
      WHERE id=?
      `,
      [
        full_name,
        email,
        mobile,
        degree,
        branch,
        year,
        section,
        id,
      ]
    );

    res.json({ message: "Student updated" });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

  // ✅ GET ALL STUDENTS (FIXED LOCATION)
  /* ================= GET ALL STUDENTS (FULL DATA) ================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        id,
        full_name,
        email,
        mobile,
        reg_no,
        degree,
        branch,
        year,
        section
      FROM users
      WHERE role = 'student'
      ORDER BY reg_no ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET STUDENTS ERROR:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});


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


  /* ================= DELETE STUDENT ================= */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // First delete from group_memberships
    await db.promise().query(
      "DELETE FROM group_memberships WHERE user_id = ?",
      [id]
    );

    // Then delete from users table
    const [result] = await db.promise().query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

  export default router;
