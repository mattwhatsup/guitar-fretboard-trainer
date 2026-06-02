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
  showAnswerMode: boolean;
  activeStrings: number[];            // 🛠️ 新增：当前参与训练的弦（0代表1弦，5代表6弦）
  lastClickedFeedback: {
    status: 'correct' | 'wrong' | 'idle';
    stringIdx?: number;
    fretIdx?: number;
  };

  checkAnswer: (stringIdx: number, fretIdx: number) => void;
  revealAllAnswers: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
  toggleString: (stringIdx: number) => void; // 🛠️ 新增：切换某条弦的选中状态
}

// 💡 辅助函数修改：计算音符总数时，只统计被勾选的琴弦 (activeStrings)
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
  // 默认 6 条弦全选 [0, 1, 2, 3, 4, 5]
  const defaultStrings = [0, 1, 2, 3, 4, 5];
  const initialNote = getRandomNote();
  const initialCount = countTargetNoteInActiveStrings(initialNote, defaultStrings);

  return {
    currentNote: initialNote,
    score: 0,
    totalAttempts: 0,
    correctPositions: [],
    totalTargetCount: initialCount,
    gameStage: 'playing',
    showAnswerMode: false,
    activeStrings: defaultStrings,
    lastClickedFeedback: { status: 'idle' },

    checkAnswer: (stringIdx, fretIdx) => set((state) => {
      // 如果点击了未勾选的弦、或者已经通关、或者看答案中、或者点击了12品，不响应
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
        gameStage: 'completed'
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
        lastClickedFeedback: { status: 'idle' }
      };
    }),

    resetGame: () => {
      const nextNote = getRandomNote();
      set({
        currentNote: nextNote,
        totalTargetCount: countTargetNoteInActiveStrings(nextNote, defaultStrings),
        score: 0,
        totalAttempts: 0,
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false,
        activeStrings: defaultStrings,
        lastClickedFeedback: { status: 'idle' }
      });
    },

    // 🛠️ 动作：切换琴弦勾选状态
    toggleString: (stringIdx) => set((state) => {
      let newActiveStrings = [...state.activeStrings];

      if (newActiveStrings.includes(stringIdx)) {
        // 如果最少要剩 1 条，则当数组长度为 1 时不让继续取消
        if (newActiveStrings.length === 1) return {};
        newActiveStrings = newActiveStrings.filter((s) => s !== stringIdx);
      } else {
        newActiveStrings.push(stringIdx);
      }

      // 切换琴弦后，因为当前的关卡目标数变了，直接根据新弦组刷新当前题目
      return {
        activeStrings: newActiveStrings,
        correctPositions: [],
        gameStage: 'playing',
        showAnswerMode: false,
        totalTargetCount: countTargetNoteInActiveStrings(state.currentNote, newActiveStrings),
        lastClickedFeedback: { status: 'idle' }
      };
    })
  };
});