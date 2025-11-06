import dotenv from "dotenv";
dotenv.config();

export const generateScript = async (req, res) => {
  try {
    const { ide, durasi_total, aspect_ratio, style } = req.body;

    if (!ide) {
      return res.status(400).json({ error: "Parameter 'ide' wajib diisi" });
    }

    // Buat prompt yang lebih eksplisit
    const prompt = `
Kamu adalah asisten kreatif yang membuat skrip video singkat berdasarkan ide pengguna.
Gunakan format JSON berikut (tanpa tambahan teks lain dan tanpa blok \`\`\`json):
{
  "judul": "...",
  "total_durasi": ${durasi_total || 60},
  "adegan": [
    {
      "id": 1,
      "durasi": "00:00-00:05",
      "narasi": "...",
      "deskripsi_visual": "...",
      "kata_kunci_video": "..."
    }
  ]
}

Ide video: ${ide}
Gaya video: ${style || "edukatif"}
Rasio aspek: ${aspect_ratio || "16:9"}
Pastikan JSON valid.
`;

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

    // Ambil teks dari response
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mendapatkan hasil";

    // Bersihkan karakter tambahan di luar JSON
    const cleanText = text
      .replace(/```json|```/g, "")
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (err) {
      console.error("⚠️ JSON parse error:", err.message);
      return res.status(500).json({
        error: "Respons dari Gemini bukan JSON valid.",
        raw: text,
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("🔥 Error di generateScript:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
