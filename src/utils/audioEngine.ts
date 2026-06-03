import type { InstrumentType } from '../store/useGameStore';

// 🌟 全局声明扩展 Window 接口，完美通过 TypeScript 严格检查，干掉 `any`
declare global {
  interface Window {
    __guitarAudioCtx?: AudioContext;
    WeixinJSBridge?: {
      invoke: (method: string, args: object, callback: () => void, loop: boolean) => void;
    };
  }
}

const GUITAR_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
const UKULELE_FREQS = [440.00, 329.63, 261.63, 392.00];

/**
 * 🌟 核心解锁函数：在用户第一顺位点击流中被调用，强行激活 iOS 音频管道
 */
export const initAudioContext = () => {
  try {
    if (!window.__guitarAudioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        window.__guitarAudioCtx = new AudioContextClass();
      }
    }

    const ctx = window.__guitarAudioCtx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log("🔊 iOS 硬件音频管道激活成功！状态:", ctx.state);

        // 🚀 iOS 终极秘籍：创建一个瞬间的静音振荡器，强行让 iOS 硬件管道通电
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.001);
      }).catch(err => {
        console.warn("激活音频管道失败:", err);
      });
    }
  } catch (e) {
    console.error("初始化全局音频上下文失败:", e);
  }
};

/**
 * 吉他/尤克里里 声音合成与播放主函数
 */
export const playGuitarTone = (instrument: InstrumentType, stringIdx: number, fretIdx: number) => {
  try {
    const maxString = instrument === 'guitar' ? 5 : 3;
    const safeStringIdx = Math.max(0, Math.min(maxString, stringIdx));
    const safeFretIdx = Math.max(0, Math.min(12, fretIdx));

    // 如果还没有上下文，尝试立刻初始化
    if (!window.__guitarAudioCtx) {
      initAudioContext();
    }

    const audioCtx = window.__guitarAudioCtx;
    if (!audioCtx) return; // 规避 TS Null 检查错误

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

    // 压缩器节点
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.15, now);
    compressor.connect(audioCtx.destination);

    // 主音量节点
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(compressor);

    // 动态滤波器
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

    // 启动与停止
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