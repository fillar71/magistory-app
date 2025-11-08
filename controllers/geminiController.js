import dotenv from "dotenv";
dotenv.config();

export const generateScript = async (req, res) => {
  try {
    const { ide, durasi_total, aspect_ratio, style } = req.body;
    if (!ide) return res.status(400).json({ error: "Parameter 'ide' wajib diisi" });

    const prompt = `
Kamu adalah AI pembuat naskah video profesional.
Buatkan skrip video JSON valid berdasarkan data ini:
- Ide: ${ide}
- Gaya: ${style}
- Rasio aspek: ${aspect_ratio}
- Durasi total: ${durasi_total} detik

Gunakan format:
{
  "judul": "Judul video",
  "total_durasi": ${durasi_total},
  "adegan": [
    {
      "id": 1,
      "durasi": "00:00-00:05",
      "narasi": "Kalimat narasi pembuka",
      "deskripsi_visual": ["tema", "objek", "latar"],
      "kata_kunci_video": ["keyword"]
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Tidak ada respons dari Gemini." });

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
