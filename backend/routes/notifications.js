import express from "express";
import db from "../db.js";

const router = express.Router();





router.post("/", (req, res) => {
    const { user_id, title, message, related_form_id } = req.body;
  
    db.query(
      "INSERT INTO notifications (user_id, title, message, related_form_id) VALUES (?, ?, ?, ?)",
      [user_id, title, message, related_form_id],
      (err) => {
        if (err) return res.status(500).json({ message: "Insert failed" });
        res.json({ message: "Reminder sent" });
      }
    );
  });

  router.post("/bulk", (req, res) => {
    const { students, title, message, form_id } = req.body;
  
    const values = students.map(user_id => [
      user_id,
      title,
      message,
      form_id
    ]);
  
    db.query(
      "INSERT INTO notifications (user_id, title, message, related_form_id) VALUES ?",
      [values],
      (err) => {
        if (err) return res.status(500).json({ message: "Bulk failed" });
        res.json({ message: "Bulk reminder sent" });
      }
    );
  });
  
  
export default router;  