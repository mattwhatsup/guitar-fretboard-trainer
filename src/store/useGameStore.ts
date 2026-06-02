import { create } from 'zustand'
import { getNoteByPosition } from '../utils/guitarLogic'

// 1. 在 Store 内部直接定义 NoteName 类型，彻底解决导入报错问题
export type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B" | "Db" | "Eb" | "Gb" | "Ab" | "Bb";

// 🎵 音符异名同音双向映射表，用于支持严格的“升降号倾向”比对
const ACCIDENTAL_MAPPING: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

interface GameState {
  currentNote: NoteName
  activeStrings: number[]
  correctPositions: { stringIdx: number; fretIdx: number }[]
  totalTargetCount: number
  showAnswerMode: boolean
  gameStage: 'playing' | 'completed'

  // ⏱️ 计时与看板
  timerMs: number
  isTimerRunning: boolean
  totalPassed: number
  totalTimeSpentMs: number
  lastClickedFeedback: { stringIdx: number; fretIdx: number; status: 'correct' | 'wrong' | 'none' }

  // 配置项
  onlyNatural: boolean
  accidentalMode: 'sharp' | 'flat' | 'mixed'

  // 方法
  initGame: () => void
  checkAnswer: (stringIdx: number, fretIdx: number) => void
  revealAllAnswers: () => void
  nextQuestion: () => void
  toggleString: (stringIdx: number) => void
  resetGame: () => void
  incrementTimer: (delta: number) => void
  setOnlyNatural: (val: boolean) => void
  setAccidentalMode: (mode: 'sharp' | 'flat' | 'mixed') => void
}

