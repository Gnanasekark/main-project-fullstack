import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { title, message } = req.body;
  await db.promise().query(
    "INSERT INTO notification_templates (title, message) VALUES (?,?)",
    [title, message]
  );
  res.json({ message: "Template saved" });
});

router.get("/", async (req, res) => {
  const [rows] = await db.promise().query("SELECT * FROM notification_templates");
  res.json(rows);
});

export default router;