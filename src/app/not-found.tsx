import Link from "next/link";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <Ghost className="w-32 h-32 text-primary relative z-10 animate-bounce drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">
        4<span className="text-primary">0</span>4
      </h1>
      
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
        Glitch in the Matrix
      </h2>
      
      <p className="text-text-secondary text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
        The page you are looking for has been deleted, moved, or never existed in this timeline.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-primary hover:opacity-90 text-white font-medium transition-all hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 w-full sm:w-auto"
        >
          <Home className="w-4 h-4 fill-white/20" /> Return Home
        </Link>
      </div>

    </div>
  );
}