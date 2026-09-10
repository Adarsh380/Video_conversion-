import { NextRequest } from "next/server";

export const runtime = "nodejs";

const path = require("path");
const { parseDocument } = require("../../../services/document-parser.js");

export async function POST(req: NextRequest) {
  try {
    const filename = req.headers.get("x-filename") || "upload.bin";
    const buffer = Buffer.from(await req.arrayBuffer());

    if (!buffer || buffer.length === 0) {
      return Response.json(
        { success: false, error: "Empty file upload" },
        { status: 400 }
      );
    }

    const parsed = await parseDocument(buffer, String(filename));
    const meta = {
      fileName: filename,
      fileType: path.extname(filename).toLowerCase().replace(".", "") || "unknown",
      pageCount: Number(parsed.pageCount || (parsed.pages ? parsed.pages.length : 0) || 0),
      uploadDate: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      metadata: meta,
      pages: parsed.pages || [],
      fullText: parsed.fullText || "",
      needsOcr: !!parsed.needsOcr,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 400 }
    );
  }
}
