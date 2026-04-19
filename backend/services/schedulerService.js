import cron from "node-cron";
import db from "../config/db.js";
import { sendEmail } from "./emailService.js";
import sendWhatsAppMessage from "./whatsappService.js";

export const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Scheduler running:", new Date());
  
    const [rows] = await db.promise().query(`
      SELECT * FROM notifications 
WHERE status = 'pending'
AND user_id IS NULL
    `);
  
    for (let notification of rows) {
      const now = new Date();
      const scheduledTime = new Date(notification.scheduled_at);
      const dueDate = new Date(notification.due_date);
  
      const diffMinutes = (now - scheduledTime) / (1000 * 60);
  
      // ❌ STOP AFTER DUE DATE
      if (now > dueDate) {
        console.log("⛔ Due date passed:", notification.id);
  
        await db.promise().query(`
          UPDATE notifications 
          SET status='expired' 
          WHERE id=?
        `, [notification.id]);
  
        continue;
      }
  
      // ❌ STOP AFTER MAX RETRIES
      if (notification.retry_count >= notification.max_retries) {
        console.log("⛔ Max retries reached:", notification.id);
  
        await db.promise().query(`
          UPDATE notifications 
          SET status='stopped' 
          WHERE id=?
        `, [notification.id]);
  
        continue;
      }
  
      // ✅ CHECK INTERVAL
      if (
        diffMinutes >= 0 &&
        diffMinutes % notification.reminder_interval < 1
      ) {
        console.log("🔁 Sending reminder:", notification.id);
  
        // ✅ ONLY PENDING STUDENTS
        console.log("🎯 Students found:", students.length);
console.log(students);
const [students] = await db.promise().query(`
  SELECT DISTINCT u.id, u.email, u.mobile, u.full_name
  FROM form_assignments fa

  LEFT JOIN group_memberships gm 
    ON fa.assigned_to_group_id = gm.group_id

  JOIN users u 
    ON u.id = COALESCE(fa.assigned_to_user_id, gm.user_id)

  LEFT JOIN form_submissions fs
    ON fs.form_id = fa.form_id
    AND fs.user_id = u.id

  WHERE fa.form_id = ?
  AND fs.id IS NULL
`, [notification.related_form_id]);
console.log("✅ Inserted notification for:", student.id);
  
        for (let student of students) {
          try {
            await sendEmail(
              student.email,
              notification.title,
              notification.message
            );
        
            console.log("📩 Email sent to:", student.email);
        
            // ✅ SAVE EACH STUDENT
            await db.promise().query(`
              INSERT INTO notifications 
              (user_id, title, message, related_form_id, status, created_at)
              VALUES (?, ?, ?, ?, 'sent', NOW())
            `, [
              student.student_id,   // 🔥 IMPORTANT CHANGE
              notification.title,
              notification.message,
              notification.related_form_id
            ]);

          } catch (err) {
            console.log("❌ Email failed:", student.email);
          }
        
        
          // ✅ WHATSAPP
          try {
            await sendWhatsAppMessage(
              student.mobile,
              student.full_name,
              notification.title,
              "http://your-link",
              "Teacher"
            );
            console.log("📱 WhatsApp sent to:", student.phone);
          } catch (err) {
            console.log("❌ WhatsApp failed:", student.phone, err.message);
          }
        }
  
        // ✅ INCREMENT RETRY COUNT
        await db.promise().query(`
          UPDATE notifications 
          SET retry_count = retry_count + 1 
          WHERE id=?
        `, [notification.id]);
  
        console.log("✅ Reminder sent:", notification.id);
  
        global.io.emit("new-notification", {
          user_id: student.id,   // IMPORTANT
          title: notification.title,
          message: notification.message,
        });
      }
    }
  });
};