// Utility to export SRT, ASS (Advanced SubStation Alpha) subtitles and FFmpeg CLI commands

function formatSrtTime(seconds) {
  const pad = (num, size) => ('000' + num).slice(-size);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

function formatAssTime(seconds) {
  const pad = (num, size) => ('000' + num).slice(-size);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.floor((seconds % 1) * 100);
  return `${hrs}:${pad(mins, 2)}:${pad(secs, 2)}.${pad(centis, 2)}`;
}

export function generateSrt(words, wordsPerChunk = 2) {
  let srtOutput = '';
  let counter = 1;

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk);
    if (!chunk.length) continue;

    const startTime = formatSrtTime(chunk[0].start);
    const endTime = formatSrtTime(chunk[chunk.length - 1].end);
    const text = chunk.map(w => (w.emoji ? `${w.text} ${w.emoji}` : w.text)).join(' ');

    srtOutput += `${counter}\n`;
    srtOutput += `${startTime} --> ${endTime}\n`;
    srtOutput += `${text}\n\n`;
    counter++;
  }
  return srtOutput;
}

export function generateAss(words, style) {
  const primaryBgr = style.textColor === '#FFFFFF' ? '&H00FFFFFF' : '&H00F0F0F0';
  const highlightBgr = '&H0015CCFA'; // Yellow in BGR

  let ass = `[Script Info]
Title: Dynamic AI Hinglish Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hormozi,Impact,72,${primaryBgr},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,2,40,40,240,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Generate karaoke / highlighted ASS dialogue events
  words.forEach(w => {
    const start = formatAssTime(w.start);
    const end = formatAssTime(w.end);
    const emojiStr = w.emoji ? ` ${w.emoji}` : '';
    // ASS override tags for pop effect: {\c&H0015CCFA&\fscx120\fscy120}
    const text = `{\\c${highlightBgr}\\fscx115\\fscy115}${w.text}${emojiStr}{\\r}`;
    ass += `Dialogue: 0,${start},${end},Hormozi,,0,0,0,,${text}\n`;
  });

  return ass;
}

export function generateFFmpegCommand(videoFileName = "input.mp4") {
  return `# Step 1: Extract Audio
ffmpeg -i ${videoFileName} -vn -ar 16000 -ac 1 audio.wav

# Step 2: Burn Dynamic ASS Captions + Auto-Ducking Background Music
ffmpeg -i ${videoFileName} -i bgm.mp3 -filter_complex "[1:a]volume=0.18[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout];[0:v]subtitles=captions.ass[vout]" -map "[vout]" -map "[aout]" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k output_viral.mp4`;
}

