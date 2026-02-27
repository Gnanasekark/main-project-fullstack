import express from "express";
import db from "../config/db.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/emailService.js";

import { exportToCSV } from "../utils/exportCSV.js";
import verifyToken from "../middleware/verifyToken.js";
import sendWhatsAppMessage from "../services/whatsappService.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";


             /* View button */
             router.get("/:id/details", verifyToken, async (req, res) => {
              try {
                const notificationId = req.params.id;
            
                const [rows] = await db.promise().query(`
                  SELECT 
                    u.full_name,
                    u.reg_no,
                    n.is_read,
                    n.read_at
                  FROM notifications n
                  JOIN users u ON u.id = n.user_id
                  WHERE n.id = ?
                `, [notificationId]);
            
                const total = rows.length;
                const readStudents = rows.filter(r => r.is_read === 1);
                const unreadStudents = rows.filter(r => r.is_read === 0);
            
                res.json({
                  total,
                  read: readStudents.length,
                  unread: unreadStudents.length,
                  successRate: total > 0 ? Math.round((readStudents.length / total) * 100) : 0,
                  allStudents: rows,
                  readStudents,
                  unreadStudents,
                  reminderType: "email+whatsapp"
                });
            
              } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Details error" });
              }
            });

            
             /* Notifications  */
             router.get("/", verifyToken, (req, res) => {
              const teacherId = req.user.id;
            
              const query = `
                SELECT n1.*
                FROM notifications n1
                INNER JOIN (
                    SELECT 
                        MAX(id) as id
                    FROM notifications
                    WHERE created_by = ?
                    GROUP BY related_form_id, title
                ) n2 ON n1.id = n2.id
                ORDER BY n1.created_at DESC
              `;
            
              db.query(query, [teacherId], (err, rows) => {
                if (err) {
                  console.error(err);
                  return res.status(500).json({ message: "DB error" });
                }
            
                res.json(rows);
              });
            });

            /* Notifications export csv  */

router.get("/export", async (req, res) => {
  const [rows] = await db.promise().query("SELECT * FROM students");
  exportToCSV(rows, res);
});


          /* Notifications  */

router.post("/send", async (req, res) => {
  try {
    const { title, message, channel } = req.body;

    // 1️⃣ Get students from database
    const [students] = await db.promise().query("SELECT * FROM students");

    // 2️⃣ Insert notification record first
    const [result] = await db.promise().query(
      "INSERT INTO notifications (title, message) VALUES (?, ?)",
      [title, message]
    );

    const notificationId = result.insertId;

    // 3️⃣ Loop students
    for (let student of students) {

      if (channel.includes("Email")) {
        await sendEmail(student.email, title, message);
      }

      if (channel.includes("WhatsApp")) {
        await sendWhatsApp(student.phone, message);
      }

      await db.query(
        "INSERT INTO notification_delivery (notification_id, student_id, sent_at) VALUES (?, ?, NOW())",
        [notificationId, student.id]
      );
    }

    res.json({ message: "Notifications sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



          /* Notifications  */
          router.get("/my", verifyToken, (req, res) => {
            const userId = req.user.id;
          
            db.query(
              `
              SELECT 
                n.*,
                u.full_name AS sender_name,
                u.email AS sender_email
              FROM notifications n
              JOIN users u ON u.id = n.created_by
              WHERE n.user_id = ?
              ORDER BY n.created_at DESC
              `,
              [userId],
              (err, rows) => {
                if (err) {
                  console.error("MY NOTIFICATIONS ERROR:", err);
                  return res.status(500).json({ message: "DB error" });
                }
          
                res.json(rows);
              }
            );
          });
/* ========================= */
          /* Mark     */
/* ========================= */

router.put("/read/:id", verifyToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  db.query(
    "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?",
    [notificationId, userId],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ message: "Marked as read" });
    }
  );
});
/* ========================= */
/* GET USER NOTIFICATIONS    */
/* ========================= */
router.get("/user/:id", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(results);
      }
    );
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});


