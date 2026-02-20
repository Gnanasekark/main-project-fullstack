import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* REGISTER */
router.post("/register", async (req, res) => {
  const { email, password, role, userData } = req.body;

  if (!email || !password || !role || !userData?.full_name) {
    return res.status(400).json({ message: "All fields required" });
  }

  // ✅ Gmail only validation
if (!email.endsWith("@gmail.com")) {
  return res.status(400).json({
    message: "Only @gmail.com email addresses are allowed"
  });
}

// ✅ 10 digit mobile validation
if (!/^\d{10}$/.test(userData.mobile_number)) {
  return res.status(400).json({
    message: "Mobile number must be exactly 10 digits"
  });
}


  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users
      (full_name, email, password, role, mobile, reg_no, degree, branch, year, section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        userData.full_name,
        email,
        hashedPassword,
        role,
        userData.mobile_number || null,
        userData.reg_no || null,
        userData.degree || null,
        userData.branch || null,
        userData.year || null,
        userData.section || null,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: "Email already exists" });
        }

        const userId = result.insertId;

        // AUTO ADD STUDENT TO GROUP
        if (role === "student") {
          const findGroupSql = `
            SELECT id FROM groups
            WHERE degree = ?
            AND branch = ?
            AND year = ?
            AND section = ?
          `;

          db.query(
            findGroupSql,
            [
              userData.degree,
              userData.branch,
              userData.year,
              userData.section,
            ],
            (err2, groups) => {
              if (!err2 && groups.length > 0) {
                const groupId = groups[0].id;

                db.query(
                  "INSERT INTO group_memberships (group_id, user_id) VALUES (?, ?)",
                  [groupId, userId]
                );
              }
            }
          );
        }

        res.json({ message: "User registered successfully" });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});   // ✅ THIS WAS MISSING

router.get("/staff", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT id, full_name, email FROM users WHERE role = 'teacher'"
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff" });
  }
});


/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT id, full_name, email, password, role FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });
    }
  );
});

/* ME */
router.get("/me", (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "No token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    db.query(
      "SELECT id, email, full_name, role, reg_no, degree, branch, year, section FROM users WHERE id = ?",
      [decoded.id],
      (err, result) => {
        if (err || result.length === 0) {
          return res.status(401).json({ message: "User not found" });
        }

        res.json({
          user: result[0],
          role: result[0].role,
          profile: result[0],
        });
      }
    );
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
