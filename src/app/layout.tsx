import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/socket-provider";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamLink",
  description: "Video Chat Application using WebRTC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </body>
    </html>
  );
}
