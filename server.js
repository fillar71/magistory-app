import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Generate Script dari Gemini
app.post("/api/generate-script", async (req, res) => {
  try {
    const { ide, durasi_total, aspect_ratio, style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Hitung jumlah adegan otomatis berdasarkan durasi
    const jumlahAdegan = Math.max(3, Math.floor(durasi_total / 10));
    const durasiPerAdegan = Math.floor(durasi_total / jumlahAdegan);

    // Prompt ke Gemini
    const prompt = `
Buatkan skrip video dengan ide: "${ide}"
Gaya video: ${style}
Durasi total: ${durasi_total} detik
Aspect ratio: ${aspect_ratio}
Bagi video menjadi ${jumlahAdegan} adegan, masing-masing sekitar ${durasiPerAdegan} detik.

Format jawaban HARUS JSON valid seperti ini tanpa tanda \`\`\` atau teks tambahan:

{
  "judul": "Judul video",
  "adegan": [
    {
      "nomor_adegan": 1,
      "durasi": "00:00-${durasiPerAdegan.toString().padStart(2, "0")}",
      "deskripsi_visual": ["kata kunci visual 1", "kata kunci visual 2"],
      "narasi": "Narasi singkat adegan pertama"
    }
  ]
}
`;

    // Panggil API Gemini 2.0 Flash
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    // Validasi hasil dari Gemini
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      return res.status(500).json({ error: "Model tidak merespons dengan benar", data });
    }

    // Bersihkan hasil agar JSON valid
    const text = data.candidates[0].content.parts[0].text.trim();
    const cleanText = text.replace(/```json|```/g, "").trim();

    let jsonOutput;
    try {
      jsonOutput = JSON.parse(cleanText);
    } catch (err) {
      console.error("❌ Gagal parse JSON:", err);
      return res.status(500).json({ error: "Respon bukan JSON valid", raw: text });
    }

    // Kirim hasil ke frontend
    res.json({
      ...jsonOutput,
      konfigurasi: {
        total_durasi: durasi_total,
        durasi_per_adegan: durasiPerAdegan,
        jumlah_adegan: jumlahAdegan,
      },
    });
  } catch (error) {
    console.error("❌ Gagal generate script:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Jalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend berjalan di port ${PORT}`));
