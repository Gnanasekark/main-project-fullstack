import express from "express";
import db from "../db.js";

const router = express.Router();

/* ================= GET ALL GROUPS ================= */

router.get("/", (req, res) => {
  db.query(
    `
    SELECT g.*, COUNT(gm.user_id) AS member_count
    FROM \`groups\` g
    LEFT JOIN group_memberships gm ON g.id = gm.group_id
    GROUP BY g.id
    ORDER BY g.name
    `,
    (err, rows) => {
      if (err) {
        console.log("GET GROUPS ERROR:", err);
        return res.status(500).json({ message: "Error" });
      }
      res.json(rows);
    }
  );
});

/* ================= CREATE GROUP ================= */

router.post("/", (req, res) => {
  console.log("BODY RECEIVED:", req.body);

  const { name, description, degree, branch, year, section } = req.body;

  db.query(
    `
    INSERT INTO \`groups\`
    (name, description, degree, branch, year, section)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      description || null,
      degree || null,
      branch || null,
      year || null,
      section || null,
    ],
    (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ message: "Insert failed", error: err });
      }

      console.log("INSERT SUCCESS");
      res.json({ message: "Created" });
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
    `
    SELECT s.*
    FROM group_memberships gm
    JOIN students s ON gm.user_id = s.id
    WHERE gm.group_id=?
    `,
    [id],
    (err, rows) => {
      if (err) {
        console.log("MEMBERS ERROR:", err);
        return res.status(500).json({ message: "Error" });
      }
      res.json(rows);
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
