import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Clock, Smile, Wand2, Search, FileText, Check, Loader2, Key, AlertCircle } from 'lucide-react';
import { autoDetectEmoji } from '../data/emojiKeywords';
import { extractAudioFromVideo, transcribeWithLocalServer } from '../utils/aiTranscription';

const POPULAR_EMOJIS = ["🔥", "💸", "🚀", "💡", "👑", "🤯", "❤️", "⚡", "🎯", "⚠️", "📉", "🤖"];

export default function CaptionTimeline({
  words,
  setWords,
  currentTime,
  onSeek,
  videoDuration = 12.5,
  customFileName,
  videoFile
}) {
  const [filterText, setFilterText] = useState("");
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [customScriptText, setCustomScriptText] = useState("");
  
  // AI Transcription states
  const [captionLanguage, setCaptionLanguage] = useState("hinglish"); // 'hinglish' | 'english'
  const [isAiTranscribing, setIsAiTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Auto detect emojis for all words in one click
  const handleAutoTagEmojis = () => {
    const updated = words.map(w => {
      const detected = autoDetectEmoji(w.text);
      return {
        ...w,
        emoji: detected || w.emoji || ""
      };
    });
    setWords(updated);
  };

  // Local AI Speech-to-Text (faster-whisper — no API key needed)
  const handleRealAiTranscription = async () => {
    if (!videoFile) {
      setErrorMessage("Kripya pehle video file upload karein");
      return;
    }

    try {
      setIsAiTranscribing(true);
      setErrorMessage("");
      setTranscribeStatus("1/2 Video backend server ko bhej rahe hain...");

      // Send the actual raw video file directly to FastAPI backend
      // Backend uses local FFmpeg to extract full 100% loss-free audio from start to finish
      setTranscribeStatus(`2/2 AI ${captionLanguage.toUpperCase()} mode me poori video transcribe kar raha hai...`);
      const transcribedWords = await transcribeWithLocalServer(videoFile, captionLanguage);

      setTranscribeStatus("✨ Emojis detect ho rahe hain...");

      // Enrich with auto-detected emojis
      const enriched = transcribedWords.map(w => ({
        ...w,
        emoji: w.emoji || autoDetectEmoji(w.text || w.word) || ""
      }));

      setWords(enriched);
      setTranscribeStatus("✅ Done! " + enriched.length + " words transcribed 🎉");
      setTimeout(() => setTranscribeStatus(""), 3000);
    } catch (err) {
      console.error("Transcription error:", err);
      setErrorMessage(err.message || "Transcription fail ho gaya");
    } finally {
      setIsAiTranscribing(false);
    }
  };

  // Convert pasted text into word-level timestamps matched to video duration
  const handleGenerateFromScript = () => {
    if (!customScriptText.trim()) return;

    const rawTokens = customScriptText.trim().split(/\s+/);
    if (!rawTokens.length) return;

    const totalDur = Math.max(videoDuration || 10, 4);
    const usableDur = totalDur * 0.95;
    const timePerWord = usableDur / rawTokens.length;

    const newWords = rawTokens.map((token, idx) => {
      const start = Number((0.2 + idx * timePerWord).toFixed(2));
      const end = Number((start + timePerWord * 0.88).toFixed(2));
      const emoji = autoDetectEmoji(token);

      return {
        id: Date.now() + idx,
        text: token,
        start,
        end,
        emoji
      };
    });

    setWords(newWords);
    setShowScriptModal(false);
    setCustomScriptText("");
  };

  // Update specific word
  const updateWordText = (id, newText) => {
    setWords(words.map(w => (w.id === id ? { ...w, text: newText } : w)));
  };

  const updateWordEmoji = (id, emoji) => {
    setWords(words.map(w => (w.id === id ? { ...w, emoji } : w)));
    setActiveEmojiPickerId(null);
  };

  const deleteWord = (id) => {
    setWords(words.filter(w => w.id !== id));
  };

  const addWord = () => {
    const lastWord = words[words.length - 1];
    const newStart = lastWord ? Number((lastWord.end + 0.1).toFixed(2)) : 0;
    const newEnd = Number((newStart + 0.45).toFixed(2));
    const newWord = {
      id: Date.now(),
      text: "NayaWord",
      start: newStart,
      end: newEnd,
      emoji: "✨"
    };
    setWords([...words, newWord]);
  };

  const filteredWords = words.filter(w =>
    w.text.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950/60 rounded-2xl border border-zinc-800 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>Hinglish Script & Timestamps</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {words.length} words
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click any word to jump video timestamp ({videoDuration.toFixed(1)}s reel)
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowScriptModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
            title="Paste custom spoken script"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>My Script</span>
          </button>

          <button
            onClick={handleAutoTagEmojis}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
            title="Auto-scan Hinglish words and assign matching emojis"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Emojis</span>
          </button>

          <button
            onClick={addWord}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Uploaded Video Action Prompt */}
      {customFileName && (
        <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-amber-200">
              <span className="font-bold">Uploaded:</span> <span className="break-all">{customFileName}</span>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Duration: {videoDuration.toFixed(1)}s • Choose output caption style:
              </div>
            </div>

            {/* Language Mode Toggle: Hinglish vs English */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-700/80 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setCaptionLanguage("hinglish")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  captionLanguage === "hinglish"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🇮🇳 Hinglish</span>
              </button>

              <button
                type="button"
                onClick={() => setCaptionLanguage("english")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  captionLanguage === "english"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🇬🇧 English</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">
              {captionLanguage === "hinglish" 
                ? "✨ Hindi speech will become Roman Hinglish"
                : "🌐 Speech will be translated into English"}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleRealAiTranscription}
                disabled={isAiTranscribing}
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {isAiTranscribing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing {captionLanguage}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                    <span>🎤 Generate {captionLanguage === "hinglish" ? "Hinglish" : "English"}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowScriptModal(true)}
                className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition cursor-pointer"
              >
                ✍️ Paste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {transcribeStatus && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          {transcribeStatus.startsWith("✅") ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          )}
          <span>{transcribeStatus}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-[11px] underline text-rose-300 hover:text-white shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Paste Script Modal / Drawer */}
      {showScriptModal && (
        <div className="mt-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Paste Your Video Script (Hinglish / Hindi / English)</span>
            </span>
            <button
              onClick={() => setShowScriptModal(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <textarea
            rows={3}
            value={customScriptText}
            onChange={e => setCustomScriptText(e.target.value)}
            placeholder="Aapne video me jo bola hai wo yaha paste karein... (e.g. Bhai ye reel viral hone wali hai bohot paisa banega...)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-zinc-400">
              💡 Pure video ke {videoDuration.toFixed(1)}s par words automatic distribute ho jayenge + emojis add ho jayenge.
            </div>
            <button
              onClick={handleGenerateFromScript}
              disabled={!customScriptText.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Generate Timed Captions</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="mt-3 relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search word in script..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Words Grid / List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px]">
        {filteredWords.map(w => {
          const isCurrentlyActive = currentTime >= w.start && currentTime <= w.end;

          return (
            <div
              key={w.id}
              onClick={() => onSeek(w.start)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isCurrentlyActive
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Word & Timestamp */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  {w.start.toFixed(1)}s
                </span>

                <input
                  type="text"
                  value={w.text}
                  onChange={e => updateWordText(w.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className={`bg-transparent font-medium text-xs text-zinc-100 focus:outline-none focus:bg-zinc-800/70 px-1.5 py-0.5 rounded border border-transparent focus:border-zinc-700 w-28 sm:w-36 ${
                    isCurrentlyActive ? 'text-amber-300 font-bold' : ''
                  }`}
                />
              </div>

              {/* Emoji Selector */}
              <div className="relative flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setActiveEmojiPickerId(activeEmojiPickerId === w.id ? null : w.id);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border transition cursor-pointer ${
                    w.emoji
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-200 shadow-sm'
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Change emoji"
                >
                  {w.emoji || <Smile className="w-3.5 h-3.5" />}
                </button>

                {/* Popover Emoji Picker */}
                {activeEmojiPickerId === w.id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-0 top-9 z-50 p-2 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl w-48 flex flex-wrap gap-1"
                  >
                    <button
                      onClick={() => updateWordEmoji(w.id, "")}
                      className="text-[10px] w-full text-zinc-400 hover:text-white pb-1 mb-1 border-b border-zinc-800 text-left"
                    >
                      Clear Emoji
                    </button>
                    {POPULAR_EMOJIS.map(em => (
                      <button
                        key={em}
                        onClick={() => updateWordEmoji(w.id, em)}
                        className="w-7 h-7 hover:bg-zinc-800 rounded flex items-center justify-center text-sm transition"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                {/* Delete Word */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteWord(w.id);
                  }}
                  className="p-1 text-zinc-600 hover:text-rose-400 transition"
                  title="Delete word"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
