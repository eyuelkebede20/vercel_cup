import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="winter">
      <body className="min-h-screen bg-base-200/40">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
