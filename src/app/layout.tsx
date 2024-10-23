import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner"

import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({subsets: ["latin", "cyrillic"]});
// 这是在全局范围内引入的字体，可以在任何地方使用，不需要再次引入
// subsets: ["latin"] 表示只引入拉丁字体，以减小字体文件的大小，
// 如果需要中文，可以使用 ["latin", "cjk"]，或者 ["latin", "cjk", "cyrillic"] 等，具体可以参考 https://fonts.google.com/specimen/Inter?subset=latin,cyrillic

export const metadata: Metadata = {
  title: "Hara-Project Manager",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "antialiased min-h-screen")}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
