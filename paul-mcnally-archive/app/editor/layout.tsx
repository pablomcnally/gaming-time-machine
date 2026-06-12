import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Musings Editor",
  robots: {
    index: false,
    follow: false
  }
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
