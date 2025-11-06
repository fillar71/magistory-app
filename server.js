import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import geminiRoutes from "./routes/geminiRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Magistory Backend berjalan!");
});

// Gunakan routes terpisah
app.use("/api", geminiRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Backend berjalan di port ${PORT}`);
});
