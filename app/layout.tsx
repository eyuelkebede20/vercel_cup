import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

// Set the theme before first paint so there's no flash of the wrong mode.
// Reads a saved choice, else falls back to the OS preference.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t!=='cupcake'&&t!=='forest'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'forest':'cupcake';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="cupcake" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-base-200 text-base-content">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
