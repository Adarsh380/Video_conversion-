import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VideoConverter Pro",
  description: "Transform documents into professional videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased min-h-screen w-full overflow-x-hidden`}
      >
        <header className="bg-white shadow-sm w-full">
          <div className="w-full mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="font-bold text-gray-900">VideoConverter Pro</div>
            <nav className="flex flex-wrap items-center gap-4">
              <a className="text-pink-600 hover:underline" href="/video-converter">
                Launch App
              </a>
            </nav>
          </div>
        </header>
        <main className="w-full mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
