import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Nunito, Geist_Mono } from "next/font/google";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

// Edu tizim shrifti.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduGram System",
  description: "Xususiy maktab, bog'cha va o'quv markazlari uchun boshqaruv tizimi",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Mavzu server'da o'qiladi — shunda birinchi render'dayoq to'g'ri rang
  // chiqadi va yorug' fon bir lahza "yonib" ketmaydi.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="uz"
      data-theme={theme}
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
