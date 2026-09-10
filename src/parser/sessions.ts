import { z } from "zod";
import type { PipelineInput, Session } from "../types";

const SessionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  topic: z.string().optional(),
  pacingSeconds: z.number().positive().optional(),
  durationSeconds: z.number().positive().optional(),
  keywords: z.array(z.string()).optional(),
});

const PipelineSchema = z.object({
  sessions: z.array(SessionSchema).min(1),
});

export function parseSessionsFromJson(jsonStr: string): PipelineInput {
  const raw = JSON.parse(jsonStr);
  const parsed = PipelineSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      "Invalid pipeline JSON: " + JSON.stringify(parsed.error.format())
    );
  }
  return parsed.data as PipelineInput;
}

export function* iterateSessions(input: PipelineInput): Generator<Session> {
  for (const s of input.sessions) {
    yield s;
  }
}
