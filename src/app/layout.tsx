import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectDoc — Nova agent that writes and maintains project docs",
  description:
    "Give it a brief, get back a project plan, user flows, architecture, and a build-cost comparison. Runs on Nova + OpenRouter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
