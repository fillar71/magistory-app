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
// Generate Script JSON by Gemini 2.0 Flash
app.post("/api/generate-script", async (req, res) => {
  try {
    const { idea, duration, aspectRatio, style } = req.body;
    if (!idea) return res.status(400).json({ error: "Ide tidak boleh kosong." });

    const prompt = `
Kamu adalah asisten kreator video.
Buatkan naskah video dengan ide: "${idea}".
Durasi total: ${duration || "60 detik"}.
Aspect ratio: ${aspectRatio || "16:9"}.
Gaya video: ${style || "edukatif"}.

Respon hanya dalam format JSON berikut:

{
  "judul": "judul video",
  "adegan": [
    {
      "nomor_adegan": 1,
      "durasi": "00:00-00:30",
      "deskripsi_visual": ["keyword1","keyword2"],
      "narasi": "narasi adegan"
    }
  ]
}
    `.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const gResp = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let text = gResp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Hapus triple backticks dll
    text = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    res.json(result);
  } catch (err) {
    console.error("GenerateScript error:", err.response?.data || err.message);
    res.status(500).json({ error: "Gagal memproses permintaan ke Gemini API." });
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
