// Shared wrappers for topic pages (live site uses inline styles + CSS vars, so we match that).
import type { ReactNode } from "react";
export const Page = ({ children }: { children: ReactNode }) => (
  <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1rem 4rem", lineHeight: 1.7 }}>{children}</main>
);
export const H1 = ({ children }: { children: ReactNode }) => (
  <h1 style={{ fontSize: "clamp(1.75rem,5vw,2.5rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "1rem" }}>{children}</h1>
);
export const H2 = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} style={{ fontWeight: 800, fontSize: "clamp(1.2rem,4vw,1.5rem)", margin: "2rem 0 0.75rem" }}>{children}</h2>
);
export const P = ({ children }: { children: ReactNode }) => <p style={{ marginBottom: "1rem" }}>{children}</p>;
export const Lead = ({ children }: { children: ReactNode }) => (
  <p style={{ fontSize: "1.05rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>{children}</p>
);
export const Ul = ({ children }: { children: ReactNode }) => <ul style={{ paddingLeft: "1.25rem", marginBottom: "1rem", listStyle: "disc" }}>{children}</ul>;
export const M = ({ children }: { children: ReactNode }) => <code style={{ fontFamily: "ui-monospace,monospace" }}>{children}</code>;
