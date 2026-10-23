import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "eStock | Faster stock updates.",
  description:
    "Document-assisted inventory for one shop and one warehouse. Managers prepare supplier receipts; shared Staff checks physical goods and confirms actual stock intake. Both roles Take and Return.",
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
