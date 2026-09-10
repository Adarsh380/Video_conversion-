import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ffmpeg = require("fluent-ffmpeg");
const { resolveBrowserExecutable } = require("../../../services/browser-executable.js");

// ffmpeg-static's own module.exports path gets rewritten by Next.js/webpack bundling
// (resolves into .next/server/vendor-chunks instead of node_modules), so resolve the
// real on-disk binary directly from node_modules rather than trusting the package export.
function resolveFfmpegPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const ffmpegPath = resolveFfmpegPath();
console.log("[export-video] ffmpeg executable resolved", { ffmpegPath });
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;

// Diagnostic step timings/timeouts (temporary, see step logs below).
const LAUNCH_TIMEOUT_MS = 20000;
const NEWPAGE_TIMEOUT_MS = 10000;
const GOTO_TIMEOUT_MS = 20000;
const EXPORT_READY_TIMEOUT_MS = 15000;
const LOAD_MOVIE_TIMEOUT_MS = 10000;
const FRAME_TIMEOUT_MS = 10000;
const FFMPEG_TIMEOUT_MS = 120000;

function log(step: string, extra?: unknown) {
  console.log(`[export-video] ${step}`, extra !== undefined ? extra : "");
}

function withTimeout<T>(promise: Promise<T>, ms: number, step: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms at step: ${step}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

function getTotalDuration(movie: any): number {
  const scenes = Array.isArray(movie?.scenes) ? movie.scenes : [];
  return scenes.reduce((total: number, scene: any) => {
    const d = Number(scene?.duration);
    return total + (Number.isFinite(d) && d > 0 ? d : 0);
  }, 0);
}

function installTemporaryCrashGuard(getStep: () => string): () => void {
  // Puppeteer/Edge can emit stray async errors during/after teardown; without this,
  // an unhandled rejection here can crash the whole dev server and turn an already
  // successful render into an HTML 500 for the in-flight request.
  const onRejection = (reason: unknown) => {
    console.error(`[export-video] unhandled rejection near step "${getStep()}" (suppressed):`, reason);
  };
  const onException = (err: unknown) => {
    console.error(`[export-video] uncaught exception near step "${getStep()}" (suppressed):`, err);
  };
  process.on("unhandledRejection", onRejection);
  process.on("uncaughtException", onException);
  return () => {
    process.off("unhandledRejection", onRejection);
    process.off("uncaughtException", onException);
  };
}

export async function POST(req: NextRequest) {
  let browser: any = null;
  let frameDir: string | null = null;
  let step = "request received";
  const uninstallCrashGuard = installTemporaryCrashGuard(() => step);
  log(step);

  try {
    step = "request body parsed";
    const body = await req.json().catch(() => null);
    const movie = body?.movie;
    log(step, { hasMovie: !!movie, sceneCount: Array.isArray(movie?.scenes) ? movie.scenes.length : 0 });
    if (!movie || !Array.isArray(movie.scenes) || !movie.scenes.length) {
      return Response.json({ success: false, step, error: "Missing or invalid movie JSON (no scenes)" }, { status: 400 });
    }

    step = "movie JSON validated";
    const totalDuration = getTotalDuration(movie);
    log(step, { totalDuration });
    if (!(totalDuration > 0)) {
      return Response.json({ success: false, step, error: "Movie has no positive total duration" }, { status: 400 });
    }

    step = "browser executable resolved";
    const executablePath = resolveBrowserExecutable();
    log(step, { executablePath });
    if (!executablePath) {
      return Response.json(
        { success: false, step, error: "No local Chrome/Edge executable found for server-side rendering. Set PUPPETEER_EXECUTABLE_PATH." },
        { status: 500 }
      );
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    frameDir = path.join(process.cwd(), "tmp", "export", jobId);
    fs.mkdirSync(frameDir, { recursive: true });

    const origin = req.nextUrl.origin;

    step = "puppeteer/edge launch started";
    log(step);
    browser = await withTimeout(
      puppeteer.launch({
        executablePath,
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }),
      LAUNCH_TIMEOUT_MS,
      step
    );
    step = "browser launched";
    log(step);

    step = "new page created";
    const page = await withTimeout(browser.newPage(), NEWPAGE_TIMEOUT_MS, step);
    log(step);

    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    step = "page.goto started";
    log(step, { url: `${origin}/document-preview.html` });
    await withTimeout(
      page.goto(`${origin}/document-preview.html`, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS }),
      GOTO_TIMEOUT_MS,
      step
    );
    step = "page.goto completed";
    log(step);

    step = "__EXPORT__ found";
    await withTimeout(page.waitForFunction("!!window.__EXPORT__", { timeout: EXPORT_READY_TIMEOUT_MS }), EXPORT_READY_TIMEOUT_MS, step);
    log(step);

    step = "movie loaded into document-preview.html";
    const loaded = await withTimeout(
      page.evaluate((movieArg: any) => (window as any).__EXPORT__.loadMovie(movieArg), movie),
      LOAD_MOVIE_TIMEOUT_MS,
      step
    );
    log(step, { loaded });
    if (!loaded) throw new Error("Renderer failed to load movie for export");

    step = "total duration obtained";
    const totalFrames = Math.max(1, Math.round(totalDuration * FPS));
    log(step, { totalDuration, totalFrames, fps: FPS });

    step = "frame capture started";
    log(step);
    for (let i = 0; i < totalFrames; i++) {
      const t = i / FPS;
      await withTimeout(page.evaluate((tArg: number) => (window as any).__EXPORT__.seek(tArg), t), FRAME_TIMEOUT_MS, `seek frame ${i}`);
      const viewportHandle = await page.$(".viewport");
      if (!viewportHandle) throw new Error("Preview viewport element not found in renderer");
      const framePath = path.join(frameDir, `frame_${String(i).padStart(6, "0")}.png`);
      await withTimeout(viewportHandle.screenshot({ path: framePath }), FRAME_TIMEOUT_MS, `screenshot frame ${i}`);

      if (i === 0) log("first frame captured");
      if (i > 0 && i % 30 === 0) log("frame capture progress", { frame: i, totalFrames });
    }
    step = "frame capture completed";
    log(step, { totalFrames });

    step = "browser closed after capture";
    try {
      await browser.close();
    } catch (closeErr: any) {
      log("browser.close() after capture failed (non-fatal)", { error: closeErr?.message || String(closeErr) });
    }
    browser = null;
    log(step);

    step = "ffmpeg started";
    log(step);
    const outputName = `${jobId}.mp4`;
    const exportsDir = path.join(process.cwd(), "public", "exports");
    fs.mkdirSync(exportsDir, { recursive: true });
    const outputPath = path.join(exportsDir, outputName);

    await withTimeout(
      new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(path.join(frameDir as string, "frame_%06d.png"))
          .inputFPS(FPS)
          .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-movflags +faststart"])
          .fps(FPS)
          .noAudio()
          .on("error", (err: Error) => reject(err))
          .on("end", () => resolve())
          .save(outputPath);
      }),
      FFMPEG_TIMEOUT_MS,
      step
    );
    step = "ffmpeg completed";
    log(step);

    step = "MP4 written";
    const outputStats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
    log(step, { outputPath, exists: !!outputStats, sizeBytes: outputStats?.size ?? 0 });
    if (!outputStats || outputStats.size <= 0) {
      throw new Error(`FFmpeg reported success but output file is missing or empty: ${outputPath}`);
    }

    const responsePayload = {
      success: true,
      videoUrl: `/exports/${outputName}`,
      duration: totalDuration,
      durationSeconds: totalDuration,
      frameCount: totalFrames,
      resolution: { width: WIDTH, height: HEIGHT },
      fps: FPS,
    };

    step = "response returned";
    log("ABOUT TO RETURN SUCCESS RESPONSE", responsePayload);
    return Response.json(responsePayload);
  } catch (error: any) {
    log(`FAILED at step: ${step}`, { error: error?.message || String(error) });
    return Response.json({ success: false, step, error: error?.message || String(error) }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        log("browser.close() in finally failed (non-fatal)", { error: (e as any)?.message || String(e) });
      }
    }
    if (frameDir) {
      try {
        fs.rmSync(frameDir, { recursive: true, force: true });
      } catch (e) {
        log("frame directory cleanup failed (non-fatal)", { error: (e as any)?.message || String(e) });
      }
    }
    uninstallCrashGuard();
    log("cleanup completed");
  }
}
