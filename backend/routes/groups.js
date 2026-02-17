import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* ================= GET ALL GROUPS ================= */

router.get("/", (req, res) => {
  const query = `
    SELECT 
      g.*,
      (
        SELECT COUNT(*)
        FROM users u
        WHERE u.role = 'student'
        AND u.degree = g.degree
        AND u.branch = g.branch
        AND u.year = g.year
        AND u.section = g.section
      ) AS member_count
    FROM \`groups\` g
    ORDER BY g.name
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.log("GET GROUPS ERROR:", err);
      return res.status(500).json({ message: "Error" });
    }

    res.json(rows);
  });
});





router.get("/:groupId/students", (req, res) => {
  const { groupId } = req.params;

  const query = `
    SELECT u.id, u.full_name, u.reg_no, u.email
    FROM group_memberships gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `;

  db.query(query, [groupId], (err, results) => {
    if (err) {
      console.error("Group students error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});


/* ================= CREATE GROUP ================= */

router.post("/", (req, res) => {
  const { name, description, degree, branch, year, section } = req.body;

  // Step 1: Create group
  db.query(
    `
    INSERT INTO \`groups\`
    (name, description, degree, branch, year, section)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, description || null, degree, branch, year, section],
    (err, result) => {
      if (err) {
          // Duplicate error code
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "Group already exists for this Degree, Branch, Year and Section",
            });
          }
        console.log("CREATE GROUP ERROR:", err);
        return res.status(500).json({ message: "Insert failed" });
      }

      const newGroupId = result.insertId;

      // Step 2: Auto assign students
      db.query(
        `
        INSERT INTO group_memberships (group_id, user_id)
        SELECT ?, id
        FROM users
        WHERE role = 'student'
        AND TRIM(LOWER(degree)) = TRIM(LOWER(?))
        AND TRIM(LOWER(branch)) = TRIM(LOWER(?))
        AND TRIM(year) = TRIM(?)
        AND TRIM(LOWER(section)) = TRIM(LOWER(?))
        `,
        [newGroupId, degree, branch, year, section],
        (err2) => {
      
      
          if (err2) {
            console.log("AUTO ASSIGN ERROR:", err2);
            return res.status(500).json({ message: "Group created but student assignment failed" });
          }

          res.json({ message: "Group created and students auto assigned" });
        }
      );
    }
  );
});


/* ================= UPDATE GROUP ================= */

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, degree, branch, year, section } = req.body;

  db.query(
    `
    UPDATE \`groups\`
    SET name=?, description=?, degree=?, branch=?, year=?, section=?
    WHERE id=?
    `,
    [name, description, degree, branch, year, section, id],
    (err) => {
      if (err) {
        console.log("UPDATE ERROR:", err);
        return res.status(500).json({ message: "Update failed" });
      }
      res.json({ message: "Updated" });
    }
  );
});

/* ================= DELETE GROUP ================= */

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM group_memberships WHERE group_id=?", [id]);

  db.query("DELETE FROM `groups` WHERE id=?", [id], (err) => {
    if (err) {
      console.log("DELETE ERROR:", err);
      return res.status(500).json({ message: "Delete failed" });
    }
    res.json({ message: "Deleted" });
  });
});

/* ================= GET GROUP MEMBERS ================= */

router.get("/:id/members", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT degree, branch, year, section FROM `groups` WHERE id=?",
    [id],
    (err, groupRows) => {
      if (err || groupRows.length === 0) {
        return res.status(500).json({ message: "Group not found" });
      }

      const group = groupRows[0];

      db.query(
        `
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
        WHERE role='student'
        AND degree=?
        AND branch=?
       AND TRIM(year)=TRIM(?)

        AND section=?
        `,
        [group.degree, group.branch, group.year, group.section],
        (err2, students) => {
          if (err2) {
            return res.status(500).json({ message: "Error fetching students" });
          }

          res.json(students);
        }
      );
    }
  );
});



/* ================= SAVE MEMBERS ================= */

router.post("/:id/members", (req, res) => {
  const { id } = req.params;
  const { members } = req.body;

  db.query("DELETE FROM group_memberships WHERE group_id=?", [id]);

  if (!members || !members.length) {
    return res.json({ message: "Updated" });
  }

  const values = members.map(userId => [id, userId]);

  db.query(
    "INSERT INTO group_memberships (group_id, user_id) VALUES ?",
    [values],
    (err) => {
      if (err) {
        console.log("INSERT MEMBERS ERROR:", err);
        return res.status(500).json({ message: "Insert failed" });
      }
      res.json({ message: "Updated" });
    }
  );
});

export default router;
