import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { AnonymousUserInit } from "@/components/anonymous-user-init";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "CityCanvas - 在山财绘制你的理想校园",
    template: "%s · CityCanvas",
  },
  description:
    "AI 驱动的校园 DIY 创意创作平台。在山东财经大学地图上标注你的改造想法，让 Claude 评估舒适度与便捷度，发布到社区共创。",
  keywords: ["CityCanvas", "山东财经大学", "校园创意", "AI 评估", "城市规划", "Claude AI", "泉客松"],
  authors: [{ name: "CityCanvas Team" }],
  openGraph: {
    title: "CityCanvas - 在山财绘制你的理想校园",
    description: "AI 驱动的校园 DIY 创意创作平台",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CityCanvas - 在山财绘制你的理想校园",
    description: "AI 驱动的校园 DIY 创意创作平台",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <AnonymousUserInit />
            {children}
            <Toaster
              position="top-center"
              theme="dark"
              richColors
              toastOptions={{
                style: {
                  background: "rgba(24, 24, 27, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
