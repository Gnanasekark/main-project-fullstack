import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";


const router = express.Router();

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= GET ALL ================= */

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM circulars ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Error" });
      res.json(rows);
    }
  );
});

/* ================= UPLOAD ================= */

router.post("/", upload.single("file"), (req, res) => {
  const { title, description } = req.body;

  db.query(
    "INSERT INTO circulars (title, description, file_path, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)",
    [
      title,
      description,
      req.file.path,
      req.file.originalname,
      req.file.mimetype,      // ✅ store mime type
      req.file.size           // ✅ store file size
    ],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Upload failed" });
      }
      res.json({ message: "Uploaded" });
    }
  );
});


/* ================= DELETE ================= */

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT file_path FROM circulars WHERE id = ?", [id], (err, rows) => {
    if (err || rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    const filePath = rows[0].file_path;

    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.query("DELETE FROM circulars WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ message: "Delete failed" });
      res.json({ message: "Deleted" });
    });
  });
});

/* ================= DOWNLOAD ================= */

router.get("/:id/download", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM circulars WHERE id = ?", [id], (err, rows) => {
    if (err || rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    const file = rows[0];
    res.download(path.resolve(file.file_path), file.file_name);
  });
});



/* ================= VIEW ================= */


router.get("/:id/view", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM circulars WHERE id = ?", [id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = rows[0];
    const filePath = path.resolve(file.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing" });
    }

    // 🔥 VERY IMPORTANT
    res.setHeader("Content-Type", file.file_type);
    res.setHeader("Content-Disposition", "inline");

    res.sendFile(filePath);
  });
});



export default router;
