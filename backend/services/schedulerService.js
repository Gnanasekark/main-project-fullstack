import cron from "node-cron";
import db from "../config/db.js";
import { sendEmail } from "./emailService.js";
import { sendWhatsApp } from "./whatsappService.js";

export const startScheduler = () => {
  cron.schedule("* * * * *", async () => {

    const [rows] = await db.promise().query(
      "SELECT * FROM notifications WHERE scheduled_at <= NOW() AND sent=0"
    );

    for (let notification of rows) {
      const [students] = await db.promise().query("SELECT * FROM students");

      for (let student of students) {
        await sendEmail(student.email, notification.title, notification.message);
      }

      await db.promise().query("UPDATE notifications SET sent=1 WHERE id=?", [notification.id]);
    }
  });
};