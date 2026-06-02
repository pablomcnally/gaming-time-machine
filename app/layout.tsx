import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "./components/google-analytics";
import { TimeTravelTransition } from "./components/time-travel-transition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gaming Time Machine",
  description: "A digital museum of video game history, one month at a time.",
  applicationName: "Gaming Time Machine",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    title: "Gaming Time Machine",
    capable: true,
    statusBarStyle: "black-translucent"
  }
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
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
