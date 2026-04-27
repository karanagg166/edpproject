import "./globals.css";
import { Shell } from "@/components/Shell";
import { UserProvider } from "@/lib/UserContext";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Smart Pantry — AI Pantry Manager",
  description: "Real-time AI-powered pantry management with nutrition tracking, diet planning, and health analytics.",
};

import { ClientScrollBar } from "@/components/ClientScrollBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-zinc-900 flex font-[Inter,sans-serif] antialiased">
        <ClientScrollBar />
        <UserProvider>
          <TooltipProvider delay={300}>
            <Shell>
              {children}
            </Shell>
          </TooltipProvider>
        </UserProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
