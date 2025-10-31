import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cors({
  origin: ["https://magistory-frontend.vercel.app"],
  methods: ["GET", "POST"],
}));
// ✅ Generate Script (Gemini)
app.post("/api/generate-script", async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: "Ide tidak boleh kosong." });

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        contents: [
          { parts: [{ text: `Buatkan naskah video singkat edukatif tentang: ${idea}` }] }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    const script =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gagal menghasilkan skrip.";

    res.json({ script });
  } catch (err) {
    console.error("Error Gemini:", err.response?.data || err.message);
    res.status(500).json({ error: "Gagal memproses permintaan." });
  }
});

// ✅ Ambil video dari Pexels
app.post("/api/get-videos", async (req, res) => {
  try {
    const { query } = req.body;
    const pexelsResponse = await axios.get(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: { Authorization: process.env.PEXELS_API_KEY },
      }
    );

    const videos = pexelsResponse.data.videos.map((v) => ({
      id: v.id,
      url: v.video_files[0].link,
      thumbnail: v.image,
    }));

    res.json({ videos });
  } catch (err) {
    console.error("Error Pexels:", err.message);
    res.status(500).json({ error: "Gagal mengambil video." });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
