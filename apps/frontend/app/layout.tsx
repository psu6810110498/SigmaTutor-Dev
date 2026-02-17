import type { Metadata } from "next";
import { Kanit, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
// ✅ เพิ่มการนำเข้า AuthProvider จากโฟลเดอร์ context
import { AuthProvider } from "./context/AuthContext";
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
      <body className={`${kanit.variable} ${notoSerif.variable} font-sans bg-background text-gray-900 antialiased`}>
        {/* AuthProvider from HEAD, CourseProvider from Main */}
        <AuthProvider>
          <CourseProvider>
            {children}
          </CourseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}