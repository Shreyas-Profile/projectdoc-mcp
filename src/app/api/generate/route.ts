import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateProjectPlan,
  generateUserFlows,
  generateArchitecture,
  generateCostReport,
  type ProjectBrief,
} from "@/lib/generators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(4000),
  audience: z.string().max(400).optional(),
  goals: z.string().max(1000).optional(),
  artefacts: z
    .array(z.enum(["plan", "flows", "architecture", "cost"]))
    .default(["plan", "flows", "architecture", "cost"]),
});

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", detail: parsed.error.flatten() }, { status: 400 });
  }
  const brief: ProjectBrief = {
    name: parsed.data.name,
    description: parsed.data.description,
    audience: parsed.data.audience,
    goals: parsed.data.goals,
  };
  const wanted = new Set(parsed.data.artefacts);

  try {
    // Run in parallel — each artefact is independent.
    const [plan, flows, architecture, cost] = await Promise.all([
      wanted.has("plan") ? generateProjectPlan(brief) : Promise.resolve(""),
      wanted.has("flows") ? generateUserFlows(brief) : Promise.resolve(""),
      wanted.has("architecture") ? generateArchitecture(brief) : Promise.resolve(""),
      wanted.has("cost") ? generateCostReport(brief) : Promise.resolve(""),
    ]);
    return NextResponse.json({ ok: true, brief, artefacts: { plan, flows, architecture, cost } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "llm_failure", detail: msg }, { status: 502 });
  }
}