export const useGameStore = create<GameState>((set, get) => {

  // 🎲 内部辅助：根据特训规则，生成下一个合法的随机音符
  const drawValidNote = (onlyNatural: boolean, mode: 'sharp' | 'flat' | 'mixed'): NoteName => {
    const naturalPool: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const sharpPool: NoteName[] = ['C#', 'D#', 'F#', 'G#', 'A#']
    const flatPool: NoteName[] = ['Db', 'Eb', 'Gb', 'Ab', 'Bb']

    if (onlyNatural) {
      return naturalPool[Math.floor(Math.random() * naturalPool.length)]
    }

    if (mode === 'sharp') {
      const fullSharp = [...naturalPool, ...sharpPool]
      return fullSharp[Math.floor(Math.random() * fullSharp.length)]
    } else if (mode === 'flat') {
      const fullFlat = [...naturalPool, ...flatPool]
      return fullFlat[Math.floor(Math.random() * fullFlat.length)]
    } else {
      const fullMixed = [...naturalPool, ...sharpPool, ...flatPool]
      return fullMixed[Math.floor(Math.random() * fullMixed.length)]
    }
  }

  // 🎯 内部辅助：计算当前音符在指板（激活的琴弦）上所有正确的品位
  const getNoteTargets = (note: NoteName, strings: number[]) => {
    const targets: { stringIdx: number; fretIdx: number }[] = []

    strings.forEach((stringIdx) => {
      // 0 到 11 品进行循环扫描
      for (let fretIdx = 0; fretIdx <= 11; fretIdx++) {
        const boardNote = getNoteByPosition(stringIdx, fretIdx)

        // 核心异名同音兼容比对：
        // 或者是完全名字相等，或者是能在音理异名表上完美对上（比如题目叫 Bb，指板上解析出 A#）
        if (boardNote === note || ACCIDENTAL_MAPPING[boardNote] === note) {
          targets.push({ stringIdx, fretIdx })
        }
      }
    })
    return targets
  }

  return {
    currentNote: 'C',
    activeStrings: [0, 1, 2, 3, 4, 5],
    correctPositions: [],
    totalTargetCount: 0,
    showAnswerMode: false,
    gameStage: 'playing',
    timerMs: 0,
    isTimerRunning: false,
    totalPassed: 0,
    totalTimeSpentMs: 0,
    lastClickedFeedback: { stringIdx: 0, fretIdx: 0, status: 'none' },
    onlyNatural: false,
    accidentalMode: 'mixed',

    initGame: () => {
      const { onlyNatural, accidentalMode, activeStrings } = get()
      const note = drawValidNote(onlyNatural, accidentalMode)
      const targets = getNoteTargets(note, activeStrings)

      set({
        currentNote: note,
        correctPositions: [],
        totalTargetCount: targets.length,
        showAnswerMode: false,
        gameStage: 'playing',
        timerMs: 0,
        isTimerRunning: true,
        lastClickedFeedback: { stringIdx: 0, fretIdx: 0, status: 'none' }
      })
    },

    checkAnswer: (stringIdx, fretIdx) => {
      const { currentNote, correctPositions, totalTargetCount, isTimerRunning, timerMs } = get()
      if (!isTimerRunning) return

      // 获取当前按下的格子的物理基本音名（通常是升号形式，如 A#）
      const boardNote = getNoteByPosition(stringIdx, fretIdx)

      // 🛠️ 严格乐理判定：如果题目是 "A#"，点 "A#" 格子算对。
      // 如果题目是 "Bb"（它在映射表中对应 "A#"），但由于你的题目明确要求是 Bb，
      // 如果在这里直接点下，物理音对上了。但题目显示必须严格遵循。
      const isCorrectPhysicalNote = (boardNote === currentNote || ACCIDENTAL_MAPPING[boardNote] === currentNote)

      if (isCorrectPhysicalNote) {
        const alreadyFound = correctPositions.some(p => p.stringIdx === stringIdx && p.fretIdx === fretIdx)
        if (alreadyFound) return

        const newCorrects = [...correctPositions, { stringIdx, fretIdx }]
        const isClear = newCorrects.length === totalTargetCount

        set({
          correctPositions: newCorrects,
          lastClickedFeedback: { stringIdx, fretIdx, status: 'correct' },
          gameStage: isClear ? 'completed' : 'playing',
          isTimerRunning: !isClear,
          totalPassed: isClear ? get().totalPassed + 1 : get().totalPassed,
          totalTimeSpentMs: isClear ? get().totalTimeSpentMs + timerMs : get().totalTimeSpentMs
        })
      } else {
        set({
          lastClickedFeedback: { stringIdx, fretIdx, status: 'wrong' }
        })
      }
    },

    revealAllAnswers: () => {
      const { currentNote, activeStrings } = get()
      const allTargets = getNoteTargets(currentNote, activeStrings)
      set({
        correctPositions: allTargets,
        showAnswerMode: true,
        gameStage: 'completed',
        isTimerRunning: false
      })
    },

    nextQuestion: () => {
      const { onlyNatural, accidentalMode, activeStrings } = get()
      const note = drawValidNote(onlyNatural, accidentalMode)
      const targets = getNoteTargets(note, activeStrings)

      set({
        currentNote: note,
        correctPositions: [],
        totalTargetCount: targets.length,
        showAnswerMode: false,
        gameStage: 'playing',
        timerMs: 0,
        isTimerRunning: true,
        lastClickedFeedback: { stringIdx: 0, fretIdx: 0, status: 'none' }
      })
    },

    toggleString: (stringIdx) => {
      const { activeStrings } = get()
      let newStrings = [...activeStrings]
      if (newStrings.includes(stringIdx)) {
        if (newStrings.length > 1) {
          newStrings = newStrings.filter(s => s !== stringIdx)
        }
      } else {
        newStrings.push(stringIdx)
      }
      set({ activeStrings: newStrings })
      get().nextQuestion()
    },

    resetGame: () => {
      set({ totalPassed: 0, totalTimeSpentMs: 0 })
      get().nextQuestion()
    },

    incrementTimer: (delta) => {
      if (get().isTimerRunning) {
        set((state) => ({ timerMs: state.timerMs + delta }))
      }
    },

    setOnlyNatural: (val) => {
      set({ onlyNatural: val })
      get().nextQuestion()
    },

    setAccidentalMode: (mode) => {
      set({ accidentalMode: mode })
      get().nextQuestion()
    }
  }
})