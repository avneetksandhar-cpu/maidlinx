import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Wingman — Miami nights",
    template: "%s | Wingman",
  },
  description:
    "Miami, tonight. The best of the city through people who know it.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
