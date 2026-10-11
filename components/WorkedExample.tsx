// Server component. Plain-text/Unicode math so it renders without KaTeX and is fully crawlable.
export type Step = { math: string; why: string };
export type Example = { id: string; title: string; problem: string; steps: Step[]; answer: string; check?: string };

export function WorkedExample({ ex, headingLevel = 3 }: { ex: Example; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section id={ex.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
      <H style={{ fontWeight: 700, marginBottom: "0.4rem" }}>{ex.title}</H>
      <p style={{ fontFamily: "ui-monospace,monospace", fontSize: "1.05rem", marginBottom: "0.75rem" }}>{ex.problem}</p>
      <ol style={{ paddingLeft: "1.25rem", display: "grid", gap: "0.5rem" }}>
        {ex.steps.map((s, i) => (
          <li key={i}>
            <span style={{ fontFamily: "ui-monospace,monospace" }}>{s.math}</span>
            <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", lineHeight: 1.6 }}>{s.why}</div>
          </li>
        ))}
      </ol>
      <p style={{ marginTop: "0.75rem", fontWeight: 700 }}>Answer: <span style={{ color: "var(--accent)" }}>{ex.answer}</span></p>
      {ex.check && <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Check: {ex.check}</p>}
    </section>
  );
}
