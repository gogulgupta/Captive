// Web Audio API based Synthesizer & Sound FX Generator + Custom Audio File Support
// 100% self-contained, supports both procedural synthesized loops & user uploaded audio files

let audioCtx = null;
let bgmGainNode = null;
let currentBgmInterval = null;
let isAudioMuted = false;

// Custom uploaded audio element & node
let customAudioElement = null;
let customAudioSourceNode = null;

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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'whoosh') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'chime' || type === 'money') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.warn("SFX error:", e);
  }
}

export const BGM_TRACKS = [
  { id: "trap-phonk", name: "Aggressive Phonk / Trap", genre: "Hype / Gym", bpm: 135 },
  { id: "chill-lofi", name: "Late Night Chill Lofi", genre: "Chill / Edu", bpm: 82 },
  { id: "tech-pop", name: "Punchy Tech Pop", genre: "Tech / Modern", bpm: 120 },
  { id: "none", name: "No Music (Only Voice)", genre: "Voice Only", bpm: 0 },
];

/**
 * Start playing BGM (either custom uploaded file OR synthesized procedural loop)
 */
export function startBgmSynth(trackId, volume = 0.2, customAudioUrl = null) {
  stopBgmSynth();

  if (trackId === "none") return;

  const ctx = getAudioContext();

  if (!bgmGainNode) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.connect(ctx.destination);
  }
  bgmGainNode.gain.setValueAtTime(volume, ctx.currentTime);

  // 1. Play Custom Uploaded Audio Track
  if (trackId === "custom" && customAudioUrl) {
    try {
      if (!customAudioElement) {
        customAudioElement = new Audio();
        customAudioElement.crossOrigin = "anonymous";
        customAudioElement.loop = true;
      }
      customAudioElement.src = customAudioUrl;
      customAudioElement.volume = 1.0; // Volume managed through WebAudio bgmGainNode

      if (!customAudioSourceNode) {
        customAudioSourceNode = ctx.createMediaElementSource(customAudioElement);
        customAudioSourceNode.connect(bgmGainNode);
      }

      customAudioElement.play().catch(err => {
        console.warn("Custom audio play blocked:", err);
      });
      return;
    } catch (e) {
      console.error("Failed to play custom audio:", e);
    }
  }

  // 2. Play Procedural Synthesizer Tracks
  const track = BGM_TRACKS.find(t => t.id === trackId);
  if (!track || track.bpm === 0) return;

  const intervalMs = (60 / track.bpm / 2) * 1000;
  let step = 0;

  currentBgmInterval = setInterval(() => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (trackId === "trap-phonk") {
      if (step % 4 === 0) triggerKick(ctx, bgmGainNode, now);
      if (step % 8 === 4) triggerSnare(ctx, bgmGainNode, now);
      triggerHiHat(ctx, bgmGainNode, now);
    } else if (trackId === "chill-lofi") {
      if (step % 8 === 0) triggerLofiChord(ctx, bgmGainNode, now, 261.63);
      if (step % 8 === 4) triggerLofiChord(ctx, bgmGainNode, now, 329.63);
    } else {
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
  if (customAudioElement) {
    try {
      customAudioElement.pause();
      customAudioElement.currentTime = 0;
    } catch (e) {}
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
  gain.gain.setValueAtTime(0.07, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.start(time);
  osc.stop(time + 0.05);
}

function triggerLofiChord(ctx, destination, time, rootFreq) {
  [rootFreq, rootFreq * 1.25, rootFreq * 1.5].forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(destination);
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    osc.start(time);
    osc.stop(time + 0.8);
  });
}

function triggerPopArp(ctx, destination, time, step) {
  const scale = [440, 523.25, 659.25, 783.99];
  const freq = scale[step % scale.length];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(destination);
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.09, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.start(time);
  osc.stop(time + 0.15);
}
