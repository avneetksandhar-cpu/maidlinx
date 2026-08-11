import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { getSiteUrl } from "@/config/env";
import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} | Professional Home Cleaning`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteUrl(),
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/brand/maidlinx-logo.png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen bg-background font-sans text-ink antialiased">
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
