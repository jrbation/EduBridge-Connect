import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "EduBridge Connect",
  description: "Inclusive online learning for students, parents, teachers, and administrators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
