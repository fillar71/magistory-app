import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateScript } from "./controllers/geminiController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Route utama
app.get("/", (req, res) => {
  res.send("✅ Magistory Backend berjalan!");
});

// Route generate script
app.post("/api/generate-script", generateScript);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Backend berjalan di port ${PORT}`);
});
