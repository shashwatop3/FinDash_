import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import QueryProviders from "@/providers/query-provider";
import { SheetProvider } from "@/providers/sheet-provider";
import { AnimationProvider } from "@/providers/animation-provider";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "FinDash - Modern Financial Dashboard",
  description: "A modern, animated financial SaaS platform with real-time insights",
  keywords: ["finance", "dashboard", "analytics", "modern", "animated"],
  authors: [{ name: "Parv Gugnani" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className={`${inter.className} min-h-screen`}>
          <div className="relative min-h-screen">
            {/* Content */}
            <div className="relative z-10">
              <QueryProviders>
                <AnimationProvider>
                  <SheetProvider />
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      className: "glass text-foreground border-none",
                    }}
                  />
                  {children}
                </AnimationProvider>
              </QueryProviders>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
