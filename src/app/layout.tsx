import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "eStock | Know when to reorder. Know how much.",
  description:
    "A replenishment assistant for SMEs. See how sales and stock data can become a purchase recommendation, ready for manager approval. Synthetic prototype preview.",
  robots: { index: false, follow: false },
  icons: { icon: "data:," },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
