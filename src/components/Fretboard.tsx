import React, { useEffect, useState } from 'react'
import { getNoteByPosition } from '../utils/guitarLogic'
import { useGameStore } from '../store/useGameStore'

export const Fretboard: React.FC = () => {
  const {
    correctPositions,
    lastClickedFeedback,
    showAnswerMode,
    checkAnswer,
    revealAllAnswers,
    nextQuestion,
  } = useGameStore()

  const IMAGE_FRETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const [errorTrigger, setErrorTrigger] = useState<{ s?: number; f?: number }>(
    {},
  )

  useEffect(() => {
    if (lastClickedFeedback.status === 'wrong') {
      setErrorTrigger({
        s: lastClickedFeedback.stringIdx,
        f: lastClickedFeedback.fretIdx,
      })
      const timer = setTimeout(() => setErrorTrigger({}), 500)
      return () => clearTimeout(timer)
    }
  }, [lastClickedFeedback])

  return (
    <div className="w-full overflow-x-auto py-8 px-4 scrollbar-thin">
      {/* ==================================================================== */}
      {/* 🛠️ 顶部控制工具栏：进度 + 正确答案按钮 + 跳过按钮 */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-5 px-2">
        {/* 左侧：进度信息 */}
        <div className="text-sm font-medium text-zinc-400">
          进度：已找到{' '}
          <span className="text-emerald-400 font-bold text-base">
            {correctPositions.length}
          </span>{' '}
          个 / 共 {useGameStore.getState().totalTargetCount} 个
        </div>

        {/* 右侧：功能按钮组 */}
        <div className="flex items-center gap-2">
          <button
            onClick={revealAllAnswers}
            disabled={
              showAnswerMode ||
              useGameStore.getState().gameStage === 'completed'
            }
            className="px-3 py-1 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            💡 正确答案
          </button>
          <button
            onClick={nextQuestion}
            className="px-3 py-1 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-indigo-400 hover:border-indigo-900/50 hover:bg-indigo-950/20 transition-all shadow-sm"
          >
            ⏭️ 跳过
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 核心指板主容器 */}
      {/* ==================================================================== */}
      <div className="flex items-stretch justify-center min-w-[900px] max-w-5xl mx-auto select-none">
        {/* 左侧：0 品（空弦） */}
        <div className="flex flex-col justify-between pt-[2.5%] pb-[2.5%] w-12 bg-zinc-900 border-y border-l border-zinc-700 rounded-l-xl shadow-lg mr-1 p-1 gap-y-1">
          {[...Array(6)].map((_, stringIdx) => {
            const noteName = getNoteByPosition(stringIdx, 0)
            const isFound = correctPositions.some(
              (p) => p.stringIdx === stringIdx && p.fretIdx === 0,
            )
            const isWrong = errorTrigger.s === stringIdx && errorTrigger.f === 0

            return (
              <button
                key={stringIdx}
                disabled={showAnswerMode}
                onClick={() => checkAnswer(stringIdx, 0)}
                className="h-8 w-full flex items-center justify-center relative hover:bg-amber-600/10 rounded-md transition-colors text-xs font-semibold text-amber-500"
                title={`${stringIdx + 1}弦 - 空弦`}
              >
                {/* 答题反馈圆点：偷看答案模式下，如果是正确答案，会以带淡紫色的独特霓虹亮起 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-200 shadow-md absolute z-20
                  ${
                    isFound
                      ? showAnswerMode
                        ? 'bg-gradient-to-r from-indigo-400 to-cyan-500 text-zinc-950 scale-105 shadow-[0_0_15px_rgba(129,140,248,0.85)]'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.85)]'
                      : isWrong
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white scale-105 shadow-[0_0_15px_rgba(244,63,94,0.85)] animate-shake'
                        : 'scale-0'
                  }
                `}
                >
                  {isFound ? noteName : ''}
                </div>
                <span className={isFound ? 'opacity-0' : 'opacity-80'}>
                  0品
                </span>
              </button>
            )
          })}
        </div>

        {/* 右侧：1-12 品指板图片及覆盖网格 */}
        <div className="relative flex-1 bg-[url('/fretboard.png')] bg-contain bg-no-repeat bg-center aspect-[866/335] border-y border-r border-zinc-700 rounded-r-xl">
          <div className="absolute inset-x-0 top-0 bottom-0 pl-[1.1%] pr-[0.4%] pt-[2.5%] pb-[2.5%] flex flex-col justify-between">
            {[...Array(6)].map((_, stringIdx) => (
              <div
                key={stringIdx}
                className="flex items-center h-[12%] w-full justify-between"
              >
                {IMAGE_FRETS.map((fretIdx) => {
                  const noteName = getNoteByPosition(stringIdx, fretIdx)
                  const isFound = correctPositions.some(
                    (p) => p.stringIdx === stringIdx && p.fretIdx === fretIdx,
                  )
                  const isWrong =
                    errorTrigger.s === stringIdx && errorTrigger.f === fretIdx
                  const isFret12 = fretIdx === 12

                  if (isFret12) {
                    return (
                      <div
                        key={fretIdx}
                        className="h-full flex-1 pointer-events-none bg-transparent"
                      />
                    )
                  }

                  return (
                    <button
                      key={fretIdx}
                      disabled={showAnswerMode} // 查看答案时禁用点击
                      onClick={() => checkAnswer(stringIdx, fretIdx)}
                      className="h-full flex-1 flex items-center justify-center relative z-10 group"
                      title={`${stringIdx + 1}弦 - ${fretIdx}品`}
                    >
                      {/* 悬停视觉胶囊（查看答案模式下隐藏） */}
                      {!showAnswerMode && (
                        <div className="absolute w-[82%] h-[82%] rounded-md border border-transparent group-hover:bg-zinc-500/10 group-hover:border-indigo-500/20 transition-all pointer-events-none" />
                      )}

                      {/* 答题反馈圆点 */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-200 shadow-md absolute
                        ${
                          isFound
                            ? showAnswerMode
                              ? 'bg-gradient-to-r from-indigo-400 to-cyan-500 text-zinc-950 scale-110 shadow-[0_0_20px_rgba(129,140,248,0.85)]'
                              : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.85)]'
                            : isWrong
                              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white scale-110 shadow-[0_0_20px_rgba(244,63,94,0.85)] animate-shake'
                              : 'scale-0 hover:scale-75 bg-zinc-600/30 text-zinc-100 backdrop-blur-[2px]'
                        }
                      `}
                      >
                        {isFound ? noteName : ''}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
