import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { themeVars } from "./styles/tokens";
import Providers from "./providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "AI Fashion Store",
  description: "AI generated photos to try on your clothes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    title: "AI Fashion Store",
    description: "Try outfits on AI models before you buy.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    siteName: "AI Fashion Store",
    images: [
      {
        url: "/images/page-hero.png",
        width: 1200,
        height: 630,
        alt: "AI Fashion Store hero",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Fashion Store",
    description: "AI generated try-ons and curated looks.",
    images: ["/images/page-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={themeVars}
        className={`${montserrat.variable} ${inter.variable} antialiased flex flex-col min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)]`}
      >
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
