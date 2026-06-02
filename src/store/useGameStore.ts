import { create } from 'zustand';
import { getRandomNote, getNoteByPosition } from '../utils/guitarLogic';

interface ClickedPosition {
  stringIdx: number;
  fretIdx: number;
}

interface GameState {
  currentNote: string;
  score: number;
  totalAttempts: number;
  correctPositions: ClickedPosition[];
  totalTargetCount: number;
  gameStage: 'playing' | 'completed';
  showAnswerMode: boolean;            // 🛠️ 新增：是否处于“显示答案”模式
  lastClickedFeedback: {
    status: 'correct' | 'wrong' | 'idle';
    stringIdx?: number;
    fretIdx?: number;
  };

  checkAnswer: (stringIdx: number, fretIdx: number) => void;
  revealAllAnswers: () => void;       // 🛠️ 新增：显示所有正确答案
  nextQuestion: () => void;
  resetGame: () => void;
}

const countTargetNoteInFretboard = (note: string): number => {
  let count = 0;
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 11; f++) {
      if (getNoteByPosition(s, f) === note) {
        count++;
      }
    }
  }
  return count;
};

export const useGameStore = create<GameState>((set) => {
  const initialNote = getRandomNote();
  const initialCount = countTargetNoteInFretboard(initialNote);

  return {
    currentNote: initialNote,
    score: 0,
    totalAttempts: 0,
    correctPositions: [],
    totalTargetCount: initialCount,
    gameStage: 'playing',
    showAnswerMode: false,            // 默认关闭
    lastClickedFeedback: { status: 'idle' },

    checkAnswer: (stringIdx, fretIdx) => set((state) => {
      // 游戏结束、查看答案中、或点击了 12 品，均不响应点击
      if (state.gameStage === 'completed' || state.showAnswerMode || fretIdx > 11) return {};

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
          score: isAllCompleted ? state.score + 1 : state.score,
          totalAttempts: isAllCompleted ? state.totalAttempts + 1 : state.totalAttempts,
          lastClickedFeedback: { status: 'correct', stringIdx, fretIdx }
        };
      } else {
        return {
          lastClickedFeedback: { status: 'wrong', stringIdx, fretIdx }
        };
      }
    }),

    // 🛠️ 动作：一键偷看答案
    revealAllAnswers: () => set((state) => {
      if (state.gameStage === 'completed') return {};

      // 找出 0-11 品里所有符合当前目标音的位置
      const allAnswers: ClickedPosition[] = [];
      for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 11; f++) {
          if (getNoteByPosition(s, f) === state.currentNote) {
            allAnswers.push({ stringIdx: s, fretIdx: f });
          }
        }
      }

      return {
        correctPositions: allAnswers,
        showAnswerMode: true,
        gameStage: 'completed' // 展现答案后直接进入“可进下一题”的通关阶段
      };
    }),

    nextQuestion: () => set((state) => {
      const nextNote = getRandomNote();
      return {
        currentNote: nextNote,
        totalTargetCount: countTargetNoteInFretboard(nextNote),
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false, // 重置答案模式
        lastClickedFeedback: { status: 'idle' }
      };
    }),

    resetGame: () => {
      const nextNote = getRandomNote();
      set({
        currentNote: nextNote,
        totalTargetCount: countTargetNoteInFretboard(nextNote),
        score: 0,
        totalAttempts: 0,
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false,
        lastClickedFeedback: { status: 'idle' }
      });
    }
  };
});