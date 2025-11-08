import dotenv from "dotenv";
dotenv.config();

export const generateScript = async (req, res) => {
  try {
    const { ide, durasi_total, aspect_ratio, style } = req.body;
    if (!ide) return res.status(400).json({ error: "Parameter 'ide' wajib diisi" });

    const prompt = `
Kamu adalah AI pembuat naskah video profesional.
Buatkan skrip video berdasarkan ide berikut:
- Ide: ${ide}
- Gaya: ${style || "edukatif"}
- Rasio Aspek: ${aspect_ratio || "16:9"}
- Durasi Total: ${durasi_total || 60} detik

Format JSON tanpa blok kode:
{
  "judul": "Judul Video",
  "total_durasi": ${durasi_total || 60},
  "adegan": [
    {
      "id": 1,
      "durasi": "00:00-00:05",
      "narasi": "Kalimat narasi pembuka",
      "deskripsi_visual": ["pemandangan", "alam", "awan"],
      "kata_kunci_video": ["nature", "clouds", "sky"]
    }
  ]
}
`;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Tidak ada respons dari Gemini." });

    const clean = text.replace(/```json|```/g, "").replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (e) {
    console.error("🔥 Gemini Error:", e);
    res.status(500).json({ error: e.message });
  }
};
