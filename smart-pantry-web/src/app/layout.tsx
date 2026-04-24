import "./globals.css";
import { Shell } from "@/components/Shell";
import { UserProvider } from "@/lib/UserContext";

export const metadata = {
  title: "Smart Pantry — AI Pantry Manager",
  description: "Real-time AI-powered pantry management with nutrition tracking, diet planning, and health analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-200 flex font-[Inter,sans-serif]">
        <UserProvider>
          <Shell>
            {children}
          </Shell>
        </UserProvider>
      </body>
    </html>
  );
}
