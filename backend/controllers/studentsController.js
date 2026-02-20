import db from "../config/db.js";



export const getStudents = (req, res) => {
  const sql = "SELECT * FROM students";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

export const addStudent = (req, res) => {
  const { name, roll_no, class_name } = req.body;
  const sql =
    "INSERT INTO students (name, roll_no, class_name) VALUES (?, ?, ?)";

  db.query(sql, [name, roll_no, class_name], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student added successfully" });
  });
};




export const getStudentForms = (req, res) => {
  const { userId } = req.params;
  console.log("User ID:", userId);
console.log("Assignments:", assignments);


  // 1️⃣ Get group memberships
  db.query(
    "SELECT group_id FROM group_memberships WHERE user_id = ?",
    [userId],
    (err, memberships) => {
      if (err) return res.status(500).json({ message: "DB error" });

      const groupIds = memberships.map(m => m.group_id);

      // 2️⃣ Get assignments
      let assignmentQuery = `
      SELECT DISTINCT fa.id, fa.form_id, fa.due_date, f.title, f.description
      FROM form_assignments fa
      JOIN forms f ON fa.form_id = f.id
      LEFT JOIN group_memberships gm ON gm.group_id = fa.assigned_to_group_id
      WHERE fa.assigned_to_user_id = ?
      OR gm.user_id = ?
    `;
    
      if (groupIds.length > 0) {
        assignmentQuery += ` OR fa.assigned_to_group_id IN (${groupIds.map(() => "?").join(",")})`;
      }

      const params = groupIds.length > 0 ? [userId, ...groupIds] : [userId];

      db.query(assignmentQuery, params, (err, assignments) => {
        if (err) return res.status(500).json({ message: "DB error" });

        // 3️⃣ Get submissions
        db.query(
          "SELECT form_id, submitted_at FROM form_submissions WHERE user_id = ?",
          [userId],
          (err, submissions) => {
            if (err) return res.status(500).json({ message: "DB error" });

            const submissionMap = {};
            submissions.forEach(s => {
              submissionMap[s.form_id] = s.submitted_at;
            });

            let pending = 0, completed = 0, overdue = 0;
            const now = new Date();

            const forms = assignments.map(a => {
              const isSubmitted = !!submissionMap[a.form_id];
              const submittedAt = submissionMap[a.form_id] || null;
              const dueDate = a.due_date ? new Date(a.due_date) : null;

              if (isSubmitted) {
                completed++;
              } else if (dueDate && dueDate < now) {
                overdue++;
              } else {
                pending++;
              }

              return {
                id: a.id,
                form_id: a.form_id,
                title: a.title,
                description: a.description,
                due_date: a.due_date,
                is_submitted: isSubmitted,
                submitted_at: submittedAt,
              };
            });

            // Remove duplicates
            const uniqueForms = [];
            const seen = new Set();

            forms.forEach(f => {
              if (!seen.has(f.form_id)) {
                seen.add(f.form_id);
                uniqueForms.push(f);
              }
            });

            res.json({
              forms: uniqueForms,
              stats: { pending, completed, overdue }
            });
          }
        );
      });
    }
  );
};
