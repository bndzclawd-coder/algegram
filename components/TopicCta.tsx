import Link from "next/link";
import { GUEST_FREE_QUESTIONS } from "@/lib/site-config";

export function TopicCta({ prefill, label = "Try your own problem" }: { prefill: string; label?: string }) {
  return (
    <aside style={{ background: "rgba(108,99,255,.08)", border: "1px solid rgba(108,99,255,.3)", borderRadius: 14, padding: "1.5rem", textAlign: "center", margin: "2rem 0" }}>
      <p style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.4rem" }}>{label}</p>
      <p style={{ color: "var(--text-dim)", marginBottom: "1rem" }}>
        Type it in and get every step explained. {GUEST_FREE_QUESTIONS} free questions, no sign-up needed.
      </p>
      <Link href={`/?q=${encodeURIComponent(prefill)}#try`}
        style={{ background: "var(--accent)", color: "#fff", padding: "0.8rem 2rem", borderRadius: 12, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
        Try a free question →
      </Link>
    </aside>
  );
}
