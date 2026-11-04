import React from 'react';
import { Type, Palette, MoveVertical, Layers, Check } from 'lucide-react';
import { CAPTION_PRESETS } from '../data/presetStyles';

export default function StyleCustomizer({ style, setStyle }) {
  const handleSelectPreset = (preset) => {
    setStyle({
      ...preset,
      yPosition: style.yPosition || 68
    });
  };

  return (
    <div className="flex flex-col bg-zinc-950/60 rounded-2xl border border-zinc-800 p-4">
      <div className="pb-3 border-b border-zinc-800/80">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-400" />
          <span>Caption Style & Animation</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">Choose viral animation & typography presets</p>
      </div>

      {/* Preset Cards */}
      <div className="mt-4">
        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Viral Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {CAPTION_PRESETS.map(preset => {
            const isSelected = style.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {preset.badge}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>

                <div className="mt-2.5">
                  <div className="text-xs font-bold text-zinc-200">{preset.name}</div>
                  <div className={`text-[11px] mt-1 ${preset.previewClass}`}>
                    SAMPLE POP
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders & Granular Controls */}
      <div className="mt-5 space-y-4">
        {/* Y-Position */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5 font-bold">
              <MoveVertical className="w-3.5 h-3.5 text-amber-400" />
              <span>Text Position (Uper / Niche)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStyle({ ...style, yPosition: Math.max((style.yPosition || 68) - 5, 20) })}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold transition cursor-pointer"
                title="Move Up"
              >
                ▲ Uper
              </button>
              <button
                type="button"
                onClick={() => setStyle({ ...style, yPosition: Math.min((style.yPosition || 68) + 5, 88) })}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold transition cursor-pointer"
                title="Move Down"
              >
                ▼ Niche
              </button>
              <span className="font-mono text-amber-400 font-bold ml-1">{style.yPosition || 68}%</span>
            </div>
          </div>
          <input
            type="range"
            min="20"
            max="88"
            step="1"
            value={style.yPosition || 68}
            onChange={e => setStyle({ ...style, yPosition: Number(e.target.value) })}
            className="w-full h-2 mt-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[11px] text-zinc-400 mt-1 font-medium">
            <button
              type="button"
              onClick={() => setStyle({ ...style, yPosition: 25 })}
              className="hover:text-amber-400 cursor-pointer"
            >
              Top (25%)
            </button>
            <button
              type="button"
              onClick={() => setStyle({ ...style, yPosition: 50 })}
              className="hover:text-amber-400 cursor-pointer"
            >
              Center (50%)
            </button>
            <button
              type="button"
              onClick={() => setStyle({ ...style, yPosition: 68 })}
              className="hover:text-amber-400 cursor-pointer text-amber-300 font-bold"
            >
              Bottom Reel Safe (68%)
            </button>
            <button
              type="button"
              onClick={() => setStyle({ ...style, yPosition: 82 })}
              className="hover:text-amber-400 cursor-pointer"
            >
              Lower (82%)
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-zinc-400" />
              <span>Font Size</span>
            </span>
            <span className="font-mono text-zinc-400">{style.fontSize}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="46"
            step="1"
            value={style.fontSize}
            onChange={e => setStyle({ ...style, fontSize: Number(e.target.value) })}
            className="w-full h-1.5 mt-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Words per line chunk */}
        <div>
          <div className="text-xs text-zinc-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Words Per Frame</span>
            </span>
            <span className="text-[10px] text-amber-400 font-medium">
              {style.wordsPerLine === "auto" || style.wordsPerLine === undefined ? "Auto Voice Sync" : `${style.wordsPerLine} words`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "auto", label: "⚡ Auto" },
              { id: 1, label: "1 Word" },
              { id: 2, label: "2 Words" },
              { id: 3, label: "3 Words" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setStyle({ ...style, wordsPerLine: item.id })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                  (style.wordsPerLine ?? "auto") === item.id
                    ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Uppercase toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-300">Uppercase All Text</span>
          <button
            onClick={() => setStyle({ ...style, uppercase: !style.uppercase })}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              style.uppercase ? 'bg-amber-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                style.uppercase ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Active Highlight Color */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-300">Active Highlight Color</span>
          <div className="flex items-center gap-1.5">
            {['#FACC15', '#EF4444', '#38BDF8', '#4ADE80', '#EC4899'].map(c => (
              <button
                key={c}
                onClick={() => setStyle({ ...style, activeColor: c })}
                className={`w-5 h-5 rounded-full border-2 transition ${
                  style.activeColor === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

