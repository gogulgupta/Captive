import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Cpu, Check, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export default function AIPromptModal({ isOpen, onClose, onApiKeySaved }) {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("captionpop_api_key") || "";
    const savedProv = localStorage.getItem("captionpop_provider") || "gemini";
    setApiKey(savedKey);
    setProvider(savedProv);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert("Please enter a valid API key");
      return;
    }
    localStorage.setItem("captionpop_api_key", apiKey.trim());
    localStorage.setItem("captionpop_provider", provider);
    setSaved(true);
    if (onApiKeySaved) onApiKeySaved(apiKey.trim(), provider);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem("captionpop_api_key");
    setApiKey("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-bold">
            <Key className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Connect Real Speech-to-Text AI</h2>
            <p className="text-xs text-zinc-400">Audio se real Hinglish captions nikaalne ke liye</p>
          </div>
        </div>

        {/* Why API key is needed info box */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Asli Voice Transcription Kaise Hoti Hai?</span>
          </p>
          <p className="mt-1 text-zinc-300 text-[11px]">
            Browser me video se audio extract karke AI Speech Model (Gemini 2.0 Flash ya Groq Whisper) ko bheja jata hai, jo har word ka exact timestamp aur Hinglish spelling nikaalta hai.
          </p>
        </div>

        {/* Provider selection */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
            Select AI Provider (Dono Free Hain):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setProvider("gemini")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                provider === "gemini"
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="font-bold text-xs flex items-center justify-between">
                <span>Google Gemini</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded">Recommended</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">Best for Hinglish + Auto Emojis</div>
            </button>

            <button
              onClick={() => setProvider("groq")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                provider === "groq"
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="font-bold text-xs">Groq Whisper</div>
              <div className="text-[10px] text-zinc-400 mt-1">Superfast Whisper Large v3</div>
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              {provider === "gemini" ? "Google Gemini API Key:" : "Groq API Key:"}
            </label>
            <a
              href={provider === "gemini" ? "https://aistudio.google.com/app/apikey" : "https://console.groq.com/keys"}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
            >
              <span>Get Free Key (1 min)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <input
            type="password"
            placeholder={provider === "gemini" ? "AIzaSy..." : "gsk_..."}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            🔒 Key aapke browser ke local storage me safe rehti hai, kisi server par save nahi hoti.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex items-center justify-between pt-2 border-t border-zinc-800">
          {apiKey ? (
            <button
              onClick={handleClear}
              className="text-xs text-rose-400 hover:text-rose-300 transition"
            >
              Clear Key
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-black" /> : null}
              <span>{saved ? 'Connected!' : 'Connect Key'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
