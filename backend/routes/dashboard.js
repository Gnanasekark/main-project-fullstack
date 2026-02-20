import express from "express";
import db from "../config/db.js";


const router = express.Router();

router.get("/stats", (req, res) => {
  const stats = {};

  db.query("SELECT COUNT(*) total FROM students", (e, r) => {
    stats.students = r[0].total;

    db.query("SELECT COUNT(*) total FROM forms", (e2, r2) => {
      stats.forms = r2[0].total;
      res.json(stats);
    });
  });
});

export default router;
