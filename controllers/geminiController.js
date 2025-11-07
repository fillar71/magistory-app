// controllers/geminiController.js
import dotenv from "dotenv";
dotenv.config();

export const generateScript = async (req, res) => {
  try {
    const { ide, durasi_total, aspect_ratio, style } = req.body;

    if (!ide) {
      return res.status(400).json({ error: "Parameter 'ide' wajib diisi" });
    }

    // ✅ Buat prompt yang terstruktur dan instruksi ketat agar output selalu JSON valid
    const prompt = `
Kamu adalah AI pembuat naskah video profesional.
Buatkan skrip video berdasarkan informasi berikut:

- Ide: ${ide}
- Gaya video: ${style || "edukatif"}
- Rasio aspek: ${aspect_ratio || "16:9"}
- Durasi total: ${durasi_total || 60} detik

Gunakan format JSON valid TANPA teks tambahan, TANPA \`\`\`json atau blok kode.
Format yang HARUS dihasilkan:
{
  "judul": "Judul video singkat",
  "total_durasi": ${durasi_total || 60},
  "adegan": [
    {
      "id": 1,
      "durasi": "00:00-00:05",
      "narasi": "Kalimat narasi pembuka",
      "deskripsi_visual": ["robot", "AI", "teknologi"],
      "kata_kunci_video": ["robot", "artificial intelligence"]
    }
  ]
}
`;

    // ✅ Pastikan API key dikirim benar
    if (!process.env.GEMINI_API_KEY) {
      return res.status(401).json({ error: "API key Gemini belum diatur di backend." });
    }

    // ✅ Request ke Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    // ✅ Validasi respons dari Gemini
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("❌ Tidak ada teks dari Gemini:", data);
      return res.status(500).json({ error: "Tidak ada respons teks dari Gemini.", raw: data });
    }

    // ✅ Bersihkan dan parse JSON
    const clean = text
      .replace(/```json|```/g, "")
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
      .trim();

    try {
      const parsed = JSON.parse(clean);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error("❌ JSON parse error:", e.message);
      return res.status(500).json({
        error: "Respons Gemini bukan JSON valid",
        raw: clean,
      });
    }
  } catch (error) {
    console.error("🔥 Error di generateScript:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
