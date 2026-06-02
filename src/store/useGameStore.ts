import { create } from 'zustand';
import { getRandomNote, getNoteByPosition } from '../utils/guitarLogic';

interface ClickedPosition {
  stringIdx: number;
  fretIdx: number;
}

interface GameState {
  currentNote: string;
  correctPositions: ClickedPosition[];
  totalTargetCount: number;
  gameStage: 'playing' | 'completed';
  showAnswerMode: boolean;
  activeStrings: number[];

  // ⏱️ 速度特训赛状态：升级为毫秒级
  timerMs: number;                    // 当前题目已用毫秒数
  isTimerRunning: boolean;            // 计时器是否在跑
  totalPassed: number;                // 凭实力通关的总次数
  totalTimeSpentMs: number;           // 通关题目的累计总用时（毫秒）

  lastClickedFeedback: {
    status: 'correct' | 'wrong' | 'idle';
    stringIdx?: number;
    fretIdx?: number;
  };

  incrementTimer: (ms: number) => void; // 🛠️ 递增毫秒数
  checkAnswer: (stringIdx: number, fretIdx: number) => void;
  revealAllAnswers: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
  toggleString: (stringIdx: number) => void;
}

const countTargetNoteInActiveStrings = (note: string, activeStrings: number[]): number => {
  let count = 0;
  activeStrings.forEach((s) => {
    for (let f = 0; f <= 11; f++) {
      if (getNoteByPosition(s, f) === note) {
        count++;
      }
    }
  });
  return count;
};

export const useGameStore = create<GameState>((set) => {
  const defaultStrings = [0, 1, 2, 3, 4, 5];
  const initialNote = getRandomNote();
  const initialCount = countTargetNoteInActiveStrings(initialNote, defaultStrings);

  return {
    currentNote: initialNote,
    correctPositions: [],
    totalTargetCount: initialCount,
    gameStage: 'playing',
    showAnswerMode: false,
    activeStrings: defaultStrings,
    lastClickedFeedback: { status: 'idle' },

    timerMs: 0,
    isTimerRunning: true,
    totalPassed: 0,
    totalTimeSpentMs: 0,

    // 高频累加时间
    incrementTimer: (ms) => set((state) => {
      if (!state.isTimerRunning) return {};
      return { timerMs: state.timerMs + ms };
    }),

    checkAnswer: (stringIdx, fretIdx) => set((state) => {
      if (
        !state.activeStrings.includes(stringIdx) ||
        state.gameStage === 'completed' ||
        state.showAnswerMode ||
        fretIdx > 11
      ) return {};

      const clickedNote = getNoteByPosition(stringIdx, fretIdx);
      const isCorrectNote = clickedNote === state.currentNote;

      const isAlreadyFound = state.correctPositions.some(
        (p) => p.stringIdx === stringIdx && p.fretIdx === fretIdx
      );

      if (isCorrectNote) {
        const newPositions = isAlreadyFound
          ? state.correctPositions
          : [...state.correctPositions, { stringIdx, fretIdx }];

        const isAllCompleted = newPositions.length === state.totalTargetCount;

        return {
          correctPositions: newPositions,
          gameStage: isAllCompleted ? 'completed' : 'playing',
          // 毫秒级锁定定格
          isTimerRunning: !isAllCompleted,
          totalPassed: isAllCompleted ? state.totalPassed + 1 : state.totalPassed,
          totalTimeSpentMs: isAllCompleted ? state.totalTimeSpentMs + state.timerMs : state.totalTimeSpentMs,

          lastClickedFeedback: { status: 'correct', stringIdx, fretIdx }
        };
      } else {
        return {
          lastClickedFeedback: { status: 'wrong', stringIdx, fretIdx }
        };
      }
    }),

    revealAllAnswers: () => set((state) => {
      if (state.gameStage === 'completed') return {};

      const allAnswers: ClickedPosition[] = [];
      state.activeStrings.forEach((s) => {
        for (let f = 0; f <= 11; f++) {
          if (getNoteByPosition(s, f) === state.currentNote) {
            allAnswers.push({ stringIdx: s, fretIdx: f });
          }
        }
      });

      return {
        correctPositions: allAnswers,
        showAnswerMode: true,
        gameStage: 'completed',
        isTimerRunning: false // 看答案直接中断当前计时，且不计入成绩
      };
    }),

    nextQuestion: () => set((state) => {
      const nextNote = getRandomNote();
      return {
        currentNote: nextNote,
        totalTargetCount: countTargetNoteInActiveStrings(nextNote, state.activeStrings),
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false,
        lastClickedFeedback: { status: 'idle' },
        timerMs: 0,
        isTimerRunning: true
      };
    }),

    resetGame: () => {
      const nextNote = getRandomNote();
      set({
        currentNote: nextNote,
        totalTargetCount: countTargetNoteInActiveStrings(nextNote, defaultStrings),
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false,
        activeStrings: defaultStrings,
        lastClickedFeedback: { status: 'idle' },
        timerMs: 0,
        isTimerRunning: true,
        totalPassed: 0,
        totalTimeSpentMs: 0
      });
    },

    toggleString: (stringIdx) => set((state) => {
      let newActiveStrings = [...state.activeStrings];
      if (newActiveStrings.includes(stringIdx)) {
        if (newActiveStrings.length === 1) return {};
        newActiveStrings = newActiveStrings.filter((s) => s !== stringIdx);
      } else {
        newActiveStrings.push(stringIdx);
      }

      return {
        activeStrings: newActiveStrings,
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false,
        totalTargetCount: countTargetNoteInActiveStrings(state.currentNote, newActiveStrings),
        lastClickedFeedback: { status: 'idle' },
        timerMs: 0,
        isTimerRunning: true
      };
    })
  };
});