import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastContainer } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HeyWaii Gameshub",
  description: "AI game aggregation and distribution platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-text-primary`}>
        <SessionProvider>
          <div className="flex flex-1 min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
              <Header />
              <main className="flex-1 p-4 md:p-8 xl:px-12 w-full max-w-screen-2xl mx-auto">
                {children}
              </main>
            </div>
          </div>
          <ToastContainer />
        </SessionProvider>
      </body>
    </html>
  );
}
