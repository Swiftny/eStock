import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "eStock | From receipt to stock. With your approval.",
  description:
    "Document-assisted inventory for one shop and one warehouse. Managers review supplier-document drafts before approving stock intake; staff record Take and Return.",
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
