import * as fs from "fs";
import * as path from "path";
import { parseSessionsFromJson, iterateSessions } from "../parser/sessions";
import { renderSessionVideo } from "./sessionRenderer";
import { stitchSessionsToFinal } from "./stitcher";

export async function runPipelineFromJson(jsonStr: string): Promise<{ final: string; sessions: string[] }>{
  const input = parseSessionsFromJson(jsonStr);
  const rendered: string[] = [];
  for (const s of iterateSessions(input)) {
    const out = await renderSessionVideo(s);
    rendered.push(out);
  }
  const finalPath = await stitchSessionsToFinal(rendered);
  return { final: finalPath, sessions: rendered };
}
