import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VideoPlayer from './components/VideoPlayer';
import VideoUploader from './components/VideoUploader';
import CaptionTimeline from './components/CaptionTimeline';
import StyleCustomizer from './components/StyleCustomizer';
import AudioMixer from './components/AudioMixer';
import ExportModal from './components/ExportModal';
import AIPromptModal from './components/AIPromptModal';
import { SAMPLE_PROJECTS } from './data/sampleVideos';
import { CAPTION_PRESETS } from './data/presetStyles';
import { startBgmSynth, stopBgmSynth } from './utils/audioSynth';
import { Subtitles, Palette, Music, Sparkles, Layers, ShieldCheck, Flame } from 'lucide-react';

export default function App() {
  const [currentProject, setCurrentProject] = useState(SAMPLE_PROJECTS[0]);
  const [videoSrc, setVideoSrc] = useState(SAMPLE_PROJECTS[0].videoUrl);
  const [customFileName, setCustomFileName] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [words, setWords] = useState(SAMPLE_PROJECTS[0].words);
  const [style, setStyle] = useState(CAPTION_PRESETS[0]);
  const [videoDuration, setVideoDuration] = useState(12.5);
  
  // Media playback states
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [safeZoneVisible, setSafeZoneVisible] = useState(false);

  // Audio mixer states
  const [selectedTrack, setSelectedTrack] = useState("trap-phonk");
  const [bgmVolume, setBgmVolume] = useState(0.2);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // Navigation tab for settings panel
  const [activeTab, setActiveTab] = useState("captions"); // 'captions' | 'style' | 'audio'

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Start / stop synthesized BGM on play/pause
  useEffect(() => {
    if (isPlaying && selectedTrack !== "none") {
      startBgmSynth(selectedTrack, bgmVolume, false);
    } else {
      stopBgmSynth();
    }
    return () => stopBgmSynth();
  }, [isPlaying, selectedTrack]);

  // Handle uploaded video file
  const handleVideoUpload = (url, fileName, file) => {
    setVideoSrc(url);
    setCustomFileName(fileName);
    setVideoFile(file);
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveTab("captions"); // Switch to captions tab so user immediately sees their script options!
  };

  // Reset to default sample reel
  const handleResetDemo = () => {
    setCurrentProject(SAMPLE_PROJECTS[0]);
    setVideoSrc(SAMPLE_PROJECTS[0].videoUrl);
    setWords(SAMPLE_PROJECTS[0].words);
    setCustomFileName("");
    setVideoFile(null);
    setVideoDuration(12.5);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const loadSampleReel = (sampleIndex) => {
    const proj = SAMPLE_PROJECTS[sampleIndex];
    if (!proj) return;
    setCurrentProject(proj);
    setVideoSrc(proj.videoUrl);
    setWords(proj.words);
    setCustomFileName("");
    setVideoFile(null);
    setVideoDuration(proj.duration || 12.5);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        onOpenAIModal={() => setIsAIOpen(true)}
        onResetDemo={handleResetDemo}
        onExportClick={() => setIsExportOpen(true)}
        isProcessing={false}
      />

      {/* Main Studio Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Banner Tagline */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4 rounded-2xl border border-amber-500/20">
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Raw Video → Ready-to-Post in Seconds</span>
              <span className="text-xl">✨</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              AI Dynamic Hinglish Captions • Hormozi Kinetic Bounces • Smart Emojis • Auto Ducking BGM
            </p>
          </div>

          {/* Quick Sample Reel Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 hidden sm:inline">Try Presets:</span>
            <button
              onClick={() => loadSampleReel(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                !customFileName && currentProject.id === SAMPLE_PROJECTS[0].id
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              🔥 Hinglish Reel
            </button>
            <button
              onClick={() => loadSampleReel(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                !customFileName && currentProject.id === SAMPLE_PROJECTS[1].id
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              🎙️ English Podcast
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Center Column: Video Player & Uploader */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <VideoPlayer
              videoSrc={videoSrc}
              words={words}
              style={style}
              setStyle={setStyle}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              sfxEnabled={sfxEnabled}
              bgmVolume={bgmVolume}
              safeZoneVisible={safeZoneVisible}
              setSafeZoneVisible={setSafeZoneVisible}
              onDurationChange={(dur) => setVideoDuration(dur)}
            />

            {/* Video File Uploader */}
            <div className="w-full max-w-[370px]">
              <VideoUploader
                onVideoSelected={handleVideoUpload}
                currentFileName={customFileName}
              />
            </div>
          </div>

          {/* Right Column: Tabbed Controls (Captions, Style, Music) */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Tab navigation headers */}
            <div className="flex items-center gap-2 p-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-4">
              <button
                onClick={() => setActiveTab("captions")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "captions"
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Subtitles className="w-4 h-4" />
                <span>Script & Emojis</span>
              </button>

              <button
                onClick={() => setActiveTab("style")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "style"
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Motion & Styles</span>
              </button>

              <button
                onClick={() => setActiveTab("audio")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "audio"
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>BGM & Sound FX</span>
              </button>
            </div>

            {/* Tab Content Display */}
            <div className="transition-all">
              {activeTab === "captions" && (
                <CaptionTimeline
                  words={words}
                  setWords={setWords}
                  currentTime={currentTime}
                  onSeek={t => {
                    setCurrentTime(t);
                    setIsPlaying(true);
                  }}
                  videoDuration={videoDuration}
                  customFileName={customFileName}
                  videoFile={videoFile}
                  onOpenAIModal={() => setIsAIOpen(true)}
                />
              )}

              {activeTab === "style" && (
                <StyleCustomizer
                  style={style}
                  setStyle={setStyle}
                />
              )}

              {activeTab === "audio" && (
                <AudioMixer
                  selectedTrack={selectedTrack}
                  setSelectedTrack={setSelectedTrack}
                  bgmVolume={bgmVolume}
                  setBgmVolume={setBgmVolume}
                  sfxEnabled={sfxEnabled}
                  setSfxEnabled={setSfxEnabled}
                  isPlaying={isPlaying}
                />
              )}
            </div>

            {/* Feature highlights badge */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="text-amber-400 text-sm font-bold">Hinglish</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Auto Roman Hindi</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="text-amber-400 text-sm font-bold">Kinetic Pop</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Hormozi Bounces</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="text-amber-400 text-sm font-bold">Smart Emojis</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Auto-tagging 🔥</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="text-amber-400 text-sm font-bold">Audio Ducking</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Voice Sync BGM</div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        words={words}
        style={style}
        videoSrc={videoSrc}
        videoFile={videoFile}
        videoDuration={videoDuration}
      />

      {/* AI Pipeline Architecture Modal */}
      <AIPromptModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </div>
  );
}
