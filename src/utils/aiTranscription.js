// Offline AI Transcription — uses local Python server (faster-whisper)
// No cloud API keys needed!

/**
 * Extract audio from a video File as a 16kHz mono WAV Blob
 * Uses browser Web Audio API — no FFmpeg needed
 */
export async function extractAudioFromVideo(file, maxDurationSeconds = 120) {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContextClass();

  // Decode audio data from video container
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Resample to 16kHz Mono WAV (standard for Whisper)
  const targetSampleRate = 16000;
  const duration = Math.min(audioBuffer.duration, maxDurationSeconds);
  const totalSamples = Math.floor(duration * targetSampleRate);

  const offlineCtx = new OfflineAudioContext(1, totalSamples, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  audioCtx.close();
  return bufferToWav(renderedBuffer);
}

/**
 * Convert an AudioBuffer to a WAV Blob (16-bit PCM)
 */
function bufferToWav(buffer) {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const samples = buffer.getChannelData(0);
  const bufferLength = samples.length * 2;
  const headerLength = 44;
  const outBuffer = new ArrayBuffer(headerLength + bufferLength);
  const view = new DataView(outBuffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

// Local FastAPI & Flask server direct URLs (tries port 8000 first, then 5000)
export const LOCAL_SERVER_URL = "http://127.0.0.1:8000";
export const LOCAL_FALLBACK_URL = "http://127.0.0.1:5000";

// Public cloud backend URL (for deployed app or phone)
export const DEFAULT_CLOUD_URL = "https://inbox-mpg-traditional-efficiently.trycloudflare.com";

// Auto-detect environment:
// If running on laptop (localhost:5173 / 127.0.0.1), use direct local server for zero lag
export function getBackendUrl() {
  const custom = localStorage.getItem("captive_backend_url");
  if (custom) return custom;

  if (typeof window !== 'undefined' && 
     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return LOCAL_SERVER_URL;
  }
  return import.meta.env.VITE_BACKEND_URL || DEFAULT_CLOUD_URL;
}

export function setBackendUrl(url) {
  if (!url) {
    localStorage.removeItem("captive_backend_url");
  } else {
    localStorage.setItem("captive_backend_url", url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Send WAV blob to Python transcription server (faster-whisper)
 * Works with Localhost or Deployed Cloud Server
 * mode: 'hinglish' | 'english'
 * Returns array of {id, text, start, end, emoji} objects
 */
export async function transcribeWithLocalServer(wavBlob, mode = 'hinglish') {
  const form = new FormData();
  form.append('file', wavBlob, 'audio.wav');
  form.append('mode', mode);

  const serverUrl = getBackendUrl();
  const endpoint = `${serverUrl.replace(/\/+$/, '')}/transcribe`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: form,
      headers: {
        'Bypass-Tunnel-Reminder': 'true'
      }
    });
  } catch (networkErr) {
    throw new Error(
      `Backend server (${serverUrl}) se connect nahi ho paya! ` +
      'Kripya internet check karein ya server reload hone ka wait karein.'
    );
  }

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new Error(`Server error (${response.status}): ${txt}`);
  }

  const data = await response.json();
  const words = data.words || [];

  if (words.length === 0) {
    throw new Error('Audio me koi speech detect nahi hui. Kripya dobara try karein.');
  }

  return words.map((w, idx) => ({
    id: w.id || idx + 1,
    text: String(w.text || '').trim(),
    start: Number(w.start || 0),
    end: Number(w.end || (Number(w.start || 0) + 0.4)),
    emoji: w.emoji || ''
  }));
}
