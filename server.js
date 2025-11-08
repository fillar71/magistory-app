import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateScript } from "./controllers/geminiController.js";
import { renderVideo } from "./controllers/renderController.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://magistory-frontend.vercel.app",
    ],
    methods: ["GET", "POST"],
  })
);

app.get("/", (req, res) => res.send("✅ Magistory Backend aktif!"));
app.post("/api/generate-script", generateScript);
app.post("/api/render", renderVideo);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend berjalan di port ${PORT}`));
