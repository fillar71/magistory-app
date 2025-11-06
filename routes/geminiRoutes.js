import express from "express";
import { generateScript } from "../controllers/geminiController.js";

const router = express.Router();

// route utama
router.post("/generate-script", generateScript);

export default router;
