import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://pathskill-web.vercel.app";
const TITLE = "PathSkill - Petakan Skill, Susun Jalur Belajar Personal";
const DESCRIPTION =
  "PathSkill memetakan kesenjangan skill kamu terhadap standar industri, lalu menyusun jalur belajar personal yang disusun AI — bukan kursus generik yang sama untuk semua orang.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: "/logo/pathskill-icon.png",
    apple: "/logo/pathskill-icon.png",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: "PathSkill",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
