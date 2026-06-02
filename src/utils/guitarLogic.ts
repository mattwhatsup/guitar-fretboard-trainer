// 1. 标准十二平均律的音名数组（使用升号 # 表示半音）
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 2. 标准音吉他（EADGBE）从 1 弦到 6 弦的空弦音在 NOTES 数组中的索引
// 1弦: E (4), 2弦: B (11), 3弦: G (7), 4弦: D (2), 5弦: A (9), 6弦: E (4)
// 注意：数组 0 对应 1 弦（最细的那条），5 对应 6 弦（最粗的那条）
export const STRING_ROOTS = [4, 11, 7, 2, 9, 4];

/**
 * 3. 核心工具函数：根据【弦号】和【品格】，计算出对应的音名
 * @param stringIndex 弦的索引（0 到 5）
 * @param fretIndex 品格的位置（0 到 12，0 代表空弦）
 * @returns 对应的音名（如 "C", "F#" 等）
 */
export const getNoteByPosition = (stringIndex: number, fretIndex: number): string => {
  // 获取这条弦空弦音的起点
  const rootIndex = STRING_ROOTS[stringIndex];

  // 空弦音加上品格数，然后对 12 取模，就能循环得到当前品格的音符索引
  const noteIndex = (rootIndex + fretIndex) % 12;

  return NOTES[noteIndex];
};

/**
 * 4. 辅助工具：生成一个随机音名，用于后续的记忆测试题目
 */
export const getRandomNote = (): string => {
  const randomIndex = Math.floor(Math.random() * NOTES.length);
  return NOTES[randomIndex];
};