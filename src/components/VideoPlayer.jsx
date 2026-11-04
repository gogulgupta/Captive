import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ShieldAlert, Sparkles, AlertCircle, ArrowUp, ArrowDown, MoveVertical } from 'lucide-react';
import { playSfx, updateBgmDucking } from '../utils/audioSynth';

export default function VideoPlayer({
  videoSrc,
  words,
  style,
  setStyle,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  sfxEnabled,
  bgmVolume,
  safeZoneVisible,
  setSafeZoneVisible,
  onDurationChange
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const lastSfxWordIdRef = useRef(null);
  const [duration, setDuration] = useState(12.5);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // When video source changes (e.g. user uploaded a video)
  useEffect(() => {
    setVideoError(false);
    setCurrentTime(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [videoSrc]);

  // Sync play/pause state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current
        .play()
        .catch((err) => {
          console.warn("Autoplay prevented:", err);
          // If browser blocked sound autoplay, try muted play
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(e => console.error("Play failed:", e));
          }
        });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setDuration(dur);
        if (onDurationChange) {
          onDurationChange(dur);
        }
      }
    }
  };

  // Find active word and current word chunk
  const activeWordIndex = words.findIndex(
    w => currentTime >= w.start && currentTime <= w.end
  );
  const activeWord = activeWordIndex !== -1 ? words[activeWordIndex] : null;

  // Audio ducking & SFX trigger
  useEffect(() => {
    const isSpeechActive = Boolean(activeWord);
    updateBgmDucking(isSpeechActive, bgmVolume);

    if (activeWord && activeWord.emoji && sfxEnabled) {
      if (lastSfxWordIdRef.current !== activeWord.id) {
        lastSfxWordIdRef.current = activeWord.id;
        playSfx(activeWord.emoji === '💸' || activeWord.emoji === '💰' ? 'money' : 'pop');
      }
    }
  }, [activeWord, sfxEnabled, bgmVolume]);

  // Dynamic voice-cadence chunking:
  // Shows only what is currently being spoken, grouped naturally (1 to 3 words) based on speaking pace
  const wordsPerLine = style.wordsPerLine ?? "auto"; // "auto" | 1 | 2 | 3
  let currentChunk = [];

  if (activeWordIndex !== -1) {
    if (wordsPerLine === 1) {
      // Strict single word pop (Hormozi 1-word punch)
      currentChunk = [words[activeWordIndex]];
    } else if (typeof wordsPerLine === "number") {
      // Fixed count (2 or 3 words)
      const chunkStart = Math.floor(activeWordIndex / wordsPerLine) * wordsPerLine;
      currentChunk = words.slice(chunkStart, chunkStart + wordsPerLine);
    } else {
      // "auto" SMART VOICE CADENCE:
      // Group words together ONLY if they are spoken in the same breath (gap < 0.28s)
      // Max 2 words per breath for high readability & perfect spacing
      const curr = words[activeWordIndex];
      const prev = activeWordIndex > 0 ? words[activeWordIndex - 1] : null;
      const next = activeWordIndex < words.length - 1 ? words[activeWordIndex + 1] : null;

      if (prev && curr.start - prev.end < 0.25 && (activeWordIndex % 2 === 1)) {
        // Pair with previous word in current rapid breath
        currentChunk = [prev, curr];
      } else if (next && next.start - curr.end < 0.25 && (activeWordIndex % 2 === 0)) {
        // Pair with next word
        currentChunk = [curr, next];
      } else {
        // Isolated or paused word -> display solo for maximum impact
        currentChunk = [curr];
      }
    }
  } else {
    // If between words (tiny silence), keep previous chunk visible briefly for smooth transition
    const nextIdx = words.findIndex(w => w.start > currentTime);
    if (nextIdx > 0 && currentTime - words[nextIdx - 1].end < 0.3) {
      const lastSpoken = words[nextIdx - 1];
      currentChunk = [lastSpoken];
    }
  }

  // Fallback synthetic animated canvas ONLY if there's no videoSrc or hard network error
  useEffect(() => {
    if (!videoError && videoSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const renderSyntheticVideo = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark energetic creator studio background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#090a0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Studio rim light
      const pulse = Math.sin(Date.now() / 300) * 0.15 + 0.85;
      const lightGrad = ctx.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.35, w * 0.6);
      lightGrad.addColorStop(0, `rgba(245, 158, 11, ${0.3 * pulse})`);
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);

      // Animated Creator Avatar
      const isSpeaking = Boolean(activeWord);
      const mouthOpen = isSpeaking ? Math.abs(Math.sin(Date.now() / 80)) * 14 : 2;

      // Shoulders
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.58, w * 0.36, h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.35, w * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(w / 2 - 25, h * 0.33, 5, 0, Math.PI * 2);
      ctx.arc(w / 2 + 25, h * 0.33, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.40, 16, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mic badge
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 15, h * 0.48, 30, 45, 6);
      ctx.fill();

      animId = requestAnimationFrame(renderSyntheticVideo);
    };

    renderSyntheticVideo();
    return () => cancelAnimationFrame(animId);
  }, [videoError, videoSrc, activeWord]);

  const togglePlay = () => {
    if (!videoRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Play error, trying muted play:", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true));
          }
        });
    }
  };

  const seekTo = (val) => {
    const time = parseFloat(val);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const restartVideo = () => {
    seekTo(0);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* 9:16 Vertical Reel Frame */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[340px] sm:max-w-[370px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-zinc-800 select-none group"
      >
        {/* Actual Video or Fallback Canvas */}
        {!videoError && videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            className="w-full h-full object-cover cursor-pointer"
            playsInline
            preload="auto"
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={() => setVideoError(false)}
            onError={(e) => {
              console.error("Video element error:", e);
              if (!videoSrc.startsWith('blob:')) {
                setVideoError(true);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={360}
            height={640}
            className="w-full h-full object-cover cursor-pointer"
            onClick={togglePlay}
          />
        )}

        {/* Safe Zone Boundaries (Instagram Reels / TikTok UI Overlay Preview) */}
        {safeZoneVisible && (
          <div className="absolute inset-0 pointer-events-none z-20 border-2 border-dashed border-red-500/40 m-4 rounded-xl flex flex-col justify-between p-3">
            <div className="bg-red-500/20 backdrop-blur-sm text-red-300 text-[10px] font-mono px-2 py-0.5 rounded self-start">
              TOP BAR SAFE (Profile / Search)
            </div>
            <div className="self-end bg-red-500/20 backdrop-blur-sm text-red-300 text-[10px] font-mono px-2 py-0.5 rounded">
              RIGHT ICONS (Like, Comment, Share)
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm text-red-300 text-[10px] font-mono px-2 py-0.5 rounded self-start">
              BOTTOM SAFE (Captions / Music Bar)
            </div>
          </div>
        )}

        {/* Dynamic Captions & Emojis Overlay */}
        <div
          className="absolute left-0 right-0 z-30 pointer-events-none flex flex-col items-center justify-center px-4 transition-all duration-100"
          style={{
            top: `${style.yPosition || 68}%`,
            transform: 'translateY(-50%)'
          }}
        >
          {currentChunk.length > 0 && (
            <div
              className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center transition-all ${
                style.bgBox ? 'px-4 py-2 rounded-2xl backdrop-blur-md' : ''
              }`}
              style={{
                backgroundColor: style.bgBox ? style.bgColor : 'transparent',
                maxWidth: '92%'
              }}
            >
              {currentChunk.map(w => {
                const isActive = w.id === activeWord?.id;
                const isSpecial =
                  w.emoji === '💸' || w.emoji === '💰' || w.emoji === '🚀' || w.emoji === '🔥';

                return (
                  <div
                    key={w.id}
                    className="relative inline-flex items-center mx-1 my-0.5"
                  >
                    {/* Floating animated emoji */}
                    {w.emoji && isActive && (
                      <span
                        className="absolute -top-12 left-1/2 -translate-x-1/2 text-3xl animate-emoji-pop drop-shadow-xl pointer-events-none z-40 select-none"
                      >
                        {w.emoji}
                      </span>
                    )}

                    {/* Word with Dynamic Kinetic Styling & Perfect Spacing */}
                    <span
                      className={`transition-all duration-100 inline-block tracking-normal ${
                        isActive ? 'animate-pop-word scale-110 z-20 font-black' : 'opacity-70 scale-95'
                      }`}
                      style={{
                        fontFamily: style.fontFamily,
                        fontSize: `${style.fontSize}px`,
                        color: isActive
                          ? isSpecial
                            ? style.secondaryActive || '#4ADE80'
                            : style.activeColor
                          : style.textColor,
                        WebkitTextStroke: style.textStroke || '2px #000000',
                        textShadow: isActive
                          ? `${style.textShadow}, 0 0 24px ${style.activeColor}`
                          : style.textShadow,
                        textTransform: style.uppercase ? 'uppercase' : 'none',
                        letterSpacing: style.uppercase ? '0.05em' : '0.02em',
                        lineHeight: 1.25,
                        padding: '0 2px'
                      }}
                    >
                      {w.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Play/Pause Overlay indicator when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center cursor-pointer z-10"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 transform hover:scale-110 transition active:scale-95">
              <Play className="w-8 h-8 fill-black translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Floating Controls: Safe Zone, Mute, Text Position Up/Down */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
          <button
            onClick={() => setSafeZoneVisible(!safeZoneVisible)}
            className={`p-2 rounded-full backdrop-blur-md border text-xs transition cursor-pointer ${
              safeZoneVisible
                ? 'bg-red-500/30 border-red-500 text-red-200'
                : 'bg-black/50 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Toggle Safe Zone (Reels UI)"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className={`p-2 rounded-full backdrop-blur-md border text-xs transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500/40 border-rose-500 text-rose-200'
                : 'bg-black/50 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title={isMuted ? 'Click to Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Quick Text Position Up/Down Controls on Player */}
          {setStyle && (
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 gap-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newPos = Math.max((style.yPosition || 68) - 5, 20);
                  setStyle(prev => ({ ...prev, yPosition: newPos }));
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                title="Move Text Up (Uper Karein)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <span className="text-[9px] font-mono text-amber-400 select-none px-1">
                {style.yPosition || 68}%
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newPos = Math.min((style.yPosition || 68) + 5, 88);
                  setStyle(prev => ({ ...prev, yPosition: newPos }));
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                title="Move Text Down (Niche Karein)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Muted Warning Badge */}
        {isMuted && isPlaying && (
          <div
            onClick={toggleMute}
            className="absolute bottom-4 left-4 z-30 bg-black/70 backdrop-blur-md border border-rose-500/30 px-2.5 py-1 rounded-full text-[11px] text-rose-300 flex items-center gap-1.5 cursor-pointer hover:bg-black/90 transition"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Muted • Click to Hear Voice</span>
          </div>
        )}

      </div>

      {/* Media Controller Bar */}
      <div className="w-full max-w-[370px] mt-4 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-2 shadow-lg">
        {/* Scrubber track */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
            {currentTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min="0"
            max={duration || 12.5}
            step="0.05"
            value={currentTime}
            onChange={e => seekTo(e.target.value)}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-[11px] font-mono text-zinc-400 w-10">
            {duration.toFixed(1)}s
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={restartVideo}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => seekTo(Math.max(0, currentTime - 2))}
              className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono transition cursor-pointer"
            >
              -2s
            </button>
            <button
              onClick={togglePlay}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => seekTo(Math.min(duration, currentTime + 2))}
              className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono transition cursor-pointer"
            >
              +2s
            </button>
          </div>

          <div className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
