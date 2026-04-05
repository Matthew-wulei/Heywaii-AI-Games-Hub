import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { DevAutoSignIn } from "@/components/auth/DevAutoSignIn";
import { AppLayoutClient } from "./app-layout-client";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

const devAutoLogin = process.env.AUTH_DEV_LOGGED_IN === "true";

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
          <DevAutoSignIn enabled={devAutoLogin} />
          <div className="flex flex-1 min-h-screen">
            <AppLayoutClient header={<Header />}>
              {children}
            </AppLayoutClient>
          </div>
          <ToastContainer />
        </SessionProvider>
      </body>
    </html>
  );
}
