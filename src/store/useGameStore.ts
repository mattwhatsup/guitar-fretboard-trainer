import { create } from 'zustand'
import { getNoteByPosition } from '../utils/guitarLogic'

// 🛠️ 确保这里有 export 关键字，彻底解决你遇到的编译错误
export type GameMode = 'training' | 'free'
export type InstrumentType = 'guitar' | 'ukulele'

interface GameState {
  instrument: InstrumentType
  gameMode: GameMode
  currentNote: string
  onlyNatural: boolean
  accidentalMode: 'sharp' | 'flat' | 'mixed'
  activeStrings: number[]
  correctPositions: Array<{ stringIdx: number; fretIdx: number }>
  lastClickedFeedback: { stringIdx: number; fretIdx: number; status: 'none' | 'correct' | 'wrong' }
  showAnswerMode: boolean
  timerMs: number
  isTimerRunning: boolean
  totalPassed: number
  totalTimeSpentMs: number
  gameStage: 'idle' | 'playing' | 'completed'
  totalTargetCount: number

  setInstrument: (inst: InstrumentType) => void
  setGameMode: (mode: GameMode) => void
  setOnlyNatural: (val: boolean) => void
  setAccidentalMode: (mode: 'sharp' | 'flat' | 'mixed') => void
  toggleString: (idx: number) => void
  checkAnswer: (stringIdx: number, fretIdx: number) => void
  revealAllAnswers: () => void
  nextQuestion: () => void
  resetGame: () => void
  incrementTimer: (ms: number) => void
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const getRandomNote = (onlyNatural: boolean, mode: 'sharp' | 'flat' | 'mixed') => {
  let list = [...ALL_NOTES]
  if (onlyNatural) {
    list = list.filter(n => !n.includes('#'))
  }
  const chosenRaw = list[Math.floor(Math.random() * list.length)]

  if (onlyNatural) return chosenRaw
  const idx = ALL_NOTES.indexOf(chosenRaw)
  if (mode === 'sharp') return SHARP_NOTES[idx]
  if (mode === 'flat') return FLAT_NOTES[idx]

  if (chosenRaw.includes('#') && Math.random() > 0.5) {
    return FLAT_NOTES[idx]
  }
  return chosenRaw
}

// 内部计算正确目标数的辅助函数
const calculateTargetCount = (note: string, activeStrings: number[], inst: InstrumentType) => {
  let count = 0
  const targetRaw = note.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#')

  activeStrings.forEach(sIdx => {
    for (let fIdx = 0; fIdx <= 11; fIdx++) {
      if (getNoteByPosition(inst, sIdx, fIdx) === targetRaw) {
        count++
      }
    }
  })
  return count
}

export const useGameStore = create<GameState>((set, get) => ({
  instrument: 'guitar',
  gameMode: 'training',
  currentNote: 'C',
  onlyNatural: false,
  accidentalMode: 'mixed',
  activeStrings: [0, 1, 2, 3, 4, 5],
  correctPositions: [],
  lastClickedFeedback: { stringIdx: -1, fretIdx: -1, status: 'none' },
  showAnswerMode: false,
  timerMs: 0,
  isTimerRunning: false,
  totalPassed: 0,
  totalTimeSpentMs: 0,
  gameStage: 'idle',
  totalTargetCount: 0,

  setInstrument: (inst) => {
    const defaultStrings = inst === 'guitar' ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3]
    set({
      instrument: inst,
      activeStrings: defaultStrings,
      correctPositions: [],
      gameStage: 'idle',
      timerMs: 0,
      isTimerRunning: false,
      lastClickedFeedback: { stringIdx: -1, fretIdx: -1, status: 'none' }
    })
    get().nextQuestion()
  },

  setGameMode: (mode) => {
    if (mode === 'free') {
      set({ gameMode: mode, isTimerRunning: false })
    } else {
      set({ gameMode: mode, gameStage: 'idle' })
      get().nextQuestion()
    }
  },

  setOnlyNatural: (val) => {
    set({ onlyNatural: val })
    get().nextQuestion()
  },

  setAccidentalMode: (mode) => {
    set({ accidentalMode: mode })
    get().nextQuestion()
  },

  toggleString: (idx) => {
    set((state) => {
      const active = state.activeStrings.includes(idx)
        ? state.activeStrings.filter(i => i !== idx)
        : [...state.activeStrings, idx]
      if (active.length === 0) return {}

      const newCount = calculateTargetCount(state.currentNote, active, state.instrument)
      const newCorrect = state.correctPositions.filter(p => active.includes(p.stringIdx))
      const isCleared = newCount > 0 && newCorrect.length === newCount

      return {
        activeStrings: active,
        totalTargetCount: newCount,
        correctPositions: newCorrect,
        gameStage: isCleared ? 'completed' : state.gameStage,
        isTimerRunning: isCleared ? false : state.isTimerRunning
      }
    })
  },

  checkAnswer: (stringIdx, fretIdx) => {
    const { gameMode, currentNote, instrument, correctPositions, totalTargetCount, isTimerRunning, timerMs } = get()
    if (gameMode === 'free') return

    const clickNote = getNoteByPosition(instrument, stringIdx, fretIdx)
    const targetRaw = currentNote.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#')

    if (clickNote === targetRaw) {
      const alreadyFound = correctPositions.some(p => p.stringIdx === stringIdx && p.fretIdx === fretIdx)
      if (alreadyFound) return

      const newCorrect = [...correctPositions, { stringIdx, fretIdx }]
      const isCleared = newCorrect.length === totalTargetCount

      set({
        correctPositions: newCorrect,
        lastClickedFeedback: { stringIdx, fretIdx, status: 'correct' },
        gameStage: isCleared ? 'completed' : 'playing',
        isTimerRunning: isCleared ? false : isTimerRunning,
        totalPassed: isCleared ? get().totalPassed + 1 : get().totalPassed,
        totalTimeSpentMs: isCleared ? get().totalTimeSpentMs + timerMs : get().totalTimeSpentMs
      })
    } else {
      set({ lastClickedFeedback: { stringIdx, fretIdx, status: 'wrong' } })
    }
  },

  revealAllAnswers: () => set({ showAnswerMode: true, isTimerRunning: false }),

  nextQuestion: () => {
    const { onlyNatural, accidentalMode, activeStrings, instrument, currentNote } = get()
    let nextNote = getRandomNote(onlyNatural, accidentalMode)
    while (nextNote === currentNote) {
      nextNote = getRandomNote(onlyNatural, accidentalMode)
    }
    const count = calculateTargetCount(nextNote, activeStrings, instrument)

    set({
      currentNote: nextNote,
      correctPositions: [],
      lastClickedFeedback: { stringIdx: -1, fretIdx: -1, status: 'none' },
      showAnswerMode: false,
      totalTargetCount: count,
      timerMs: 0,
      isTimerRunning: count > 0,
      gameStage: count > 0 ? 'playing' : 'completed'
    })
  },

  resetGame: () => set({ timerMs: 0, totalPassed: 0, totalTimeSpentMs: 0, correctPositions: [], gameStage: 'idle', isTimerRunning: false }),
  incrementTimer: (ms) => set((state) => ({ timerMs: state.timerMs + ms }))
}))