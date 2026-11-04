import React from 'react';
import { Sparkles, Video, Flame, Cpu, Download, RefreshCw, Wand2 } from 'lucide-react';

export default function Navbar({ onOpenAIModal, onResetDemo, onExportClick, isProcessing }) {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                CaptionPop<span className="text-amber-400">.ai</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Hinglish Pro
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Raw Video → Viral Captions & Emojis in Seconds</p>
          </div>
        </div>

        {/* Center status badges */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5"></span>
            <span>Hinglish Engine v2.4</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Emojis & SFX</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition cursor-pointer"
            title="Load Sample Hinglish Reel"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Load Sample Reel</span>
          </button>

          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
            title="AI Pipeline Settings (Whisper & Gemini)"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Pipeline</span>
          </button>

          <button
            onClick={onExportClick}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Reel</span>
          </button>
        </div>

      </div>
    </header>
  );
}

