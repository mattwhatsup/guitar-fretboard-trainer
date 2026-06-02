const STRING_BASE_FREQUENCIES = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
let audioCtx: AudioContext | null = null;

export const playGuitarTone = (stringIdx: number, fretIdx: number) => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }

    // 修复 TS18047 错误：增加空值保护
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const safeStringIdx = Math.max(0, Math.min(5, stringIdx));
    const safeFretIdx = Math.max(0, Math.min(12, fretIdx));
    const frequency = STRING_BASE_FREQUENCIES[safeStringIdx] * Math.pow(2, safeFretIdx / 12);

    const compressor = audioCtx.createDynamicsCompressor();
    compressor.connect(audioCtx.destination);

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    masterGain.connect(compressor);

    const bodyFilter = audioCtx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(Math.max(80, frequency * 5), now);
    bodyFilter.connect(masterGain);

    const oscBase = audioCtx.createOscillator();
    oscBase.type = 'triangle';
    oscBase.frequency.setValueAtTime(frequency, now);
    const gainBase = audioCtx.createGain();
    gainBase.gain.value = 0.6;
    oscBase.connect(gainBase);
    gainBase.connect(bodyFilter);

    oscBase.start(now);
    oscBase.stop(now + 1.6);
  } catch (e) {
    console.warn("音频引擎启动失败:", e);
  }
};