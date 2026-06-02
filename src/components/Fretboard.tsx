import React, { useEffect, useState } from 'react'
import { getNoteByPosition } from '../utils/guitarLogic'
import { useGameStore } from '../store/useGameStore'

const formatTime = (totalMs: number) => {
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const ms = totalMs % 1000

  const pad = (num: number, size: number = 2) =>
    num.toString().padStart(size, '0')
  return `${pad(minutes)}:${pad(seconds)}.${pad(ms, 3)}`
}

export const Fretboard: React.FC = () => {
  const {
    correctPositions,
    lastClickedFeedback,
    showAnswerMode,
    activeStrings,
    timerMs,
    isTimerRunning,
    totalPassed,
    totalTimeSpentMs,
    gameStage,
    incrementTimer,
    checkAnswer,
    revealAllAnswers,
    nextQuestion,
    toggleString,
    resetGame,
  } = useGameStore()

  const IMAGE_FRETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const [errorTrigger, setErrorTrigger] = useState<{ s?: number; f?: number }>(
    {},
  )

  useEffect(() => {
    let lastTime = performance.now()
    let frameId: number

    const runTimer = () => {
      if (isTimerRunning) {
        const now = performance.now()
        const delta = now - lastTime
        incrementTimer(Math.round(delta))
        lastTime = now
        frameId = requestAnimationFrame(runTimer)
      }
    }

    if (isTimerRunning) {
      lastTime = performance.now()
      frameId = requestAnimationFrame(runTimer)
    }

    return () => cancelAnimationFrame(frameId)
  }, [isTimerRunning, incrementTimer])

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

  const averageTimeMs =
    totalPassed > 0 ? Math.round(totalTimeSpentMs / totalPassed) : 0
  const isCompleted = gameStage === 'completed'

  return (
    <div className="w-full overflow-x-auto py-6 px-4 scrollbar-thin">
      {/* ==================================================================== */}
      {/* 📊 速度成绩看板（右侧：双按钮物理常驻，根据通关状态切换禁用/高亮） */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-4 gap-4 max-w-5xl mx-auto mb-6 bg-zinc-950 p-4 border border-zinc-800 rounded-2xl shadow-inner text-center items-center">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">
            当前计时
          </div>
          <div className="text-xl font-mono font-black text-indigo-400 tabular-nums">
            {formatTime(timerMs)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">
            已过关任务
          </div>
          <div className="text-xl font-mono font-black text-emerald-400">
            {totalPassed}{' '}
            <span className="text-xs font-normal text-zinc-600">题</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">
            平均反应速度
          </div>
          <div className="text-xl font-mono font-black text-cyan-400 tabular-nums">
            {totalPassed > 0 ? formatTime(averageTimeMs) : '--:--.---'}
          </div>
        </div>

        {/* 控制枢纽：按钮位置绝对静止，体验极佳 */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={resetGame}
            className="px-2.5 py-1.5 text-xs font-bold text-zinc-500 border border-zinc-800 bg-zinc-900/50 rounded-xl hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-950 transition-all active:scale-95 whitespace-nowrap"
          >
            🔄 清零
          </button>

          {/* 🛠️ 改进：常驻按钮。未通关时为 disabled 灰色，通关后瞬间解封爆灯 */}
          <button
            onClick={nextQuestion}
            disabled={!isCompleted}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-md
              ${
                isCompleted
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/20 animate-pulse'
                  : 'bg-zinc-900 border border-zinc-800/80 text-zinc-600 opacity-40 cursor-not-allowed shadow-none'
              }
            `}
          >
            挑战下一音符 →
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 进度雷达与作弊工具栏（🛠️ 改进：任务完成时，按钮区直接整体隐形） */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-4 px-2 h-8">
        <div className="text-xs font-semibold text-zinc-400">
          目标搜索进度：已找到{' '}
          <span className="text-emerald-400 font-bold text-sm">
            {correctPositions.length}
          </span>{' '}
          / {useGameStore.getState().totalTargetCount} 个
        </div>

        {/* 只要任务没完成，显示辅助工具；完成了则干净隐藏，拒绝干扰 */}
        {!isCompleted ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <button
              onClick={revealAllAnswers}
              disabled={showAnswerMode}
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
        ) : (
          <div className="text-xs font-bold text-emerald-400/80 tracking-wide animate-fade-in">
            🎯 STAGE CLEAR
          </div>
        )}
      </div>

      {/* 整体大容器（指板主体保持不变） */}
      <div className="flex items-stretch justify-center min-w-[950px] max-w-5xl mx-auto select-none">
        {/* 左侧：0 品 */}
        <div className="flex flex-col justify-between pt-[2.5%] pb-[2.5%] w-12 bg-zinc-900 border-y border-l border-zinc-700 rounded-l-xl shadow-lg mr-1 p-1 gap-y-1">
          {[...Array(6)].map((_, stringIdx) => {
            const noteName = getNoteByPosition(stringIdx, 0)
            const isFound = correctPositions.some(
              (p) => p.stringIdx === stringIdx && p.fretIdx === 0,
            )
            const isWrong = errorTrigger.s === stringIdx && errorTrigger.f === 0
            const isStringActive = activeStrings.includes(stringIdx)

            return (
              <button
                key={stringIdx}
                disabled={showAnswerMode || !isStringActive}
                onClick={() => checkAnswer(stringIdx, 0)}
                className={`h-8 w-full flex items-center justify-center relative rounded-md transition-all text-xs font-semibold
                  ${isStringActive ? 'hover:bg-amber-600/10 text-amber-500' : 'opacity-10 cursor-not-allowed text-zinc-600'}
                `}
                title={`${stringIdx + 1}弦 - 空弦`}
              >
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
                  {isStringActive ? '0品' : '✕'}
                </span>
              </button>
            )
          })}
        </div>

        {/* 中间：指板网格 */}
        <div className="relative flex-1 bg-[url('/fretboard.png')] bg-contain bg-no-repeat bg-center aspect-[866/335] border-y border-zinc-700">
          <div className="absolute inset-x-0 top-0 bottom-0 pl-[1.1%] pr-[0.4%] pt-[2.5%] pb-[2.5%] flex flex-col justify-between">
            {[...Array(6)].map((_, stringIdx) => {
              const isStringActive = activeStrings.includes(stringIdx)

              return (
                <div
                  key={stringIdx}
                  className={`flex items-center h-[12%] w-full justify-between transition-opacity duration-200 ${!isStringActive ? 'opacity-15 pointer-events-none' : ''}`}
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
                          className="h-full flex-1 bg-transparent"
                        />
                      )
                    }

                    return (
                      <button
                        key={fretIdx}
                        disabled={showAnswerMode}
                        onClick={() => checkAnswer(stringIdx, fretIdx)}
                        className="h-full flex-1 flex items-center justify-center relative z-10 group"
                        title={`${stringIdx + 1}弦 - ${fretIdx}品`}
                      >
                        {!showAnswerMode && (
                          <div className="absolute w-[82%] h-[82%] rounded-md border border-transparent group-hover:bg-zinc-500/10 group-hover:border-indigo-500/20 transition-all pointer-events-none" />
                        )}

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
              )
            })}
          </div>
        </div>

        {/* 右侧：Checkbox 开关 */}
        <div className="flex flex-col justify-between pt-[2.5%] pb-[2.5%] w-12 bg-zinc-900 border-y border-r border-zinc-700 rounded-r-xl shadow-lg ml-1 p-1 gap-y-1 items-center">
          {[...Array(6)].map((_, stringIdx) => {
            const isChecked = activeStrings.includes(stringIdx)
            const isDisableCheckbox = isChecked && activeStrings.length === 1

            return (
              <label
                key={stringIdx}
                className={`h-8 w-full flex items-center justify-center relative cursor-pointer rounded-md transition-colors select-none
                  ${isChecked ? 'hover:bg-indigo-500/10 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-600'}
                  ${isDisableCheckbox ? 'cursor-not-allowed opacity-40' : ''}
                `}
                title={`开启/关闭 第 ${stringIdx + 1} 弦训练`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisableCheckbox}
                  onChange={() => toggleString(stringIdx)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed transition-all"
                />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
