/**
 * High-Performance 60FPS Canvas Caption Animation & Drawing Engine
 * Simulates Skia & Reanimated worklet transforms directly on HTML5 Canvas.
 */

// Elastic spring / bounce easing for kinetic pop
export function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Smooth sine bounce
export function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

/**
 * Calculates current word transform (scale, opacity, color)
 * based on preset animationType and playback progress
 */
export function calculateWordState(word, currentTime, preset) {
  const isCurrent = currentTime >= word.start && currentTime <= word.end;
  const isPast = currentTime > word.end;
  const isFuture = currentTime < word.start;

  if (isFuture) {
    return {
      scale: 1,
      opacity: preset.animationType === 'karaoke-highlight' ? 0.35 : 0,
      isHighlighted: false,
      color: preset.color,
      strokeColor: preset.strokeColor
    };
  }

  if (isCurrent) {
    const wordDur = Math.max(word.end - word.start, 0.15);
    const progress = Math.min(Math.max((currentTime - word.start) / wordDur, 0), 1);
    
    // Kinetic Pop / Bounce scale computation (0 -> 1.25 -> 1.0)
    let dynamicScale = 1;
    if (preset.animationType === 'pop' || preset.animationType === 'bounce') {
      const popT = Math.min(progress / 0.35, 1);
      const eased = easeOutBack(popT);
      dynamicScale = 1 + (preset.highlightScale - 1) * eased;
    } else {
      dynamicScale = preset.highlightScale || 1.15;
    }

    return {
      scale: dynamicScale,
      opacity: 1,
      isHighlighted: true,
      color: preset.highlightColor || '#FFE600',
      strokeColor: preset.highlightStroke || '#000000',
      progress
    };
  }

  // Past word
  return {
    scale: 1,
    opacity: preset.animationType === 'karaoke-highlight' ? 0.85 : 1,
    isHighlighted: false,
    color: preset.color || '#FFFFFF',
    strokeColor: preset.strokeColor || '#000000'
  };
}

/**
 * Groups words into compact chunks (wordsPerLine) based on timestamps
 */
export function getActivePhrase(words, currentTime, wordsPerLine = 3) {
  if (!words || !words.length) return [];

  // Find active word index
  const activeIdx = words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
  let centerIdx = activeIdx;

  if (centerIdx === -1) {
    // Check if between words or near a word
    const nextIdx = words.findIndex(w => w.start > currentTime);
    if (nextIdx > 0 && currentTime - words[nextIdx - 1].end < 0.45) {
      centerIdx = nextIdx - 1;
    } else {
      return [];
    }
  }

  const chunkIndex = Math.floor(centerIdx / wordsPerLine);
  const startSlice = chunkIndex * wordsPerLine;
  return words.slice(startSlice, startSlice + wordsPerLine);
}

/**
 * Draws professional kinetic captions onto Canvas with stroke, drop-shadow, and glow
 */
export function renderCaptionsToCanvas(ctx, words, currentTime, preset, canvasWidth, canvasHeight, options = {}) {
  const phrase = getActivePhrase(words, currentTime, preset.wordsPerLine || 3);
  if (!phrase || phrase.length === 0) return;

  ctx.save();

  // If "behind-text" mode is active, adjust composite operation or blend mode
  if (preset.animationType === 'behind-text') {
    ctx.globalCompositeOperation = options.compositeOperation || 'source-over';
  }

  const baseFontSize = (preset.fontSize || 44) * (canvasWidth / 720);
  ctx.font = `${preset.fontWeight || '900'} ${baseFontSize}px ${preset.fontFamily || 'Impact, sans-serif'}`;
  ctx.textBaseline = 'middle';

  // Measure word widths and spacing
  const wordTokens = phrase.map(w => {
    const textToDraw = preset.textTransform === 'uppercase' 
      ? String(w.word || w.text || '').toUpperCase() 
      : String(w.word || w.text || '');
    const metrics = ctx.measureText(textToDraw);
    const state = calculateWordState(w, currentTime, preset);
    return {
      word: w,
      text: textToDraw,
      width: metrics.width,
      state
    };
  });

  const spaceWidth = ctx.measureText(' ').width * 1.2;
  const totalPhraseWidth = wordTokens.reduce((acc, curr) => acc + curr.width, 0) + (wordTokens.length - 1) * spaceWidth;

  const startX = (canvasWidth - totalPhraseWidth) / 2;
  const posY = (canvasHeight * (preset.positionY || 75)) / 100;

  let currentX = startX;

  // Render each word token with individual matrix transformation
  wordTokens.forEach(token => {
    const { text, width, state } = token;
    if (state.opacity <= 0.01) {
      currentX += width + spaceWidth;
      return;
    }

    ctx.save();
    ctx.globalAlpha = state.opacity;

    // Transform origin: center of word for kinetic scale pop
    const wordCenterX = currentX + width / 2;
    const wordCenterY = posY;

    ctx.translate(wordCenterX, wordCenterY);
    ctx.scale(state.scale, state.scale);
    ctx.translate(-wordCenterX, -wordCenterY);

    // Drop shadow
    if (preset.shadowBlur > 0) {
      ctx.shadowColor = preset.shadowColor || 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = preset.shadowBlur * (canvasWidth / 720);
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;
    }

    // Glow highlight effect if active
    if (state.isHighlighted && preset.glow) {
      ctx.shadowColor = state.color;
      ctx.shadowBlur = (preset.shadowBlur || 10) * 1.5;
    }

    // Stroke outline (Skia style drawGlyphs border)
    if (preset.strokeWidth > 0 && state.strokeColor && state.strokeColor !== 'transparent') {
      ctx.strokeStyle = state.strokeColor;
      ctx.lineWidth = (preset.strokeWidth || 6) * (canvasWidth / 720);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(text, currentX, posY);
    }

    // Fill text
    ctx.fillStyle = state.color;
    ctx.fillText(text, currentX, posY);

    ctx.restore();

    currentX += width + spaceWidth;
  });

  ctx.restore();
}

