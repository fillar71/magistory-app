import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateScript } from "./controllers/geminiController.js";

dotenv.config();
const app = express();

app.use(express.json());

// ✅ Izinkan domain frontend kamu (Vercel)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://magistory-frontend.vercel.app",
      "https://vercel.com/filla-ramadans-projects/magistory-frontend/Ho5sGSxrFQmRaVns2rLkXUJHHhy1", // kalau kamu rename project di Vercel
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/", (req, res) => res.send("✅ Magistory Backend aktif!"));
app.post("/api/generate-script", generateScript);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend berjalan di port ${PORT}`));
