import { NextRequest, NextResponse } from "next/server";
import {
  generateProjectPlan,
  generateUserFlows,
  generateArchitecture,
  generateCostReport,
  type ProjectBrief,
} from "@/lib/generators";

/**
 * MCP-compatible JSON-RPC endpoint. Implements the minimum surface Nova (or
 * any MCP client) needs to discover + call ProjectDoc's tools:
 *   - initialize
 *   - tools/list
 *   - tools/call
 *
 * Auth: Bearer token in Authorization header must equal PROJECTDOC_TOKEN
 * (or omitted if no token is set — dev mode). Kept dead simple so we can
 * upgrade to per-user tokens later without breaking the shape.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TOOLS = [
  {
    name: "generate_project_plan",
    description: "Generate a project plan (vision, criteria, milestones, team, risks, DoD) from a brief.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        audience: { type: "string" },
        goals: { type: "string" },
      },
      required: ["name", "description"],
    },
  },
  {
    name: "generate_user_flows",
    description: "Generate personas + step-by-step user flows for a project.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        audience: { type: "string" },
      },
      required: ["name", "description"],
    },
  },
  {
    name: "generate_architecture",
    description: "Generate stack, data model, integrations, deployment, and a simple ASCII diagram.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name", "description"],
    },
  },
  {
    name: "generate_cost_report",
    description: "Estimate manual build cost vs. Nova + BuildOps cost. Honest ranges in INR.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name", "description"],
    },
  },
];

async function callTool(name: string, args: Record<string, string>) {
  const brief: ProjectBrief = {
    name: args.name,
    description: args.description,
    audience: args.audience,
    goals: args.goals,
  };
  switch (name) {
    case "generate_project_plan":
      return await generateProjectPlan(brief);
    case "generate_user_flows":
      return await generateUserFlows(brief);
    case "generate_architecture":
      return await generateArchitecture(brief);
    case "generate_cost_report":
      return await generateCostReport(brief);
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

function checkAuth(req: NextRequest): { ok: true } | { ok: false; res: Response } {
  const required = process.env.PROJECTDOC_TOKEN;
  if (!required) return { ok: true };
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (got !== required) {
    return {
      ok: false,
      res: NextResponse.json({ error: { code: -32001, message: "unauthorized" } }, { status: 401 }),
    };
  }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) return auth.res;

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || typeof raw.method !== "string") {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "invalid request" }, id: null },
      { status: 400 }
    );
  }
  const id = raw.id ?? null;

  try {
    if (raw.method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "projectdoc-mcp", version: "0.1.0" },
          capabilities: { tools: {} },
        },
      });
    }
    if (raw.method === "tools/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    }
    if (raw.method === "tools/call") {
      const { name, arguments: args } = raw.params ?? {};
      const text = await callTool(name, args ?? {});
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text }] },
      });
    }
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${raw.method}` } },
      { status: 404 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32000, message: msg } }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "projectdoc-mcp",
    tools: TOOLS.map((t) => t.name),
    hint: "POST JSON-RPC 2.0 to this same URL",
  });
}
