// 🎸 吉他标准音（EADGBE）空弦音（0品）的绝对物理基准频率
const STRING_BASE_FREQUENCIES = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

let audioCtx: AudioContext | null = null;

/**
 * 🎸 绝对音准吉他音频引擎（滤波器修复版）
 */
export const playGuitarTone = (stringIdx: number, fretIdx: number) => {
  // console.log(`播放音符：${stringIdx} ${fretIdx}`);
  try {
    const safeStringIdx = Math.max(0, Math.min(5, stringIdx));
    const safeFretIdx = Math.max(0, Math.min(12, fretIdx));

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 1. 推算精准的基音频率
    const openStringFreq = STRING_BASE_FREQUENCIES[safeStringIdx] || 110.00;
    let frequency = openStringFreq * Math.pow(2, safeFretIdx / 12);

    if (!isFinite(frequency) || frequency <= 0) {
      frequency = 220.00;
    }

    // 2. 建立动态压缩器
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.15, now);
    compressor.connect(audioCtx.destination);

    // 3. 主音量包络控制
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    masterGain.connect(compressor);

    // 4. 🎸 塑造箱体共鸣（核心修复区：双向时间节点对齐）
    const filterMultiplier = 5.0 - (safeStringIdx * 0.6);
    const initialCutoff = Math.max(80, frequency * filterMultiplier);
    const finalCutoff = Math.max(80, frequency * (1.0 + (5 - safeStringIdx) * 0.05 + 0.01));

    const bodyFilter = audioCtx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.Q.setValueAtTime(1.0, now);

    if (isFinite(initialCutoff) && isFinite(finalCutoff)) {
      // 🛠️ 关键修复：必须在同一时间点先 setValueAtTime 设为初始值！
      bodyFilter.frequency.setValueAtTime(initialCutoff, now);
      // 🛠️ 紧接着才能正确触发向目标值的指数过渡，否则部分浏览器里整个滤波器会直接卡死不动！
      bodyFilter.frequency.exponentialRampToValueAtTime(finalCutoff, now + 0.35);
    } else {
      bodyFilter.frequency.setValueAtTime(2000, now);
    }
    bodyFilter.connect(masterGain);

    // 5. 多音色振荡器矩阵叠加
    // 【振荡器 A：基音】
    const oscBase = audioCtx.createOscillator();
    oscBase.type = 'triangle';
    oscBase.frequency.setValueAtTime(frequency, now);

    const gainBase = audioCtx.createGain();
    const baseVolume = 0.6 + (safeStringIdx * 0.04);
    gainBase.gain.setValueAtTime(baseVolume, now);
    oscBase.connect(gainBase);
    gainBase.connect(bodyFilter);

    // 【振荡器 B：金属钢弦泛音】
    const oscTone = audioCtx.createOscillator();
    oscTone.type = 'sawtooth';
    oscTone.frequency.setValueAtTime(frequency + 0.4, now);

    const gainTone = audioCtx.createGain();
    const toneVolume = Math.max(0.01, 0.45 - (safeStringIdx * 0.06));
    gainTone.gain.setValueAtTime(toneVolume, now);
    // 🛠️ 同样的硬性规定：增益的指数过渡前也必须先锁死起点
    gainTone.gain.setValueAtTime(toneVolume, now);
    gainTone.gain.exponentialRampToValueAtTime(0.005, now + 0.18 + (5 - safeStringIdx) * 0.02);

    oscTone.connect(gainTone);
    gainTone.connect(bodyFilter);

    // 【振荡器 C：触弦瞬态】
    const oscPluck = audioCtx.createOscillator();
    oscPluck.type = 'sine';
    const pluckFreq = Math.max(100, frequency * (7 - safeStringIdx * 0.5));
    oscPluck.frequency.setValueAtTime(pluckFreq, now);

    const gainPluck = audioCtx.createGain();
    gainPluck.gain.setValueAtTime(0.4, now);
    // 🛠️ 锁死起点
    gainPluck.gain.setValueAtTime(0.4, now);
    gainPluck.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    oscPluck.connect(gainPluck);
    gainPluck.connect(bodyFilter);

    // 6. 齐奏启动
    oscBase.start(now);
    oscTone.start(now);
    oscPluck.start(now);

    oscBase.stop(now + 1.6);
    oscTone.stop(now + 1.6);
    oscPluck.stop(now + 1.6);

  } catch (e) {
    console.warn("音频引擎终极稳健层捕获异常:", e);
  }
};