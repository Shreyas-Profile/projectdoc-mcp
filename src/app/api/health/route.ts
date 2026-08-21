import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "projectdoc-mcp",
    version: "0.1.0",
    time: new Date().toISOString(),
    llm: Boolean(process.env.OPENROUTER_API_KEY),
  });
}
