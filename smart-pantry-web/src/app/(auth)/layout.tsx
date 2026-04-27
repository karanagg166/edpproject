import { Apple } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-zinc-200/50 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-zinc-200/50 blur-[100px] rounded-full" />
      </div>
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 z-10">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-sm">
          <Apple size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Smart Pantry
        </h1>
      </div>

      {/* Main Card */}
      <div className="z-10 w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-xl p-8">
        {children}
      </div>
    </div>
  );
}
