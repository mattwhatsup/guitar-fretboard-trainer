import type { InstrumentType } from '../store/useGameStore';

const GUITAR_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
const UKULELE_FREQS = [440.00, 329.63, 261.63, 392.00];

let audioCtx: AudioContext | null = null;

// 在你的 playGuitarTone 文件中增加并导出这个函数
export const initAudioContext = () => {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    // 如果已经存在，强行在用户原生的触摸事件里 resume 激活它
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log("🔊 iOS 音频引擎成功激活！当前状态:", audioCtx?.state);
      });
    }
  } catch (e) {
    console.error("初始化音频失败", e);
  }
};

export const playGuitarTone = (instrument: InstrumentType, stringIdx: number, fretIdx: number) => {
  try {
    const maxString = instrument === 'guitar' ? 5 : 3;
    const safeStringIdx = Math.max(0, Math.min(maxString, stringIdx));
    const safeFretIdx = Math.max(0, Math.min(12, fretIdx));

    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    // 🛠️ 核心修复：防止 TS18047 'audioCtx' is possibly 'null'
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const freqs = instrument === 'guitar' ? GUITAR_FREQS : UKULELE_FREQS;
    const openStringFreq = freqs[safeStringIdx] || 110.00;
    let frequency = openStringFreq * Math.pow(2, safeFretIdx / 12);

    if (!isFinite(frequency) || frequency <= 0) {
      frequency = 220.00;
    }

    // 尤克里里的物理余音衰减稍快于吉他
    const duration = instrument === 'ukulele' ? 0.9 : 1.6;

    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.15, now);
    compressor.connect(audioCtx.destination);

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(compressor);

    const filterMultiplier = instrument === 'ukulele' ? 6.5 : (5.0 - (safeStringIdx * 0.6));
    const initialCutoff = Math.max(80, frequency * filterMultiplier);
    const finalCutoff = Math.max(80, frequency * (1.0 + (5 - safeStringIdx) * 0.05 + 0.01));

    const bodyFilter = audioCtx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.Q.setValueAtTime(1.0, now);

    if (isFinite(initialCutoff) && isFinite(finalCutoff)) {
      bodyFilter.frequency.setValueAtTime(initialCutoff, now);
      bodyFilter.frequency.exponentialRampToValueAtTime(finalCutoff, now + 0.35);
    } else {
      bodyFilter.frequency.setValueAtTime(2000, now);
    }
    bodyFilter.connect(masterGain);

    // 【振荡器 A：基音】
    const oscBase = audioCtx.createOscillator();
    oscBase.type = instrument === 'ukulele' ? 'sine' : 'triangle';
    oscBase.frequency.setValueAtTime(frequency, now);
    const gainBase = audioCtx.createGain();
    const baseVolume = 0.6 + (safeStringIdx * 0.04);
    gainBase.gain.setValueAtTime(baseVolume, now);
    oscBase.connect(gainBase);
    gainBase.connect(bodyFilter);

    // 【振荡器 B：金属泛音】
    const oscTone = audioCtx.createOscillator();
    oscTone.type = 'sawtooth';
    oscTone.frequency.setValueAtTime(frequency + 0.4, now);
    const gainTone = audioCtx.createGain();
    const toneVolume = instrument === 'ukulele' ? 0.05 : Math.max(0.01, 0.45 - (safeStringIdx * 0.06));
    gainTone.gain.setValueAtTime(toneVolume, now);
    gainTone.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
    oscTone.connect(gainTone);
    gainTone.connect(bodyFilter);

    // 【振荡器 C：触弦瞬态】
    const oscPluck = audioCtx.createOscillator();
    oscPluck.type = 'sine';
    const pluckFreq = Math.max(100, frequency * (7 - safeStringIdx * 0.5));
    oscPluck.frequency.setValueAtTime(pluckFreq, now);
    const gainPluck = audioCtx.createGain();
    gainPluck.gain.setValueAtTime(0.4, now);
    gainPluck.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    oscPluck.connect(gainPluck);
    gainPluck.connect(bodyFilter);

    oscBase.start(now);
    oscTone.start(now);
    oscPluck.start(now);

    oscBase.stop(now + duration);
    oscTone.stop(now + duration);
    oscPluck.stop(now + duration);

  } catch (e) {
    console.warn("音频引擎高级采样异常恢复:", e);
  }
};