import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getNoteByPosition } from '../utils/guitarLogic'
import { playGuitarTone } from '../utils/audioEngine'

export type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B" | "Db" | "Eb" | "Gb" | "Ab" | "Bb";

const ACCIDENTAL_MAPPING: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

interface GameState {
  // ⚙️ 核心模式
  gameMode: 'training' | 'free' // 'training' 为训练模式，'free' 为自由演奏模式
  currentNote: NoteName
  activeStrings: number[]
  correctPositions: { stringIdx: number; fretIdx: number }[]
  totalTargetCount: number
  showAnswerMode: boolean
  gameStage: 'playing' | 'completed'

  // ⏱️ 训练模式统计（自由模式下不计入）
  timerMs: number
  isTimerRunning: boolean
  totalPassed: number
  totalTimeSpentMs: number
  lastClickedFeedback: { stringIdx: number; fretIdx: number; status: 'correct' | 'wrong' | 'none' }

  // ⚙️ 需要持久化的配置项
  onlyNatural: boolean
  accidentalMode: 'sharp' | 'flat' | 'mixed'

  // 🕹️ 控制流方法
  setGameMode: (mode: 'training' | 'free') => void
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

const drawValidNote = (onlyNatural: boolean, mode: 'sharp' | 'flat' | 'mixed'): NoteName => {
  const naturalPool: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const sharpPool: NoteName[] = ['C#', 'D#', 'F#', 'G#', 'A#']
  const flatPool: NoteName[] = ['Db', 'Eb', 'Gb', 'Ab', 'Bb']

  if (onlyNatural) return naturalPool[Math.floor(Math.random() * naturalPool.length)]
  if (mode === 'sharp') return [...naturalPool, ...sharpPool][Math.floor(Math.random() * (naturalPool.length + sharpPool.length))]
  if (mode === 'flat') return [...naturalPool, ...flatPool][Math.floor(Math.random() * (naturalPool.length + flatPool.length))]
  return [...naturalPool, ...sharpPool, ...flatPool][Math.floor(Math.random() * (naturalPool.length + sharpPool.length + flatPool.length))]
}

const getNoteTargets = (note: NoteName, strings: number[]) => {
  const targets: { stringIdx: number; fretIdx: number }[] = []
  strings.forEach((stringIdx) => {
    for (let fretIdx = 0; fretIdx <= 11; fretIdx++) {
      const boardNote = getNoteByPosition(stringIdx, fretIdx)
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
      gameMode: 'training', // 默认训练模式
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

      setGameMode: (mode) => {
        set({ gameMode: mode })
        if (mode === 'training') {
          get().nextQuestion() // 切换到训练模式时，刷出一张新题并启动计时
        } else {
          // 切换到自由模式，关闭时钟
          set({ isTimerRunning: false, gameStage: 'playing' })
        }
      },

      initGame: () => {
        const { onlyNatural, accidentalMode, activeStrings, gameMode } = get()
        const note = drawValidNote(onlyNatural, accidentalMode)
        const targets = getNoteTargets(note, activeStrings)

        set({
          currentNote: note,
          correctPositions: [],
          totalTargetCount: targets.length,
          showAnswerMode: false,
          gameStage: 'playing',
          timerMs: 0,
          isTimerRunning: gameMode === 'training', // 🛠️ 只有训练模式启动时钟
          lastClickedFeedback: { stringIdx: 0, fretIdx: 0, status: 'none' }
        })
      },

      checkAnswer: (stringIdx, fretIdx) => {
        const { currentNote, correctPositions, totalTargetCount, gameMode, isTimerRunning, timerMs } = get()

        // 🔊 无论什么模式，按键立刻发声
        playGuitarTone(stringIdx, fretIdx)

        // 🛠️ 核心改进：如果是自由模式，不参与对错判断，直接退出
        if (gameMode === 'free') return

        if (!isTimerRunning) return

        const boardNote = getNoteByPosition(stringIdx, fretIdx)
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
            isTimerRunning: !isClear, // 找全后停止计时，等待玩家手动下一题
            totalPassed: isClear ? get().totalPassed + 1 : get().totalPassed,
            totalTimeSpentMs: isClear ? get().totalTimeSpentMs + timerMs : get().totalTimeSpentMs
          })
        } else {
          set({ lastClickedFeedback: { stringIdx, fretIdx, status: 'wrong' } })
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
        const { onlyNatural, accidentalMode, activeStrings, gameMode } = get()
        const note = drawValidNote(onlyNatural, accidentalMode)
        const targets = getNoteTargets(note, activeStrings)

        set({
          currentNote: note,
          correctPositions: [],
          totalTargetCount: targets.length,
          showAnswerMode: false,
          gameStage: 'playing',
          timerMs: 0,
          isTimerRunning: gameMode === 'training', // 🛠️ 仅训练模式开启计时器
          lastClickedFeedback: { stringIdx: 0, fretIdx: 0, status: 'none' }
        })
      },

      toggleString: (stringIdx) => {
        const { activeStrings } = get()
        let newStrings = [...activeStrings]
        if (newStrings.includes(stringIdx)) {
          if (newStrings.length > 1) newStrings = newStrings.filter(s => s !== stringIdx)
        } else {
          newStrings.push(stringIdx)
        }
        set({ activeStrings: newStrings })

        // 🛠️ 核心改进：自由模式下切琴弦不需要强行刷出新题
        if (get().gameMode === 'training') {
          get().nextQuestion()
        }
      },

      resetGame: () => {
        set({ totalPassed: 0, totalTimeSpentMs: 0 })
        if (get().gameMode === 'training') get().nextQuestion()
      },

      incrementTimer: (delta) => {
        if (get().isTimerRunning && get().gameMode === 'training') {
          set((state) => ({ timerMs: state.timerMs + delta }))
        }
      },

      setOnlyNatural: (val) => {
        set({ onlyNatural: val })
        if (get().gameMode === 'training') get().nextQuestion()
      },

      setAccidentalMode: (mode) => {
        set({ accidentalMode: mode })
        if (get().gameMode === 'training') get().nextQuestion()
      }
    }),
    {
      name: 'fretboard-master-config',
      partialize: (state) => ({
        gameMode: state.gameMode, // 🔒 缓存模式状态
        activeStrings: state.activeStrings,
        onlyNatural: state.onlyNatural,
        accidentalMode: state.accidentalMode,
      }),
    }
  )
)