import React, { useRef, useState } from 'react';
import { UploadCloud, Video, Sparkles, FileVideo, CheckCircle2 } from 'lucide-react';

export default function VideoUploader({ onVideoSelected, currentFileName }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file (.mp4, .mov, .webm)');
      return;
    }
    const url = URL.createObjectURL(file);
    onVideoSelected(url, file.name, file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
        isDragging
          ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
          : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
        <UploadCloud className="w-5 h-5" />
      </div>

      <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
        <span>Drop your raw video here or</span>
        <span className="text-amber-400 underline underline-offset-2">browse</span>
      </div>

      <p className="text-[11px] text-zinc-500 mt-1">
        Supports MP4, MOV, WebM • 9:16 Vertical Reels Recommended
      </p>

      {currentFileName && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{currentFileName}</span>
        </div>
      )}
    </div>
  );
}

