// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateScript } from "./controllers/geminiController.js";

dotenv.config();
const app = express();

app.use(express.json());

// ✅ Pastikan semua domain frontend diizinkan
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://magistory-frontend.vercel.app",
      /\.vercel\.app$/  // izinkan subdomain Vercel lain (regex)
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Tambahkan log untuk memverifikasi request
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => res.send("✅ Magistory Backend aktif!"));
app.post("/api/generate-script", generateScript);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend berjalan di port ${PORT}`));
