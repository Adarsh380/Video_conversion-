import { NextRequest } from "next/server";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const parsed = JSON.parse(body || '{}');
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.map((session: any, index: number) => `session-${index + 1}`)
      : [];

    return new Response(
      JSON.stringify({
        final: "/video-output/demo.mp4",
        sessions,
        message: "Pipeline executed in demo mode. Replace /src/render/runPipeline with your production renderer.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
