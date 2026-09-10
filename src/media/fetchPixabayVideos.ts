import fs from "fs";
import path from "path";
import { Readable } from "stream";

function env(name: string) {
  return process.env[name] || "";
}

async function download(url: string, dest: string): Promise<string> {
  const res = await fetch(url);
  const body = res.body;
  if (!res.ok || !body) throw new Error(`Download failed: ${res.status}`);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const file = fs.createWriteStream(dest);
  const nodeStream = Readable.fromWeb(body as any);

  await new Promise<void>((resolve, reject) => {
    nodeStream.pipe(file);
    nodeStream.on("error", reject);
    file.on("finish", () => resolve());
  });

  return dest;
}

export async function fetchPixabayVideosForSession(s: { text?: string; visualKeywords?: string[] }) {
  const key = env("PIXABAY_API_KEY");
  if (!key) throw new Error("Missing PIXABAY_API_KEY in environment");

  const q = encodeURIComponent((s.visualKeywords?.join(" ") || s.text || "corporate presentation").slice(0, 200));
  const url = `https://pixabay.com/api/videos/?key=${key}&q=${q}&video_type=film&safesearch=true&per_page=10&order=popular`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Pixabay error ${res.status}`);
  const json = await res.json();
  const hits = Array.isArray(json?.hits) ? json.hits : [];
  if (!hits.length) throw new Error("No Pixabay results");

  const first = hits[0];
  const fileUrl = first?.videos?.medium?.url || first?.videos?.small?.url || first?.videos?.large?.url;
  if (!fileUrl) throw new Error("No video URL found in Pixabay hit");

  const tmpDir = path.resolve(".cache", "pixabay");
  const fileName = path.basename(new URL(fileUrl).pathname) || `pixabay_${first.id}.mp4`;
  const localPath = path.resolve(tmpDir, fileName);
  await download(fileUrl, localPath);

  return {
    selected: [localPath],
    first: localPath,
    fallback: localPath,
    meta: { id: first.id, duration: first.duration, tags: first.tags, user: first.user },
  };
}

