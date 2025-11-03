import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

/* ==============================
   1️⃣ GENERATE SCRIPT DARI GEMINI
============================== */
app.post("/api/generate-script", async (req, res) => {
  try {
    const { idea, duration, aspectRatio, style } = req.body;

    if (!idea) return res.status(400).json({ error: "Ide tidak boleh kosong." });

    // Minta Gemini hasilkan JSON lengkap
    const prompt = `
Buatkan JSON naskah video dengan format:
{
  "judul": "...",
  "adegan": [
    {
      "nomor_adegan": 1,
      "durasi": "00:00-00:30",
      "deskripsi_visual": ["...","..."],
      "narasi": "..."
    }
  ]
}
Topik: ${idea}
Durasi: ${duration || "60 detik"}
Aspect Ratio: ${aspectRatio || "16:9"}
Gaya: ${style || "edukatif"}
`;

    const geminiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    const text = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonData = JSON.parse(text.trim());

    res.json(jsonData);
  } catch (err) {
    console.error("❌ Gagal generate script:", err.message);
    res.status(500).json({ error: "Gagal memproses permintaan Gemini." });
  }
});

/* ==============================
   2️⃣ AMBIL VIDEO DARI PEXELS
============================== */
app.post("/api/get-videos", async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || keywords.length === 0) {
      return res.status(400).json({ error: "Tidak ada keyword dikirim." });
    }

    // Gabungkan semua hasil video berdasarkan keyword visual
    let videos = [];
    for (const keyword of keywords) {
      const pexelsRes = await axios.get(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=3`,
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      );

      videos.push(
        ...pexelsRes.data.videos.map((v) => ({
          id: v.id,
          keyword,
          src: v.video_files[0].link,
          thumbnail: v.image,
        }))
      );
    }

    res.json({ videos });
  } catch (err) {
    console.error("❌ Gagal ambil video:", err.message);
    res.status(500).json({ error: "Gagal mengambil stok video dari Pexels." });
  }
});

/* ==============================
   3️⃣ START SERVER
============================== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend berjalan di port ${PORT}`));
