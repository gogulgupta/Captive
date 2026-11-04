// Web Audio API based Synthesizer & Sound FX Generator
// 100% self-contained, no external mp3 loading lag or CORS issues!

let audioCtx = null;
let bgmGainNode = null;
let currentBgmInterval = null;
let isAudioMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play Sound FX (Pop, Whoosh, Cash Chime)
export function playSfx(type = 'pop') {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'pop') {
      // Bouncy pop sound for emoji appearance
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'whoosh') {
      // Quick whoosh effect
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'chime' || type === 'money') {
      // Pleasant coin/chime sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.warn("Audio play error", e);
  }
}

// Background Music synthesizers for preview
export const BGM_TRACKS = [
  { id: "none", name: "None (Original Audio Only)", genre: "Off", tempo: 0 },
  { id: "trap-phonk", name: "Viral Trap Beats", genre: "Energetic", tempo: 130 },
  { id: "chill-lofi", name: "Chill Creator Lofi", genre: "Relaxed", tempo: 85 },
  { id: "tech-pop", name: "Upbeat Vlog Pop", genre: "Happy", tempo: 115 }
];

export function startBgmSynth(trackId, volume = 0.2, isSpeechActive = false) {
  stopBgmSynth();
  if (!trackId || trackId === "none") return;

  const ctx = getAudioContext();
  bgmGainNode = ctx.createGain();
  // If speech is active, apply audio ducking (lower volume)
  const targetVol = isSpeechActive ? volume * 0.35 : volume;
  bgmGainNode.gain.setValueAtTime(targetVol, ctx.currentTime);
  bgmGainNode.connect(ctx.destination);

  let step = 0;
  const bpm = trackId === "trap-phonk" ? 130 : trackId === "chill-lofi" ? 85 : 115;
  const intervalMs = (60 / bpm / 2) * 1000;

  currentBgmInterval = setInterval(() => {
    if (isAudioMuted || !bgmGainNode) return;
    const now = ctx.currentTime;
    
    // Beat patterns
    if (trackId === "trap-phonk") {
      // 808 kick on beat 0 & 4
      if (step % 8 === 0 || step % 8 === 5) {
        triggerKick(ctx, bgmGainNode, now);
      }
      // Snare on 4
      if (step % 8 === 4) {
        triggerSnare(ctx, bgmGainNode, now);
      }
      // Hi-hat
      triggerHiHat(ctx, bgmGainNode, now);
    } else if (trackId === "chill-lofi") {
      if (step % 8 === 0) triggerLofiChord(ctx, bgmGainNode, now, 261.63); // C4
      if (step % 8 === 4) triggerLofiChord(ctx, bgmGainNode, now, 329.63); // E4
    } else {
      // tech-pop
      if (step % 4 === 0) triggerKick(ctx, bgmGainNode, now);
      if (step % 2 === 0) triggerPopArp(ctx, bgmGainNode, now, step);
    }

    step++;
  }, intervalMs);
}

export function updateBgmDucking(isSpeechActive, baseVolume = 0.2) {
  if (!bgmGainNode || !audioCtx) return;
  const targetVol = isSpeechActive ? baseVolume * 0.35 : baseVolume;
  bgmGainNode.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.1);
}

export function stopBgmSynth() {
  if (currentBgmInterval) {
    clearInterval(currentBgmInterval);
    currentBgmInterval = null;
  }
}

function triggerKick(ctx, destination, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(destination);
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.15);
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
  osc.start(time);
  osc.stop(time + 0.18);
}

function triggerSnare(ctx, destination, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.connect(gain);
  gain.connect(destination);
  osc.frequency.setValueAtTime(220, time);
  gain.gain.setValueAtTime(0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
  osc.start(time);
  osc.stop(time + 0.12);
}

function triggerHiHat(ctx, destination, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'highpass' in osc ? 'highpass' : 'sine';
  osc.frequency.setValueAtTime(8000, time);
  gain.gain.setValueAtTime(0.04, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.04);
}

function triggerLofiChord(ctx, destination, time, freq) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.005, time + 0.6);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.6);
}

function triggerPopArp(ctx, destination, time, step) {
  const notes = [440, 523.25, 659.25, 783.99]; // A4, C5, E5, G5
  const note = notes[step % notes.length];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(note, time);
  gain.gain.setValueAtTime(0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

