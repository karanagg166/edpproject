import { Apple } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-white flex">
      {/* Left side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-sm">
              <Apple size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              Smart Fridge
            </h1>
          </div>
          
          {children}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-zinc-100 overflow-hidden">
        <img 
          src="/images/auth-pantry.png"
          alt="Modern intelligent kitchen"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-zinc-900/10 to-transparent" />
        
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
            Your intelligent <br />kitchen assistant
          </h2>
          <p className="text-white/80 text-lg font-medium max-w-md leading-relaxed">
            Let AI track your inventory, plan your meals, and reduce food waste effortlessly with a smart camera.
          </p>
        </div>
      </div>
    </div>
  );
}
