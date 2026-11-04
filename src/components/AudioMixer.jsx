import React, { useState } from 'react';
import { Music, Volume2, Sparkles, VolumeX, Radio, BellRing, Zap } from 'lucide-react';
import { BGM_TRACKS, startBgmSynth, stopBgmSynth, playSfx } from '../utils/audioSynth';

export default function AudioMixer({
  selectedTrack,
  setSelectedTrack,
  bgmVolume,
  setBgmVolume,
  sfxEnabled,
  setSfxEnabled,
  isPlaying
}) {
  const [duckingEnabled, setDuckingEnabled] = useState(true);

  const handleTrackChange = (trackId) => {
    setSelectedTrack(trackId);
    if (isPlaying && trackId !== "none") {
      startBgmSynth(trackId, bgmVolume, false);
    } else {
      stopBgmSynth();
    }
  };

  const handleVolumeChange = (newVol) => {
    setBgmVolume(newVol);
    if (isPlaying && selectedTrack !== "none") {
      startBgmSynth(selectedTrack, newVol, false);
    }
  };

  const testSfx = (type) => {
    playSfx(type);
  };

  return (
    <div className="flex flex-col bg-zinc-950/60 rounded-2xl border border-zinc-800 p-4">
      <div className="pb-3 border-b border-zinc-800/80">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Music className="w-4 h-4 text-amber-400" />
          <span>Background Music & Sound FX (SFX)</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Synced royalty-free music with automatic speech ducking
        </p>
      </div>

      {/* Track Selection */}
      <div className="mt-4">
        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          BGM Presets
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {BGM_TRACKS.map(t => {
            const isSelected = selectedTrack === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTrackChange(t.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">
                    {t.genre}
                  </span>
                  {isSelected && <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                </div>
                <div className="text-xs font-bold mt-1.5 truncate">{t.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BGM Volume */}
      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>BGM Volume</span>
            </span>
            <span className="font-mono text-zinc-400">{Math.round(bgmVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.02"
            value={bgmVolume}
            onChange={e => handleVolumeChange(Number(e.target.value))}
            className="w-full h-1.5 mt-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Audio Ducking */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div>
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Speech Ducking</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Speech shuru hote hi music automatically slow ho jata hai
            </p>
          </div>
          <button
            onClick={() => setDuckingEnabled(!duckingEnabled)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
              duckingEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                duckingEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Emoji Sound FX */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div>
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Dynamic Emoji Sound FX</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Har emoji appear hone par pop / whoosh sound play hoga
            </p>
          </div>
          <button
            onClick={() => setSfxEnabled(!sfxEnabled)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
              sfxEnabled ? 'bg-amber-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                sfxEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Test FX sound buttons */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-zinc-400">Test Sound FX:</span>
          <button
            onClick={() => testSfx('pop')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition cursor-pointer"
          >
            🎈 Pop
          </button>
          <button
            onClick={() => testSfx('whoosh')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition cursor-pointer"
          >
            💨 Whoosh
          </button>
          <button
            onClick={() => testSfx('money')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition cursor-pointer"
          >
            💸 Cash Chime
          </button>
        </div>

      </div>
    </div>
  );
}

