import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * DEV-ONLY file server for local storage.
 *
 * UNAUTHENTICATED. 
 */
const ROOT = path.join(process.cwd(), ".storage");

type RouteContext = {
  params: { key: string[] };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const key = context.params.key.join("/");
  const fullPath = path.join(ROOT, key);

  // Prevent path traversal outside ROOT.
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(path.resolve(ROOT))) {
    return NextResponse.json(
      { success: false, error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const data = await fs.readFile(resolved);

    const ext = path.extname(resolved).toLowerCase();
    const type =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
}