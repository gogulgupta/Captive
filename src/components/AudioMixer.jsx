import React, { useState, useRef } from 'react';
import { Music, Volume2, Sparkles, VolumeX, Radio, BellRing, Zap, Upload, FileAudio, Trash2, Check } from 'lucide-react';
import { BGM_TRACKS, startBgmSynth, stopBgmSynth, playSfx } from '../utils/audioSynth';

export default function AudioMixer({
  selectedTrack,
  setSelectedTrack,
  bgmVolume,
  setBgmVolume,
  sfxEnabled,
  setSfxEnabled,
  isPlaying,
  customAudioUrl,
  setCustomAudioUrl,
  customAudioName,
  setCustomAudioName
}) {
  const [duckingEnabled, setDuckingEnabled] = useState(true);
  const fileInputRef = useRef(null);

  const handleTrackChange = (trackId) => {
    setSelectedTrack(trackId);
    if (isPlaying && trackId !== "none") {
      startBgmSynth(trackId, bgmVolume, customAudioUrl);
    } else {
      stopBgmSynth();
    }
  };

  const handleVolumeChange = (newVol) => {
    setBgmVolume(newVol);
    if (isPlaying && selectedTrack !== "none") {
      startBgmSynth(selectedTrack, newVol, customAudioUrl);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
    setSelectedTrack("custom");

    if (isPlaying) {
      startBgmSynth("custom", bgmVolume, url);
    }
  };

  const handleRemoveCustomAudio = () => {
    setCustomAudioUrl(null);
    setCustomAudioName("");
    if (selectedTrack === "custom") {
      setSelectedTrack("trap-phonk");
      if (isPlaying) {
        startBgmSynth("trap-phonk", bgmVolume);
      } else {
        stopBgmSynth();
      }
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
          Synced royalty-free presets ya apna personal background audio upload karein
        </p>
      </div>

      {/* Upload Custom Audio from System */}
      <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Upload Custom BGM from System</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                  MP3 / WAV / M4A
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Apne computer se koi bhi favourite music ya background sound lagayein</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Choose File</span>
          </button>
        </div>

        {/* Custom Audio Attached Status */}
        {customAudioUrl && (
          <div className="mt-3 p-2.5 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-200 truncate">{customAudioName}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Custom audio active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTrackChange("custom")}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedTrack === "custom"
                    ? "bg-emerald-500 text-black"
                    : "bg-zinc-800 text-zinc-300 hover:text-white"
                }`}
              >
                {selectedTrack === "custom" ? "Playing" : "Use This"}
              </button>
              <button
                type="button"
                onClick={handleRemoveCustomAudio}
                className="p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                title="Remove audio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Tracks Selection */}
      <div className="mt-4">
        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span>Preset Loops</span>
          {selectedTrack === "custom" && (
            <span className="text-[10px] text-amber-400 lowercase font-normal">(using custom audio)</span>
          )}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
              <span>BGM Volume (Music Loudness)</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{Math.round(bgmVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
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
              Speech shuru hote hi music automatically slow ho jata hai taaki aawaz clear sunai de
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
              Har emoji appear hone par pop / chime sound play hoga
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
