import { Geist_Mono } from "next/font/google";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import Script from "next/script";
import "./globals.css";
import { getSite } from "@/lib/settings";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const SITE = await getSite();
  return {
    title: { default: `${SITE.name} — 3D/AR mebel katalogi`, template: `%s — ${SITE.name}` },
    description: "Mebelni sotib olishdan oldin uyingizga AR orqali joylashtirib ko'ring",
  };
}

export const viewport = {
  themeColor: "#f8f6f2",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="uz"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
