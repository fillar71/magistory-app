import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const renderVideo = async (req, res) => {
  try {
    const { judul, adegan } = req.body;
    if (!judul || !adegan) return res.status(400).json({ error: "Data tidak lengkap." });

    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const fileList = adegan
      .filter(a => a.media?.[0]?.src)
      .map(a => `file '${a.media[0].src}'`)
      .join("\n");

    const fileListPath = path.join(tempDir, "filelist.txt");
    fs.writeFileSync(fileListPath, fileList);

    const outputPath = path.join(tempDir, `${judul.replace(/\s+/g, "_")}.mp4`);
    await execAsync(`ffmpeg -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}"`);

    res.download(outputPath, `${judul}.mp4`, () => {
      fs.unlinkSync(fileListPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error("❌ Render error:", err);
    res.status(500).json({ error: err.message });
  }
};
