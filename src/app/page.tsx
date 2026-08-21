"use client";

import { useState } from "react";

type Artefacts = { plan: string; flows: string; architecture: string; cost: string };

export default function Home() {
  const [name, setName] = useState("Payroll app for Bank X");
  const [description, setDescription] = useState(
    "A payroll application for mid-size Indian banks. Employees log in with SSO, view current and past salary slips, download form-16, and raise queries. HR admins upload monthly salary CSV and approve queries."
  );
  const [audience, setAudience] = useState("Bank employees and HR administrators");
  const [goals, setGoals] = useState("Cut salary-query resolution time in half. Zero paper.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artefacts, setArtefacts] = useState<Artefacts | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setArtefacts(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, audience, goals }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError(err.error || err.detail || `HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      setArtefacts(json.artefacts);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#f59e0b", marginBottom: 8 }}>
          NOVA · AGENT · PROJECTDOC
        </div>
        <h1 style={{ fontSize: 40, margin: "0 0 8px", lineHeight: 1.15 }}>
          Your project docs, written and maintained by an agent.
        </h1>
        <p style={{ color: "#94a3b8", margin: 0, maxWidth: 720 }}>
          Give it the brief once. Get back a project plan, user flows, technical architecture, and a
          build-cost comparison (Nova vs. manual). Runs on OpenRouter + Nova.
        </p>
      </header>

      <section
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 14,
          padding: 28,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Project name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Audience</span>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Description (the more specific, the better)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Goals (optional)</span>
          <input value={goals} onChange={(e) => setGoals(e.target.value)} style={inputStyle} />
        </label>
        <button
          onClick={generate}
          disabled={busy}
          style={{
            padding: "12px 22px",
            borderRadius: 10,
            background: busy ? "#4b5563" : "#f59e0b",
            color: "#0b1220",
            border: "none",
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Generating all four artefacts…" : "Generate project docs"}
        </button>
      </section>

      {error ? (
        <div
          style={{
            background: "#450a0a",
            border: "1px solid #7f1d1d",
            padding: 16,
            borderRadius: 10,
            marginBottom: 20,
            color: "#fecaca",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {artefacts ? (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <Artefact title="Project plan" md={artefacts.plan} />
          <Artefact title="User flows" md={artefacts.flows} />
          <Artefact title="Architecture" md={artefacts.architecture} />
          <Artefact title="Cost report" md={artefacts.cost} />
        </div>
      ) : null}

      <footer style={{ marginTop: 60, color: "#64748b", fontSize: 12 }}>
        MCP endpoint: <code>POST /api/mcp</code> · direct REST: <code>POST /api/generate</code>
      </footer>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #334155",
  color: "#e5e7eb",
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
};

function Artefact({ title, md }: { title: string; md: string }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3 style={{ margin: "0 0 12px", color: "#f59e0b", fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {title}
      </h3>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          margin: 0,
          fontSize: 13,
          lineHeight: 1.55,
          color: "#cbd5e1",
        }}
      >
        {md}
      </pre>
    </div>
  );
}
