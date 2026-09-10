"use client";

import { useEffect, useRef, useState } from "react";

const PREVIEW_ORIGIN = typeof window === "undefined" ? "" : window.location.origin;

export default function VideoConverter() {
  const [bridgeStatus, setBridgeStatus] = useState("Loading local preview...");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [htmlVideoReady, setHtmlVideoReady] = useState(false);
  const [htmlVideoInfo, setHtmlVideoInfo] = useState<{ sceneCount: number; totalDuration: number } | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const stopPolling = () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };

    const poll = (project: string) => {
      stopPolling();
      let attempts = 0;
      pollRef.current = window.setInterval(async () => {
        attempts += 1;
        try {
          const response = await fetch(`/api/render-status?id=${encodeURIComponent(project)}`);
          const data = await response.json().catch(() => null);
          if (!response.ok || !data || data.success === false) throw new Error(data?.error || "Render status request failed.");
          const status = String(data.status || "").toLowerCase();
          if (data.videoUrl || status === "done") {
            stopPolling();
            if (!data.videoUrl) throw new Error("Render completed without a video URL.");
            setVideoUrl(data.videoUrl);
            setBridgeStatus("Pipeline 10/10: Complete");
            return;
          }
          if (["error", "failed", "cancelled", "canceled", "rejected"].includes(status)) {
            stopPolling();
            throw new Error(data.message || data.error || `Render ${status}`);
          }
          setBridgeStatus(`Pipeline 10/10: Rendering (${status || "queued"})`);
          if (attempts >= 36) {
            stopPolling();
            throw new Error("Render polling timed out.");
          }
        } catch (error) {
          stopPolling();
          setRenderError(error instanceof Error ? error.message : String(error));
          setBridgeStatus("Pipeline 10/10: Failed");
        }
      }, 5000);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== PREVIEW_ORIGIN || event.data?.source !== "document-preview-iframe") return;
      const { type, payload } = event.data;
      if (type === "iframe-ready") setBridgeStatus("Local preview ready");
      if (type === "conversion-started") { setVideoUrl(null); setRenderError(null); setHtmlVideoReady(false); setHtmlVideoInfo(null); setBridgeStatus(`Pipeline 1-7/10: processing ${payload?.fileName || "document"}...`); }
      if (type === "movie-ready") setBridgeStatus(`Pipeline 8-9/10: Movie JSON built and validated (${payload?.movie?.scenes?.length || 0} scenes)`);
      if (type === "conversion-complete") setBridgeStatus("Pipeline 1-9/10 complete: validated Movie JSON ready");
      if (type === "render-response") {
        if (!payload?.success) { setRenderError(payload?.error || payload?.message || "Render submission failed."); setBridgeStatus("Pipeline 10/10: Failed"); return; }
        const project = payload.project || payload.renderId || payload.jobId;
        if (!project) { setRenderError("JSON2Video did not return a project ID."); setBridgeStatus("Pipeline 10/10: Failed"); return; }
        setBridgeStatus("Pipeline 10/10: Submitting to JSON2Video");
        poll(String(project));
      }
      if (type === "render-complete") {
        if (payload?.videoUrl) { setVideoUrl(payload.videoUrl); return; }
        if (payload?.mode === "html-preview") {
          setHtmlVideoReady(true);
          setHtmlVideoInfo({ sceneCount: payload?.sceneCount || 0, totalDuration: payload?.totalDuration || 0 });
          setBridgeStatus(`Pipeline 10/10: Complete (HTML/CSS video, ${payload?.sceneCount || 0} scenes)`);
        }
      }
      if (type === "preview-error") { setRenderError(payload?.message || "Preview error"); setBridgeStatus("Pipeline failed"); }
    };
    window.addEventListener("message", handleMessage);
    return () => { window.removeEventListener("message", handleMessage); stopPolling(); };
  }, []);

  return (
    <main className="min-h-screen bg-pink-50 p-2 sm:p-4">
      <div className="mx-auto w-full max-w-[1440px] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-pink-100">
        <div className="border-b border-pink-100 px-4 py-2 text-xs text-slate-500 sm:px-6">{bridgeStatus}</div>
        <iframe title="VideoConverter Pro document preview" src="/document-preview.html" className="block h-[calc(100vh-1rem)] min-h-[900px] w-full border-0 sm:h-[calc(100vh-2rem)]" allow="fullscreen" />
        {renderError ? <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-6">{renderError}</div> : null}
        {videoUrl ? <section className="mx-4 mb-6 rounded-xl border border-green-200 bg-green-50 p-4 sm:mx-6"><h2 className="mb-3 font-semibold text-green-900">Rendered Video</h2><video className="w-full rounded-lg bg-black" controls playsInline src={videoUrl} /><a className="mt-3 inline-block text-sm font-semibold text-pink-700 underline" href={videoUrl} target="_blank" rel="noreferrer" download>Download MP4</a></section> : null}
        {htmlVideoReady && !videoUrl ? <div className="mx-4 mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 sm:mx-6">Video ready: playing as an HTML/CSS presentation above ({htmlVideoInfo?.sceneCount || 0} scenes, {Math.round(htmlVideoInfo?.totalDuration || 0)}s). Use fullscreen in the player for a video-like view.</div> : null}
      </div>
    </main>
  );
}