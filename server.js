// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateScript } from "./controllers/geminiController.js";

dotenv.config();
const app = express();

// ✅ Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://magistory-frontend.vercel.app",
      "https://magistory-frontend-8d5tn14e6-filla-ramadans-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ Route tes koneksi (penting buat vercel & Railway)
app.get("/", (req, res) => res.send("✅ Magistory Backend aktif!"));
app.get("/ping", (req, res) => res.json({ message: "pong" }));

// ✅ Route utama
app.post("/api/generate-script", generateScript);

// ✅ Jalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend berjalan di port ${PORT}`));
