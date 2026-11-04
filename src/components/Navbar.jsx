import React from 'react';
import { Flame, Download } from 'lucide-react';

export default function Navbar({ onExportClick, isProcessing }) {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Captive<span className="text-amber-400">.ai</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Reels Pro
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden md:block">AI Dynamic Hinglish Captions & Motion in Seconds</p>
          </div>
        </div>

        {/* Primary Action - Clean Export Only */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportClick}
            disabled={isProcessing}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs sm:text-sm shadow-md sm:shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Export Reel</span>
          </button>
        </div>

      </div>
    </header>
  );
}
