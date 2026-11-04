// High-Impact Hinglish & English Word-to-Emoji Semantic Engine
// Tag only impactful, key trigger words (har word par nahi, sirf highlight-worthy words par)

export const EMOJI_DICTIONARY = {
  // Money, Wealth & Earnings (Very High CTR)
  paisa: "💸",
  paise: "💰",
  rupaye: "💵",
  rupiya: "💵",
  crore: "🤑",
  crores: "🤑",
  lakh: "💵",
  lakhs: "💵",
  money: "💸",
  cash: "💵",
  rich: "🪙",
  ameer: "🤑",
  profit: "📈",
  munafa: "💰",
  business: "💼",
  sales: "🏷️",
  income: "💳",
  earning: "💸",
  earnings: "💸",
  kamao: "💰",
  kamana: "💰",
  kama: "💰",
  kamaye: "💰",
  dollar: "💵",
  dollars: "💵",
  investment: "📊",
  invest: "📊",

  // Viral, Hype & Energy
  viral: "🔥",
  fire: "🔥",
  trending: "📈",
  trend: "📈",
  bawaal: "💥",
  kamaal: "🔥",
  boom: "💥",
  crazy: "🤯",
  hila: "⚡",
  shandar: "✨",
  magic: "✨",
  magical: "✨",
  secret: "🤫",
  raaz: "🤫",
  hack: "🛠️",
  hacks: "💡",
  tricks: "⚡",
  trick: "🎯",
  tip: "💡",
  tips: "💡",
  power: "💪",
  powerful: "💪",
  dum: "🔥",
  blast: "💥",
  toofaan: "🌪️",

  // Growth, Speed & Urgency
  growth: "🚀",
  grow: "🚀",
  rocket: "🚀",
  fast: "⚡",
  superfast: "⚡",
  speed: "🏎️",
  jaldi: "⚡",
  quick: "⚡",
  seconds: "⏱️",
  minute: "🕒",
  waqt: "⏳",
  time: "⏱️",
  late: "⏰",
  now: "🚨",
  aaj: "📅",

  // Tech, Creator, Hardware & Gadgets
  ai: "🤖",
  robot: "🦾",
  sensor: "📡",
  sensors: "📡",
  camera: "📷",
  phone: "📱",
  mobile: "📱",
  mic: "🎙️",
  audio: "🔊",
  video: "🎬",
  reel: "🎞️",
  reels: "🎞️",
  youtube: "▶️",
  instagram: "📸",
  app: "📲",
  website: "🌐",
  code: "💻",
  coding: "💻",
  tech: "⚡",
  chatgpt: "🤖",
  tool: "🛠️",
  tools: "🛠️",
  software: "💻",
  computer: "🖥️",
  screen: "🖥️",
  bluetooth: "📶",
  wifi: "📶",
  chip: "🖲️",
  device: "📟",
  devices: "📟",
  machine: "⚙️",
  battery: "🔋",
  data: "💾",

  // Warnings, Mistakes & Stops
  warning: "⚠️",
  danger: "⚠️",
  khatra: "⚠️",
  stop: "🛑",
  ruko: "🛑",
  ruk: "🛑",
  mat: "❌",
  galti: "❌",
  mistake: "🚫",
  never: "⛔",
  alert: "🚨",
  dhyaan: "👀",
  loss: "📉",
  ghata: "📉",

  // Shock, Mindblown & Curiosity
  shock: "😱",
  shocked: "🤯",
  omg: "😱",
  unbelievable: "🤯",
  dekho: "👀",
  dekh: "👀",
  suno: "👂",
  sun: "👂",
  kya: "❓",
  kyun: "❓",
  kaise: "🤔",
  soch: "🧠",
  socho: "💡",
  idea: "💡",
  dimag: "🧠",
  batao: "🗣️",
  bata: "🗣️",
  jaan: "🔍",
  jaano: "🔍",
  jaanenge: "🔍",
  samjho: "💡",
  samajh: "💡",

  // Authority, Win & Success
  king: "👑",
  queen: "👑",
  boss: "😎",
  hero: "🦸",
  winner: "🏆",
  win: "🏆",
  jeeto: "🥇",
  success: "🎯",
  target: "🎯",
  goal: "🎯",
  focus: "🎯",
  number1: "🥇",
  best: "⭐",
  star: "⭐",
  super: "🌟",
  top: "🔝",
  free: "🎁",
  gift: "🎁",

  // Love, Emotions & Community
  love: "❤️",
  dil: "❤️",
  pyar: "💖",
  like: "👍",
  follow: "🔔",
  subscribe: "🔔",
  share: "✈️",
  comment: "💬",
  support: "🤝",
  bhai: "🤜🤛",
  bhaiyo: "🤜🤛",
  dost: "🤝",
  dosto: "👥",
  family: "👨‍👩‍👧",

  // Confirmation, Work & Truth
  sach: "💯",
  real: "💯",
  asli: "💎",
  diamond: "💎",
  gold: "🏆",
  guarantee: "🛡️",
  proof: "📜",
  result: "📊",
  results: "📊",
  yes: "✅",
  right: "✅",
  perfect: "👌",
  kaam: "⚙️",
  work: "⚙️",
  working: "⚙️",
  karta: "⚙️",
  easy: "✨",
  simple: "✨",
  hard: "🏋️",
  heavy: "🏋️"
};

// Common filler/connector words that should NEVER get an emoji
const BLACKLIST = new Set([
  "hai", "hain", "tha", "thi", "the", "ka", "ki", "ke", "ko", "se", "me", "mein",
  "par", "pe", "aur", "ya", "bhi", "hi", "to", "toh", "hum", "tum", "aap", "ye", "wo",
  "kar", "karte", "raha", "rahe", "rahi", "hona", "hua", "hue", "lekin", "magar", "agar"
]);

export const autoDetectEmoji = (text) => {
  if (!text) return "";
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean || clean.length < 2) return "";
  if (BLACKLIST.has(clean)) return "";

  // 1. Direct dictionary match
  if (EMOJI_DICTIONARY[clean]) {
    return EMOJI_DICTIONARY[clean];
  }

  // 2. Flexible Substring / Stem matching
  for (const [key, em] of Object.entries(EMOJI_DICTIONARY)) {
    if (key.length >= 3) {
      if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
        return em;
      }
    }
  }

  return "";
};
