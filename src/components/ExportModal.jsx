import React, { useState, useRef } from 'react';
import { X, Download, Film, Sparkles, Check, Loader2, AlertCircle, Video, Settings2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateSrt, generateAss } from '../utils/subtitles';

const EXPORT_RESOLUTIONS = [
  { id: "720p", label: "720p HD", width: 720, height: 1280, note: "Lightweight, Fast Export" },
  { id: "1080p", label: "1080p Full HD", width: 1080, height: 1920, note: "Instagram / Shorts Standard", recommended: true },
  { id: "4k", label: "4K Ultra HD", width: 2160, height: 3840, note: "Crisp Studio Quality" },
];

const EXPORT_FPS = [
  { id: 30, label: "30 fps", note: "Standard Reel Motion" },
  { id: 60, label: "60 fps", note: "Ultra Smooth Kinetic Pop", recommended: true },
];

export default function ExportModal({
  isOpen,
  onClose,
  words,
  style,
  videoSrc,
  videoFile,
  videoDuration = 12.5
}) {
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState(60);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const hiddenVideoRef = useRef(null);
  const cancelExportRef = useRef(false);

  if (!isOpen) return null;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Direct MP4 / WebM High-Res Video Burning Engine using HTML5 Canvas & MediaRecorder
  const handleExportMP4 = async () => {
    try {
      setIsExporting(true);
      setErrorMessage("");
      setDownloadUrl(null);
      setExportProgress(5);
      setExportStage("1/4 Loading video source...");
      cancelExportRef.current = false;

      const resConfig = EXPORT_RESOLUTIONS.find(r => r.id === resolution) || EXPORT_RESOLUTIONS[1];
      const targetWidth = resConfig.width;
      const targetHeight = resConfig.height;
      const targetFps = fps;

      // 1. Create offline video element
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoSrc;
      video.muted = false; // Capture audio
      video.playsInline = true;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = (e) => reject(new Error("Video source load nahi ho payi."));
      });

      const totalDuration = video.duration || videoDuration || 10;

      // 2. Setup rendering canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      // 3. Setup audio capture via Web Audio
      let audioDestination = null;
      let audioCtx = null;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        const sourceNode = audioCtx.createMediaElementSource(video);
        audioDestination = audioCtx.createMediaStreamDestination();
        sourceNode.connect(audioDestination);
        sourceNode.connect(audioCtx.destination); // Keep local audio sync
      } catch (e) {
        console.warn("Audio capture fallback:", e);
      }

      // 4. Capture canvas stream + audio
      const canvasStream = canvas.captureStream(targetFps);
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        audioDestination.stream.getAudioTracks().forEach(track => {
          canvasStream.addTrack(track);
        });
      }

      // 5. Setup MediaRecorder with best supported MP4/WebM codec
      const mimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9,opus',
        'video/webm'
      ];
      const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
      const isMp4 = supportedMime.includes('mp4');

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: supportedMime,
        videoBitsPerSecond: resolution === '4k' ? 25000000 : resolution === '1080p' ? 12000000 : 6000000
      });

      const recordedChunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const recorderStoppedPromise = new Promise((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(100);
      video.currentTime = 0;
      await video.play();

      setExportStage(`2/4 Rendering ${resolution} @ ${targetFps}fps with dynamic captions...`);

      // 6. Frame-by-frame rendering loop with kinetic captions & emojis
      await new Promise((resolve, reject) => {
        const renderFrame = () => {
          if (cancelExportRef.current) {
            video.pause();
            recorder.stop();
            reject(new Error("Export cancelled"));
            return;
          }

          if (video.ended || video.currentTime >= totalDuration) {
            resolve();
            return;
          }

          const curTime = video.currentTime;
          const prog = Math.min(Math.round((curTime / totalDuration) * 85) + 10, 95);
          setExportProgress(prog);

          // Draw base video frame (cover aspect ratio for vertical reels 9:16)
          const vidW = video.videoWidth || 1080;
          const vidH = video.videoHeight || 1920;
          const targetRatio = targetWidth / targetHeight;
          const vidRatio = vidW / vidH;

          let sx = 0, sy = 0, sw = vidW, sh = vidH;
          if (vidRatio > targetRatio) {
            sw = vidH * targetRatio;
            sx = (vidW - sw) / 2;
          } else {
            sh = vidW / targetRatio;
            sy = (vidH - sh) / 2;
          }

          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

          // Find active word
          const activeWordIndex = words.findIndex(w => curTime >= w.start && curTime <= w.end);
          const activeWord = activeWordIndex !== -1 ? words[activeWordIndex] : null;

          // Determine current words chunk (Auto Voice Cadence or Fixed)
          const wordsPerLine = style.wordsPerLine ?? "auto";
          let currentChunk = [];

          if (activeWordIndex !== -1) {
            if (wordsPerLine === 1) {
              currentChunk = [words[activeWordIndex]];
            } else if (typeof wordsPerLine === "number") {
              const chunkStart = Math.floor(activeWordIndex / wordsPerLine) * wordsPerLine;
              currentChunk = words.slice(chunkStart, chunkStart + wordsPerLine);
            } else {
              // Smart Auto Cadence: 1 or 2 words based on pause
              const curr = words[activeWordIndex];
              const prev = activeWordIndex > 0 ? words[activeWordIndex - 1] : null;
              const next = activeWordIndex < words.length - 1 ? words[activeWordIndex + 1] : null;

              if (prev && curr.start - prev.end < 0.25 && (activeWordIndex % 2 === 1)) {
                currentChunk = [prev, curr];
              } else if (next && next.start - curr.end < 0.25 && (activeWordIndex % 2 === 0)) {
                currentChunk = [curr, next];
              } else {
                currentChunk = [curr];
              }
            }
          }

          // Burn Dynamic Captions onto frame
          if (currentChunk.length > 0) {
            const scaleMultiplier = targetWidth / 360; // Scale from preview (360w) to high-res canvas
            const fontSize = (style.fontSize || 32) * scaleMultiplier;
            const yPos = (targetHeight * (style.yPosition || 68)) / 100;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `900 ${fontSize}px ${style.fontFamily || 'Impact, sans-serif'}`;

            // Calculate width of each word
            const wordMeasures = currentChunk.map(w => {
              const text = style.uppercase ? w.text.toUpperCase() : w.text;
              return {
                word: w,
                text,
                width: ctx.measureText(text).width
              };
            });

            const gap = 16 * scaleMultiplier;
            const totalWidth = wordMeasures.reduce((sum, item) => sum + item.width, 0) + (wordMeasures.length - 1) * gap;
            let currentX = (targetWidth / 2) - (totalWidth / 2);

            wordMeasures.forEach(({ word: w, text, width }) => {
              const isActive = w.id === activeWord?.id;
              const isSpecial = w.emoji === '💸' || w.emoji === '💰' || w.emoji === '🚀' || w.emoji === '🔥';

              const centerX = currentX + (width / 2);

              // 1. Floating Emoji above active word
              if (w.emoji && isActive) {
                ctx.save();
                ctx.font = `${fontSize * 1.05}px sans-serif`;
                ctx.fillText(w.emoji, centerX, yPos - fontSize * 1.15);
                ctx.restore();
              }

              // 2. Word Kinetic Pop & Stroke
              ctx.save();
              const fillColor = isActive
                ? (isSpecial ? (style.secondaryActive || '#4ADE80') : (style.activeColor || '#FACC15'))
                : (style.textColor || '#FFFFFF');

              ctx.fillStyle = fillColor;
              ctx.lineWidth = 6 * scaleMultiplier;
              ctx.strokeStyle = '#000000';
              ctx.lineJoin = 'round';
              ctx.miterLimit = 2;

              // Heavy shadow for maximum contrast
              ctx.shadowColor = isActive ? (style.activeColor || '#FACC15') : 'rgba(0,0,0,0.85)';
              ctx.shadowBlur = isActive ? 20 * scaleMultiplier : 10 * scaleMultiplier;

              // Draw outline then fill
              ctx.strokeText(text, centerX, yPos);
              ctx.fillText(text, centerX, yPos);

              ctx.restore();
              currentX += width + gap;
            });

            ctx.restore();
          }

          requestAnimationFrame(renderFrame);
        };

        requestAnimationFrame(renderFrame);
      });

      setExportStage("3/4 Finalizing video encoding...");
      setExportProgress(96);
      video.pause();
      recorder.stop();
      await recorderStoppedPromise;

      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }

      setExportStage("4/4 Generating download link...");
      const finalBlob = new Blob(recordedChunks, { type: supportedMime });
      const finalUrl = URL.createObjectURL(finalBlob);
      setDownloadUrl(finalUrl);
      setExportProgress(100);
      setIsExporting(false);
      triggerCelebration();

      // Trigger direct browser download
      const a = document.createElement('a');
      a.href = finalUrl;
      const extension = isMp4 ? 'mp4' : 'webm';
      a.download = `captioncraft_${resolution}_${fps}fps.${extension}`;
      a.click();

    } catch (err) {
      console.error("Export error:", err);
      setErrorMessage(err.message || "Export fail ho gaya. Kripya dubara koshish karein.");
      setIsExporting(false);
    }
  };

  const handleDownloadSrt = () => {
    const srtContent = generateSrt(words, 2);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    a.click();
    URL.revokeObjectURL(url);
    triggerCelebration();
  };

  const handleDownloadAss = () => {
    const assContent = generateAss(words, style);
    const blob = new Blob([assContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dynamic_captions.ass';
    a.click();
    URL.revokeObjectURL(url);
    triggerCelebration();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
            <Film className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Export Ready-to-Post Reel</span>
              <span className="text-xs font-mono font-normal bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Direct MP4
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Burn captions directly onto video in studio quality</p>
          </div>
        </div>

        {/* Quality Controls Section */}
        <div className="mt-6 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          
          {/* Resolution Selector: 720p, 1080p, 4K */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>Video Resolution</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {EXPORT_RESOLUTIONS.find(r => r.id === resolution)?.width}x{EXPORT_RESOLUTIONS.find(r => r.id === resolution)?.height}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {EXPORT_RESOLUTIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setResolution(r.id)}
                  disabled={isExporting}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    resolution === r.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{r.label}</span>
                    {r.recommended && (
                      <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 truncate">
                    {r.note}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Framerate Selector: 30fps vs 60fps */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Framerate (Smoothness)</span>
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                {fps} FPS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EXPORT_FPS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFps(f.id)}
                  disabled={isExporting}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    fps === f.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{f.label}</span>
                    {f.recommended && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                        Smooth
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 truncate">
                    {f.note}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Progress & Error Display */}
        {isExporting && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{exportStage}</span>
              </span>
              <span className="font-mono">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Rendering with Alex Hormozi kinetic bounces, font stroke & emojis burned directly.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Action Button: Export Video */}
        <div className="mt-5">
          <button
            onClick={handleExportMP4}
            disabled={isExporting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xl shadow-orange-500/25 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting {resolution.toUpperCase()} @ {fps}fps ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 fill-black" />
                <span>Export Video ({resolution.toUpperCase()} • {fps}FPS)</span>
              </>
            )}
          </button>
        </div>

        {/* Fallback Subtitle Downloads for Premiere / CapCut / Final Cut */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400">
            Editing software import:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAss}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold border border-zinc-800 transition cursor-pointer"
            >
              .ASS (With Styles)
            </button>
            <button
              onClick={handleDownloadSrt}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold border border-zinc-800 transition cursor-pointer"
            >
              .SRT (Standard)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
