import "./globals.css";
import { Shell } from "@/components/Shell";
import { UserProvider } from "@/lib/UserContext";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientScrollBar } from "@/components/ClientScrollBar";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Smart Pantry — AI Pantry Manager",
  description: "Real-time AI-powered pantry management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="icon" href="data:;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" />
      </head>
      <body className="bg-white text-zinc-900 font-[Inter,sans-serif] antialiased">
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
