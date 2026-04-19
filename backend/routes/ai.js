import express from "express";
import db from "../config/db.js";
import { askAI } from "../services/aiService.js";

const router = express.Router();

router.post("/ai-chat", async (req, res) => {

  const { message } = req.body;

  try {

    const aiReply = await askAI(message);

    res.json({ reply: aiReply });

  } catch (error) {

    console.error(error);

    res.json({
      reply: "AI could not process the request."
    });

  }

});

export default router;