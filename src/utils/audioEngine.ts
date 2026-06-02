// 🎵 标准十二平均律频率基准表
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 130.81, 'C#': 138.59, 'Db': 138.59,
  'D': 146.83, 'D#': 155.56, 'Eb': 155.56,
  'E': 164.81, 'F': 174.61, 'F#': 185.00, 'Gb': 185.00,
  'G': 196.00, 'G#': 207.65, 'Ab': 207.65,
  'A': 220.00, 'A#': 233.08, 'Bb': 233.08,
  'B': 246.94
};

// 吉他 1 弦到 6 弦的标准音高相对偏移
const STRING_OCTAVE_OFFSETS = [12, 7, 2, -3, -8, -12];

let audioCtx: AudioContext | null = null;

export const playGuitarTone = (stringIdx: number, rawNote: string) => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 1. 计算当前弦品的精准物理频率值 (基音 f)
    const baseFreq = NOTE_FREQUENCIES[rawNote] || 220;
    const octaveScale = Math.pow(2, STRING_OCTAVE_OFFSETS[stringIdx] / 12);
    const frequency = baseFreq * octaveScale;

    // 2. 建立动态压缩器（模拟乐器音箱的聚拢感，防止声音爆音，增加质感）
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(10, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.2, now);
    compressor.connect(audioCtx.destination);

    // 主音量增益控制
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.005); // 极快的击弦速度
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8); // 更加自然的吉他余音余振
    masterGain.connect(compressor);

    // 3. 🎸 塑造箱体共鸣：低通滤波器电路
    // 吉他的高频会随着震动衰减得极快，模拟弦线的物理阻尼
    const bodyFilter = audioCtx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.Q.setValueAtTime(1.5, now);
    bodyFilter.frequency.setValueAtTime(frequency * 4, now); // 初始明亮
    bodyFilter.frequency.exponentialRampToValueAtTime(frequency * 1.1, now + 0.4); // 迅速变温暖
    bodyFilter.connect(masterGain);

    // 4. 🎛️ 多音色振荡器矩阵叠加（这是听起来像吉他的关键）

    // 【振荡器 A：基音内核】使用三角波，模拟琴弦和琴箱的浑厚基音
    const oscBase = audioCtx.createOscillator();
    oscBase.type = 'triangle';
    oscBase.frequency.setValueAtTime(frequency, now);

    const gainBase = audioCtx.createGain();
    gainBase.gain.setValueAtTime(0.7, now);
    oscBase.connect(gainBase);
    gainBase.connect(bodyFilter);

    // 【振荡器 B：金属泛音】使用锯齿波（带有些许物理泛音），模拟钢弦的尖锐张力
    const oscTone = audioCtx.createOscillator();
    oscTone.type = 'sawtooth';
    // 轻微失调 1.5 块钱的声学误差，让声音更有木头乐器的不完美天然感
    oscTone.frequency.setValueAtTime(frequency + 0.5, now);

    const gainTone = audioCtx.createGain();
    gainTone.gain.setValueAtTime(0.3, now);
    // 金属泛音应该在拨弦后消散得更快
    gainTone.gain.setValueAtTime(0.3, now);
    gainTone.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscTone.connect(gainTone);
    gainTone.connect(bodyFilter);

    // 【振荡器 C：拨片敲击瞬态噪声 (Click)】
    // 模拟肉手或拨片刮过琴弦那一瞬间的打击感
    const oscPluck = audioCtx.createOscillator();
    oscPluck.type = 'sine';
    oscPluck.frequency.setValueAtTime(frequency * 6, now); // 极高频冲刷

    const gainPluck = audioCtx.createGain();
    gainPluck.gain.setValueAtTime(0.5, now);
    gainPluck.gain.exponentialRampToValueAtTime(0.001, now + 0.03); // 0.03秒内人间蒸发

    oscPluck.connect(gainPluck);
    gainPluck.connect(bodyFilter);

    // 5. 齐奏启动与物理切音
    oscBase.start(now);
    oscTone.start(now);
    oscPluck.start(now);

    oscBase.stop(now + 1.8);
    oscTone.stop(now + 1.8);
    oscPluck.stop(now + 1.8);

  } catch (e) {
    console.warn("音频引擎高级物理合成失败:", e);
  }
};