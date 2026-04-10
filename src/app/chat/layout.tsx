import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat",
  description:
    "Chat with Delta Saraswati AI assistant. Get live crypto market insights, analysis, and trading intelligence powered by Groq and Llama 3.3.",
  openGraph: {
    title: "AI Chat | Delta Saraswati",
    description:
      "Chat with AI assistant. Live crypto market intelligence powered by Groq and Llama 3.3.",
    images: [
      {
        url: "/api/og?title=AI+Chat&description=Live+Market+Intelligence",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat | Delta Saraswati",
    description:
      "Chat with AI assistant. Live crypto market intelligence powered by Groq and Llama 3.3.",
    images: ["/api/og?title=AI+Chat&description=Live+Market+Intelligence"],
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
