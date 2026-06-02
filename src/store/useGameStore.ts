import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getNoteByPosition } from '../utils/guitarLogic'
import { playGuitarTone } from '../utils/audioEngine'

// 1. 定义严谨的音名联合类型
export type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B" | "Db" | "Eb" | "Gb" | "Ab" | "Bb";

// 🎵 音符异名同音双向映射表，用于支持严格的“升降号倾向”比对与识别
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

  // ⏱️ 动态计时与反馈账本（这些属于临时状态，不需要且不应该持久化）
  timerMs: number
  isTimerRunning: boolean
  totalPassed: number
  totalTimeSpentMs: number
  lastClickedFeedback: { stringIdx: number; fretIdx: number; status: 'correct' | 'wrong' | 'none' }

  // ⚙️ 需要持久化的核心配置项
  onlyNatural: boolean
  accidentalMode: 'sharp' | 'flat' | 'mixed'

  // 🕹️ 核心控制流方法
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

// 🎲 内部辅助：根据高级特训规则，随机抽调下一个合法的音符任务
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

// 🎯 内部辅助：动态扫描当前被激活的琴弦，计算出目标音符在指板（0-11品）上所有的正确坐标
const getNoteTargets = (note: NoteName, strings: number[]) => {
  const targets: { stringIdx: number; fretIdx: number }[] = []
  strings.forEach((stringIdx) => {
    for (let fretIdx = 0; fretIdx <= 11; fretIdx++) {
      const boardNote = getNoteByPosition(stringIdx, fretIdx)
      // 兼容异名同音匹配逻辑：物理名一致，或者在乐理转化表中映射一致（例如题目叫 Bb，指板底层名返回 A#）
      if (boardNote === note || ACCIDENTAL_MAPPING[boardNote] === note) {
        targets.push({ stringIdx, fretIdx })
      }
    }
  })
  return targets
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
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
        // 自动拉取已经从 localStorage 加载回来的持久化配置
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

        // 1. 抓取当前按下的格子底层的物理音名（如 A#）
        const boardNote = getNoteByPosition(stringIdx, fretIdx)

        // 2. 🔊 无论对错，即时触发物理建模发生器，播放该品位准确弦高的吉他瞬态声音
        playGuitarTone(stringIdx, boardNote)

        // 3. 严格乐理判定：物理名字相等或异名同音相通
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
        get().nextQuestion() // 琴弦配置变动，立即洗牌冲刷出新题
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
    }),
    {
      name: 'fretboard-master-config', // 🔒 写入浏览器的缓存 Key
      // 🎯 精准白名单过滤器：只持久化这三项用户设置，避免秒表或临时成绩污染缓存空间
      partialize: (state) => ({
        activeStrings: state.activeStrings,
        onlyNatural: state.onlyNatural,
        accidentalMode: state.accidentalMode,
      }),
    }
  )
)