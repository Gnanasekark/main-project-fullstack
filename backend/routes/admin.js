import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const [users] = await db.promise().query("SELECT COUNT(*) as count FROM users");
    const [students] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role='student'");
    const [teachers] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role='teacher'");
    const [admins] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role='admin'");
    const [groups] = await db.promise().query("SELECT COUNT(*) as count FROM `groups`");
    const [forms] = await db.promise().query("SELECT COUNT(*) as count FROM forms");

    const [recentUsers] = await db.promise().query(`
      SELECT id, email, full_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      stats: {
        totalUsers: users[0].count,
        students: students[0].count,
        teachers: teachers[0].count,
        admins: admins[0].count,
        groups: groups[0].count,
        forms: forms[0].count,
      },
      users: recentUsers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/students-master", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id, full_name, email, mobile, reg_no, degree, branch, year, section
       FROM students_master
       ORDER BY reg_no ASC`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students master" });
  }
});

export default router;