import express from "express";
import { upload } from "../upload.js";

const router = express.Router();





router.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file.filename });
});

export default router;
