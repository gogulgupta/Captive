import React, { useRef, useEffect } from 'react';
import { renderCaptionsToCanvas } from '../utils/captionAnimation';

/**
 * <CaptionPreview /> Component
 * Overlays high-performance HTML5 Canvas over HTML video element.
 * Synchronizes with video currentTime at 60fps via requestAnimationFrame.
 *
 * Props:
 * - videoUrl: string (blob or direct path)
 * - wordsArray: array of { word, start, end }
 * - selectedPreset: caption preset object
 * - isPlaying: boolean
 * - onTimeUpdate: function(currentTime)
 */
export default function CaptionPreview({
  videoUrl,
  wordsArray = [],
  selectedPreset,
  isPlaying = false,
  currentTime = 0,
  onTimeUpdate
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  // Sync video play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Continuously render canvas overlay matched to video playback
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');

    const renderLoop = () => {
      if (video.videoWidth && video.videoHeight) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentVideoTime = video.currentTime;
        if (onTimeUpdate && isPlaying) {
          onTimeUpdate(currentVideoTime);
        }

        // Draw animated kinetic captions
        if (selectedPreset && wordsArray.length > 0) {
          renderCaptionsToCanvas(
            ctx,
            wordsArray,
            currentVideoTime,
            selectedPreset,
            canvas.width,
            canvas.height
          );
        }
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [wordsArray, selectedPreset, isPlaying, onTimeUpdate]);

  return (
    <div className="relative w-full h-full max-w-[380px] sm:max-w-[420px] mx-auto aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-zinc-800">
      {/* Base Video Layer */}
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />

      {/* Skia-style 60FPS Kinetic Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
    </div>
  );
}
