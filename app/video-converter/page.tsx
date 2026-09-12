"use client";

import { useEffect, useRef, useState } from "react";

const PREVIEW_ORIGIN = typeof window === "undefined" ? "" : window.location.origin;

export default function VideoConverter() {
  const [bridgeStatus, setBridgeStatus] = useState("Preparing your workspace...");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
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
            setBridgeStatus("Video ready");
            return;
          }
          if (["error", "failed", "cancelled", "canceled", "rejected"].includes(status)) {
            stopPolling();
            throw new Error(data.message || data.error || `Render ${status}`);
          }
          setBridgeStatus(`Building your video...`);
          if (attempts >= 36) {
            stopPolling();
            throw new Error("Render polling timed out.");
          }
        } catch (error) {
          stopPolling();
          console.error("Render polling failed", error); setRenderError("Something went wrong while creating your video. Please try again.");
          setBridgeStatus("Something went wrong while creating your video. Please try again.");
        }
      }, 5000);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== PREVIEW_ORIGIN || event.data?.source !== "document-preview-iframe") return;
      const { type, payload } = event.data;
      if (type === "iframe-ready") setBridgeStatus("Preparing your workspace...");
      if (type === "conversion-started") { setVideoUrl(null); setSelectedFilename(payload?.filename || payload?.fileName || payload?.name || null); setRenderError(null); setHtmlVideoReady(false); setHtmlVideoInfo(null); setBridgeStatus(`Analyzing your document...`); }
      if (type === "movie-ready") setBridgeStatus(`Building your video...`);
      if (type === "conversion-complete") setBridgeStatus("Preparing your preview...");
      if (type === "render-response") {
        if (!payload?.success) { console.error("Render submission failed", payload); setRenderError("Something went wrong while creating your video. Please try again."); setBridgeStatus("Something went wrong while creating your video. Please try again."); return; }
        const project = payload.project || payload.renderId || payload.jobId;
        if (!project) { console.error("Render response did not include a project ID", payload); setRenderError("Something went wrong while creating your video. Please try again."); setBridgeStatus("Something went wrong while creating your video. Please try again."); return; }
        setBridgeStatus("Building your video...");
        poll(String(project));
      }
      if (type === "render-complete") {
        if (payload?.videoUrl) { setVideoUrl(payload.videoUrl); setBridgeStatus("Video ready"); return; }
        if (payload?.mode === "html-preview") {
          setHtmlVideoReady(true);
          setHtmlVideoInfo({ sceneCount: payload?.sceneCount || 0, totalDuration: payload?.totalDuration || 0 });
          setBridgeStatus("Building your video...");
        }
      }
      if (type === "preview-error") { console.error("Preview failed", payload); setRenderError("Something went wrong while creating your video. Please try again."); setBridgeStatus("Something went wrong while creating your video. Please try again."); }
    };
    window.addEventListener("message", handleMessage);
    return () => { window.removeEventListener("message", handleMessage); stopPolling(); };
  }, []);

  return (
    <main className="min-h-screen bg-pink-50 p-3 sm:p-5">
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-2xl bg-white p-5 shadow-xl ring-1 ring-pink-100 sm:p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pink-600">VideoConverter Pro</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your video</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Upload a document to begin.</p>
          </div>
          <div className="mt-8 border-t border-pink-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{bridgeStatus}</p>
            {selectedFilename ? <p className="mt-3 truncate rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-800" title={selectedFilename}>{selectedFilename}</p> : null}
          </div>
          {renderError ? <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"><p>{renderError}</p><button type="button" className="mt-3 rounded-md bg-red-700 px-3 py-1.5 font-semibold text-white" onClick={() => { setRenderError(null); setBridgeStatus("Preparing your workspace..."); window.frames[0]?.location.reload(); }}>Try again</button></div> : null}
          {videoUrl ? <section className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4"><h2 className="font-semibold text-green-900">Video ready</h2><a className="mt-3 inline-block text-sm font-semibold text-pink-700 underline" href={videoUrl} target="_blank" rel="noreferrer" download>Download video</a></section> : null}
          {htmlVideoReady && !videoUrl ? <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Preview available</div> : null}
        </aside>
        <section className="min-w-0 overflow-hidden rounded-2xl bg-white p-3 shadow-xl ring-1 ring-pink-100 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-pink-100 px-2 pb-4 sm:px-1">
            <h2 className="text-lg font-semibold text-slate-900">Video preview</h2>
            <span className="text-xs text-slate-400">{bridgeStatus}</span>
          </div>
          <iframe title="VideoConverter Pro document preview" src="/document-preview.html" className="mt-4 block h-[70vh] min-h-[620px] w-full rounded-xl border border-pink-100 bg-slate-50" allow="fullscreen" />
        </section>
      </div>
    </main>
  );
}