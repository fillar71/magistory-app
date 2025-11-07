// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateScript } from "./controllers/geminiController.js";

dotenv.config();
const app = express();

// ✅ Gunakan port dari Railway
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://magistory-frontend.vercel.app",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/", (req, res) => res.send("✅ Magistory Backend aktif!"));
app.get("/ping", (req, res) => res.json({ message: "pong" }));

app.post("/api/generate-script", async (req, res) => {
  try {
    const data = await generateScript(req, res);
    res.json(data);
  } catch (error) {
    console.error("💥 Gagal generate script:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend berjalan di port ${PORT}`);
});
