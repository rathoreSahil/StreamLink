import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/socket-provider";
import { Toaster } from "react-hot-toast";
import { PoliteStateProvider } from "@/context/polite-state-provider";

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
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          <PoliteStateProvider>
            {children}
            <Toaster />
          </PoliteStateProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
