import type { Metadata } from "next";
import { Kanit, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
// 1. Import Provider
import { CourseProvider } from "./context/CourseContext";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

const notoSerif = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sigma Tutor",
  description: "Unlock Your Potential with Sigma Tutor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} ${notoSerif.variable} font-serif bg-background text-gray-900 antialiased`}>
        {/* 2. ห่อ App ด้วย CourseProvider */}
        <CourseProvider>
          {children}
        </CourseProvider>
      </body>
    </html>
  );
}