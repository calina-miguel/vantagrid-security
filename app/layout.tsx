import type { Metadata } from "next";
import "./globals.css";
import { MotionEffects } from "./motion-effects";

export const metadata: Metadata = {
  title: "VantaGrid",
  description: "Turn a vague security concern into a practical first move for a growing team.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<MotionEffects /></body>
    </html>
  );
}
