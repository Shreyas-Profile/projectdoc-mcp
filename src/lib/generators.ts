import { llm } from "./llm";

/**
 * The four artefacts ProjectDoc generates for a project. Each returns a
 * Markdown string suitable for dropping straight into a repo's /docs
 * folder. Cost report also emits an approximate ₹ figure derived from LLM
 * reasoning about scope (rough, but honest).
 */

export interface ProjectBrief {
  name: string;
  description: string;
  audience?: string;
  goals?: string;
}

const SHARED_SYSTEM = `You are ProjectDoc, an autonomous project management agent inside Globalion Nova.
Your job is to produce clear, structured project artefacts that a real project manager
would sign off on. Never invent facts about specific companies, people, or budgets — reason
from the brief you are given. Output ONLY the requested Markdown, no preamble.`;

export async function generateProjectPlan(brief: ProjectBrief): Promise<string> {
  return await llm({
    system: SHARED_SYSTEM,
    user: `Produce a project plan in Markdown for the following project.

Project: ${brief.name}
Description: ${brief.description}
${brief.audience ? `Audience: ${brief.audience}\n` : ""}${brief.goals ? `Goals: ${brief.goals}\n` : ""}

Structure the plan with:
- ## Vision (2–3 sentences)
- ## Success criteria (3–5 bullet points, each measurable)
- ## Milestones (table: milestone, deliverable, week #)
- ## Team + roles (assume 1–3 people, name the roles not real people)
- ## Risks + mitigation (top 3)
- ## Definition of done

Be specific to this project, not generic. Keep to ~350 words.`,
    temperature: 0.4,
    maxTokens: 1500,
  });
}

export async function generateUserFlows(brief: ProjectBrief): Promise<string> {
  return await llm({
    system: SHARED_SYSTEM,
    user: `Produce user flows in Markdown for the following project.

Project: ${brief.name}
Description: ${brief.description}
${brief.audience ? `Audience: ${brief.audience}\n` : ""}

Structure:
- ## Primary personas (2–3, each with 1-line goal)
- ## Core flows (for each: heading, then arrow-notation steps like:
    Landing page → Sign in → Dashboard → …
  Aim for 3–5 flows. Include the *unhappy path* for one of them.
- ## Wireframe hints (a few bullets on key screens)

Keep to ~350 words.`,
    temperature: 0.4,
    maxTokens: 1500,
  });
}

export async function generateArchitecture(brief: ProjectBrief): Promise<string> {
  return await llm({
    system: SHARED_SYSTEM,
    user: `Produce a technical architecture in Markdown for the following project.

Project: ${brief.name}
Description: ${brief.description}

Structure:
- ## Stack (frontend, backend, DB, hosting — with justification)
- ## Data model (list of tables/collections with key fields)
- ## Integrations (external APIs, MCPs, LLMs — with why)
- ## Deployment (Docker/K8s, environment, scaling notes)
- ## ASCII diagram (a simple boxes-and-arrows diagram in a code block)

Keep to ~350 words.`,
    temperature: 0.4,
    maxTokens: 1500,
  });
}

export async function generateCostReport(brief: ProjectBrief): Promise<string> {
  return await llm({
    system: SHARED_SYSTEM,
    user: `Produce a build-cost report in Markdown for the following project.

Project: ${brief.name}
Description: ${brief.description}

Compare two paths honestly:

## Manual build cost
Reason about the effort in engineer-weeks. Assume:
- Senior engineer (India): ₹1,50,000/week
- Junior engineer (India): ₹60,000/week
- QA: ₹40,000/week
Estimate weeks for each role; sum to a range.

## Nova + BuildOps cost
Assume:
- BuildOps time: ~2–4 hours per feature vs. days manually
- OpenRouter/LLM calls: ~₹10–100/day active use
- Hetzner infra: ₹1,500/month
Estimate for the same feature scope.

## Delta
Show savings absolute and as %. One-line takeaway.

Be honest — if the project is simple enough that manual is cheap, say so.
Keep to ~250 words.`,
    temperature: 0.3,
    maxTokens: 1000,
  });
}
