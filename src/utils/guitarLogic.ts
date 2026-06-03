import type { InstrumentType } from '../store/useGameStore'

// 1. 标准十二平均律的音名数组（使用升号 # 表示半音）
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 2. 标准音吉他（EADGBE）从 1 弦到 6 弦的空弦音在 NOTES 数组中的索引
// 1弦: E (4), 2弦: B (11), 3弦: G (7), 4弦: D (2), 5弦: A (9), 6弦: E (4)
export const GUITAR_STRING_ROOTS = [4, 11, 7, 2, 9, 4];

// 🍍 新增：尤克里里标准定音（A-E-C-G）从 1 弦到 4 弦的空弦音索引
// 1弦: A (9), 2弦: E (4), 3弦: C (0), 4弦: G (7)
export const UKULELE_STRING_ROOTS = [9, 4, 0, 7];

/**
 * 3. 核心工具函数：根据【乐器】、【弦号】和【品格】，计算出对应的音名
 * @param instrument 乐器类型 ('guitar' | 'ukulele')
 * @param stringIndex 弦的索引（吉他 0~5，乌克丽丽 0~3）
 * @param fretIndex 品格的位置（0 到 12，0 代表空弦）
 * @returns 对应的音名（如 "C", "F#" 等）
 */
export const getNoteByPosition = (instrument: InstrumentType, stringIndex: number, fretIndex: number): string => {
  // 根据当前乐器，动态选择使用吉他还是尤克里里的空弦音根索引
  const roots = instrument === 'guitar' ? GUITAR_STRING_ROOTS : UKULELE_STRING_ROOTS;

  // 获取这条弦空弦音的起点
  const rootIndex = roots[stringIndex] ?? 0;

  // 空弦音加上品格数，然后对 12 取模，就能循环得到当前品格的音符索引
  const noteIndex = (rootIndex + fretIndex) % 12;

  return NOTES[noteIndex];
};

/**
 * 4. 辅助工具：生成一个随机音名，用于后续的记忆测试题目（完美补回并兼容新架构）
 * @param onlyNatural 是否只限自然音符
 */
export const getRandomNote = (onlyNatural: boolean = false): string => {
  let list = [...NOTES];
  if (onlyNatural) {
    // 如果开启了只限自然音，过滤掉带 # 号的半音
    list = list.filter(note => !note.includes('#'));
  }
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
};