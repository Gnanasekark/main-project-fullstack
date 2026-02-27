import express from "express";
import db from "../config/db.js";
import multer from "multer";
import xlsx from "xlsx";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* ================= GET ALL STUDENTS ================= */
router.get("/", (req, res) => {
  db.query(
    `SELECT u.id, u.full_name, u.email
     FROM users u
     JOIN students s ON s.user_id = u.id`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ================= UPLOAD STUDENTS EXCEL ================= */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
      header: 0,
    });

    for (const row of data) {
      await db.promise().query(
        `INSERT INTO students_master 
        (full_name, email, mobile, reg_no, degree, branch, year, section)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row["Full Name"],
          row["Email"],
          row["Mobile Number(for Whatsapp)"],
          row["Registration No"],
          row["Degree"],
          row["Branch"],
          row["Year"],
          row["Section"],
        ]
      );
    }

    res.json({ message: "Students uploaded successfully" });

  } catch (err) {
    console.log(err);
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



  // ✅ GET ALL STUDENTS (FIXED LOCATION)
  router.get("/", (req, res) => {
    db.query(
      `SELECT u.id, u.full_name, u.email
      FROM users u
      JOIN students s ON s.user_id = u.id`,
      (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      }
    );
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

  export default router;
