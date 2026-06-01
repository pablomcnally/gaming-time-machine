import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TimeTravelTransition } from "./components/time-travel-transition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gaming Time Machine",
  description: "A digital museum of video game history, one month at a time."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <TimeTravelTransition />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