/* ========================= */
/* BULK REMINDER (FIXED)     */
/* ========================= */
router.post("/bulk", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const senderId = decoded.id;

    const { user_ids, form_id, channel } = req.body;

    if (!user_ids || user_ids.length === 0) {
      return res.status(400).json({ message: "No recipients selected" });
    }

    // ✅ GET TEACHER DETAILS
    const [teacherRows] = await db.promise().query(
      "SELECT email, full_name FROM users WHERE id = ?",
      [senderId]
    );

    const teacherEmail = teacherRows[0].email;
    const teacherName = teacherRows[0].full_name;

    // ✅ GET FORM TITLE
    const [formRows] = await db.promise().query(
      "SELECT title FROM forms WHERE id = ?",
      [form_id]
    );

    const formTitle = formRows.length > 0 ? formRows[0].title : "New Form";

    for (let uid of user_ids) {

      // ✅ GET STUDENT DETAILS
      const [studentRows] = await db.promise().query(
        "SELECT email, mobile, full_name, reg_no FROM users WHERE id = ?",
        [uid]
      );

      if (studentRows.length === 0) continue;

      const student = studentRows[0];

      const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
      const formLink = `${FRONTEND_URL}/student/form/${form_id}`;

      if (channel === "email" || channel === "both") {
        await sendEmail(
          student.email,
          student.full_name,
          student.reg_no,
          formTitle,
          formLink,
          teacherEmail,
          teacherName
        );
      }

      if (channel === "whatsapp" || channel === "both") {
        try {
          await sendWhatsAppMessage(student.mobile);
        } catch (waError) {
          console.error("WhatsApp failed but continuing:", waError.message);
        }
      }

      await db.promise().query(
        `INSERT INTO notifications 
        (user_id, title, message, channel, related_form_id, status, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          uid,
          `Form Assigned`,
          `You have been assigned ${formTitle}`,
          channel,
          form_id,
          "sent",
          senderId
        ]
      );
    }

    res.json({ message: "Bulk notifications sent successfully" });

  }catch (error) {
    console.error("Bulk notification error:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
});


       /* Whatapp message      */

router.post("/test-whatsapp", async (req, res) => {
  try {
    await sendWhatsAppMessage(
      "91XXXXXXXXXX",   // your number without +
      "Backend WhatsApp integration successful 🚀"
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ========================= */
/* SEND SINGLE / CUSTOM      */
/* ========================= */
router.post("/", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { user_ids, title, message, channel } = req.body;

    const values = user_ids.map((uid) => [
      uid,
      title,
      message,
      channel,
      "sent",
      userId,
      new Date(),
    ]);

    const insertQuery = `
      INSERT INTO notifications 
      (user_id, title, message, channel, status, created_by, created_at)
      VALUES ?
    `;

    db.query(insertQuery, [values], (err) => {
      if (err) return res.status(500).json({ message: "Insert error" });
      res.json({ message: "Notification sent" });
    });

  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});


              /* remainder history */ 
              router.get("/reminder-history", (req, res) => {
                const query = `
                  SELECT 
                    n.related_form_id,
                    f.title AS form_title,
                    n.title,
                    COUNT(*) AS total_students,
                    SUM(n.is_read = 1) AS read_count,
                    SUM(n.is_read = 0 OR n.is_read IS NULL) AS unread_count,
                    ROUND(
                      (SUM(n.is_read = 1) / COUNT(*)) * 100
                    ) AS success_rate,
                    MAX(n.created_at) AS created_at
                  FROM notifications n
                  LEFT JOIN forms f 
                    ON f.id = n.related_form_id
                  WHERE n.related_form_id IS NOT NULL
                  GROUP BY n.related_form_id, n.title
                  ORDER BY created_at DESC
                `;
              
                db.query(query, (err, rows) => {
                  if (err) {
                    console.error("REMINDER HISTORY ERROR:", err);
                    return res.status(500).json({ message: "Server error" });
                  }
              
                  res.json(rows);
                });
              });

/* ========================= */
/* STATS BY FORM             */
/* ========================= */
router.get("/stats/:formId", (req, res) => {
  const { formId } = req.params;

  db.query(
    `SELECT channel, COUNT(*) as count
     FROM notifications
     WHERE related_form_id = ?
     GROUP BY channel`,
    [formId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Error" });
      res.json(results);
    }
  );
});

export default router;
