import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabljena oprema | FINES",
  description: "Upravljanje in pregled rabljene Fines opreme",
};

export const viewport: Viewport = {
  themeColor: "#e8590c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sl" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
