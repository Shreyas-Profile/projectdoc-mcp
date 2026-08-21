/**
 * Small OpenRouter wrapper — used by ProjectDoc's generator endpoints to
 * turn a project brief into the requested artefact (plan, user flows,
 * architecture, or cost report). Keeps everything in one place so the
 * per-endpoint route files stay tiny.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL = process.env.PROJECTDOC_MODEL || "openai/gpt-5-mini";

export interface LLMOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
}

export async function llm(opts: LLMOptions): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 4000,
  };
  if (opts.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://projectdoc.regiq.in",
      "X-Title": "ProjectDoc MCP",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  return content.trim();
}
