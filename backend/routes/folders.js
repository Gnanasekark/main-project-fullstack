import express from "express";
import db from "../config/db.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* Middleware to verify token */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/* GET ALL FOLDERS */
router.get("/", verifyToken, (req, res) => {
    const userId = req.user.id;
  
    db.query(
      "SELECT * FROM folders WHERE created_by = ? ORDER BY created_at DESC",
      [userId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Failed to fetch folders" });
        }
        res.json(result);
      }
    );
  });
  

/* CREATE FOLDER */
router.post("/", (req, res) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
  
      const { name } = req.body;
      const id = uuidv4();   // ✅ Generate ID manually
  
      db.query(
        "INSERT INTO folders (id, name, created_by, created_at) VALUES (?, ?, ?, NOW())",
        [id, name, userId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "DB error" });
          }
  
          res.json({
            id,
            name
          });
        }
      );
  
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  });
  
/* RENAME FOLDER */
router.put("/:id", verifyToken, (req, res) => {
    const folderId = req.params.id;
    const { name } = req.body;
    const userId = req.user.id;
  
    db.query(
      "UPDATE folders SET name = ? WHERE id = ? AND created_by = ?",
      [name, folderId, userId],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Rename failed" });
        }
  
        res.json({ message: "Folder renamed" });
      }
    );
  });
  

/* DELETE FOLDER */
router.delete("/:id", verifyToken, (req, res) => {
    const folderId = req.params.id;
    const userId = req.user.id;
  
    db.query(
      "UPDATE forms SET folder_id = NULL WHERE folder_id = ?",
      [folderId]
    );
  
    db.query(
      "DELETE FROM folders WHERE id = ? AND created_by = ?",
      [folderId, userId],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Delete failed" });
        }
  
        res.json({ message: "Folder deleted" });
      }
    );
  });
  

export default router;
