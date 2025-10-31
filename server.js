import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bodyParser from "body-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Sesuaikan origin dengan domain frontend mu.
// Untuk development biarkan *; di production ganti ke domain Vercel.
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "https://magistory-frontend.vercel.app"
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// helper: call Gemini generateContent
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const resp = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  }, { timeout: 30000 });

  return resp.data;
}

// Health
app.get("/health", (req, res) => {
  res.json({ ok: true, model: process.env.GEMINI_MODEL || "not-set", hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// ------------------------------
// 1) Generate script (JSON) endpoint
// ------------------------------
app.post("/api/generate-script", async (req, res) => {
  try {
    const { idea, duration, aspectRatio, style } = req.body;
    if (!idea) return res.status(400).json({ error: "idea required" });

    // Build a strict prompt that requests JSON only.
    const prompt = `
Kamu adalah asisten pembuatan naskah video. Buatkan naskah video berdasarkan ide: "${idea}".
Parameter:
- Durasi total: ${duration || "60 detik"}
- Aspect ratio: ${aspectRatio || "16:9"}
- Gaya: ${style || "edukatif"}

Respon HARUS hanya berupa JSON valid (tanpa penjelasan lain) menggunakan format berikut:

{
  "judul": "Judul video singkat",
  "adegan": [
    {
      "nomor_adegan": 1,
      "durasi": "00:00-00:30",
      "deskripsi_visual": ["keyword1", "keyword2"],
      "narasi": "Teks narasi untuk adegan 1"
    }
  ]
}

Pastikan:
- Jumlah adegan sesuai total durasi (misal setiap adegan 30s atau sesuai perintah).
- Deskripsi_visual berisi keyword relevan singkat (tidak kalimat panjang).
- Narasi padat dan sesuai konteks.
- Balikkan hanya JSON (jangan sertakan markdown).
`.trim();

    // call gemini
    const geminiRaw = await callGemini(prompt);

    // Extract text candidate
    const text = geminiRaw?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean triple backticks if any
    const cleaned = text.replace(/```json|```/g, "").trim();

    // Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // If parse fails, return helpful debug for developer
      console.error("JSON parse failed. Raw text:", cleaned);
      return res.status(500).json({ error: "Failed to parse JSON from Gemini", raw: cleaned });
    }

    // Basic validation
    if (!parsed.judul || !Array.isArray(parsed.adegan)) {
      return res.status(500).json({ error: "Invalid format returned by Gemini", sample: parsed });
    }

    // Save sample project to FS (optional)
    const id = uuidv4();
    const savePath = path.join(__dirname, "projects");
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath, { recursive: true });
    fs.writeFileSync(path.join(savePath, `${id}.json`), JSON.stringify({ id, idea, parsed, createdAt: new Date().toISOString() }, null, 2));

    return res.json({ id, ...parsed });
  } catch (err) {
    console.error("Generate error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Generate failed", detail: err.response?.data || err.message });
  }
});

// ------------------------------
// 2) Pexels proxy: search videos
// ------------------------------
app.post("/api/get-videos", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "PEXELS_API_KEY not set" });

    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8`;
    const p = await axios.get(url, { headers: { Authorization: apiKey }, timeout: 15000 });
    const videos = (p.data.videos || []).map(v => ({
      id: v.id,
      thumbnail: v.image,
      // choose best quality link available (prefer mp4)
      url: (v.video_files && v.video_files[0] && v.video_files[0].link) || null,
      duration: v.duration
    }));
    return res.json({ videos });
  } catch (err) {
    console.error("Pexels error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Pexels failed", detail: err.response?.data || err.message });
  }
});
// ✅ Save Project ke Server
import fs from "fs";

app.post("/api/save-project", (req, res) => {
  try {
    const project = req.body;
    if (!project.judul) {
      return res.status(400).json({ error: "Judul project tidak ditemukan." });
    }

    // Simpan ke file JSON (sementara, nanti bisa ganti DB)
    fs.writeFileSync("project.json", JSON.stringify(project, null, 2));
    console.log("✅ Project disimpan:", project.judul);
    res.json({ success: true, message: "Project disimpan di server." });
  } catch (err) {
    console.error("Gagal menyimpan project:", err);
    res.status(500).json({ error: "Gagal menyimpan project di server." });
  }
});
// ------------------------------
// 3) Save project (store JSON)
// ------------------------------
app.post("/api/save-project", async (req, res) => {
  try {
    const project = req.body;
    const id = project?.id || uuidv4();
    const savePath = path.join(__dirname, "projects");
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath, { recursive: true });
    const file = path.join(savePath, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(project, null, 2));
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("save project error:", err);
    return res.status(500).json({ error: "Save failed" });
  }
});

// ------------------------------
// 4) Render endpoint (mock queue)
// ------------------------------
const renderJobs = {}; // in-memory; ephemeral. For production use DB + worker.

app.post("/api/render", async (req, res) => {
  try {
    const { projectId, resolution } = req.body;
    if (!projectId) return res.status(400).json({ error: "projectId required" });

    const jobId = uuidv4();
    renderJobs[jobId] = { id: jobId, projectId, resolution: resolution || "1080p", status: "queued", createdAt: new Date().toISOString() };

    // simulate processing (in real impl: push to worker/FFmpeg)
    setTimeout(() => {
      renderJobs[jobId].status = "completed";
      renderJobs[jobId].outputUrl = `https://example.com/renders/${jobId}.mp4`; // placeholder
      renderJobs[jobId].finishedAt = new Date().toISOString();
    }, 3000); // 3s fake processing

    return res.json({ ok: true, jobId });
  } catch (err) {
    console.error("render error:", err);
    return res.status(500).json({ error: "Render failed" });
  }
});

app.get("/api/render-status/:jobId", (req, res) => {
  const j = renderJobs[req.params.jobId];
  if (!j) return res.status(404).json({ error: "job not found" });
  return res.json(j);
});

// Serve projects list (for debugging)
app.get("/api/projects/:id", (req, res) => {
  const id = req.params.id;
  const file = path.join(__dirname, "projects", `${id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "not found" });
  const content = fs.readFileSync(file, "utf8");
  return res.json(JSON.parse(content));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
