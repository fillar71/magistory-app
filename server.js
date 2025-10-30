import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();

// ✅ CORS diatur agar GitHub Pages bisa akses backend
app.use(cors({
  origin: "https://fillar71.github.io/magistory-frontend", // atau ganti "*" dengan URL GitHub Pages kamu
}));
app.use(express.json());

// ✅ Generate Script pakai Gemini 1.5 Flash (versi terbaru)
app.post("/api/generate-script", async (req, res) => {
  try {
    const { idea } = req.body;

    if (!idea) {
      return res.status(400).json({ error: "Ide tidak boleh kosong." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API Key Gemini belum diatur di Railway." });
    }

    const prompt = `Buatkan skrip video singkat dan menarik dengan gaya storytelling untuk ide: "${idea}". 
Gunakan bahasa yang ringan dan engaging.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const script =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gagal menghasilkan skrip.";

    res.json({ script });
  } catch (error) {
    console.error("❌ Gemini API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Gagal memproses permintaan ke Gemini API." });
  }
});

// ✅ Ambil stok video dari Pexels
app.post("/api/get-videos", async (req, res) => {
  try {
    const { query } = req.body;
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key Pexels belum diatur di Railway." });
    }

    const pexelsResponse = await axios.get(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5`,
      { headers: { Authorization: apiKey } }
    );

    const videos = pexelsResponse.data.videos.map((v) => ({
      id: v.id,
      url: v.video_files[0].link,
      thumbnail: v.image
    }));

    res.json({ videos });
  } catch (error) {
    console.error("❌ Pexels API Error:", error.message);
    res.status(500).json({ error: "Gagal mengambil video dari Pexels." });
  }
});

// ✅ Tes koneksi backend
app.get("/", (req, res) => {
  res.send("Magistory Backend berjalan 🚀");
});

// ✅ Jalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
