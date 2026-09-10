"use client";
import React, { useState } from "react";

export default function PipelinePage() {
  const [jsonText, setJsonText] = useState<string>(JSON.stringify({
    sessions: [
      { id: "s1", text: "Welcome to our demo video.", topic: "intro", pacingSeconds: 6 },
      { id: "s2", text: "We fetch visuals from Pixabay and add narration.", topic: "flow", pacingSeconds: 8 },
    ],
  }, null, 2));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ final?: string; sessions?: string[]; error?: string } | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const resp = await fetch("/api/pipeline/run", { method: "POST", body: jsonText });
      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e?.message || String(e) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Video Pipeline</h1>
      <p>Paste or upload your JSON sessions and run.</p>
      <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} style={{ width: "100%", height: 240, fontFamily: "monospace" }} />
      <div style={{ marginTop: 12 }}>
        <button onClick={run} disabled={running}>
          {running ? "Running..." : "Run Pipeline"}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          {result.error ? (
            <div style={{ color: "red" }}>Error: {result.error}</div>
          ) : (
            <div>
              <div>Final: {result.final}</div>
              <div>Sessions:</div>
              <ul>
                {(result.sessions || []).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
