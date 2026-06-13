import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obsidian LLM Wiki POC",
  description: "Multi-Agent 업무 Wiki POC with an Obsidian Vault backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
