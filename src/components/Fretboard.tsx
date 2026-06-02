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

  // ⏱️ 毫秒高频时钟脉搏
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

  // ❌ 错误红圈闪烁反馈
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

  // ====================================================================
  // ⌨️ 键盘【空格】与【回车】快捷键监听（无痕去焦点改进版）
  // ====================================================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameStage === 'completed') {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()

          // 🛠️ 核心微调：让当前页面上可能意外获得焦点的任意元素主动失焦（Blur）
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }

          nextQuestion()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStage, nextQuestion])

  const averageTimeMs =
    totalPassed > 0 ? Math.round(totalTimeSpentMs / totalPassed) : 0
  const isCompleted = gameStage === 'completed'

  return (
    <div className="w-full overflow-x-auto py-4 md:py-8 px-2 scrollbar-thin scroll-smooth select-none">
      <div className="min-w-[920px] max-w-5xl mx-auto space-y-4">
        {/* 📊 速度成绩看板 */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner text-center items-center">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">
              当前计时
            </div>
            <div className="text-sm md:text-xl font-mono font-black text-indigo-400 tabular-nums">
              {formatTime(timerMs)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">
              已过关任务
            </div>
            <div className="text-sm md:text-xl font-mono font-black text-emerald-400">
              {totalPassed}{' '}
              <span className="text-xs font-normal text-zinc-600">题</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">
              平均反应速度
            </div>
            <div className="text-sm md:text-xl font-mono font-black text-cyan-400 tabular-nums">
              {totalPassed > 0 ? formatTime(averageTimeMs) : '--:--.---'}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {/* 🛠️ 增加了 focus:outline-none 彻底扼杀点击外轮廓框 */}
            <button
              onClick={(e) => {
                resetGame()
                e.currentTarget.blur()
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-zinc-500 border border-zinc-800 bg-zinc-900/50 rounded-xl hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-950 transition-all active:scale-95 whitespace-nowrap focus:outline-none focus:ring-0"
            >
              🔄 清零
            </button>
            <button
              onClick={(e) => {
                nextQuestion()
                e.currentTarget.blur()
              }}
              disabled={!isCompleted}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-md focus:outline-none focus:ring-0
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

        {/* 进度控制状态栏 */}
        <div className="flex items-center justify-between px-2 h-8">
          <div className="text-xs font-semibold text-zinc-400">
            目标搜索进度：已找到{' '}
            <span className="text-emerald-400 font-bold text-sm">
              {correctPositions.length}
            </span>{' '}
            / {useGameStore.getState().totalTargetCount} 个
          </div>
          {!isCompleted ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  revealAllAnswers()
                  e.currentTarget.blur()
                }}
                disabled={showAnswerMode}
                className="px-3 py-1 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none"
              >
                💡 正确答案
              </button>
              <button
                onClick={(e) => {
                  nextQuestion()
                  e.currentTarget.blur()
                }}
                className="px-3 py-1 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-indigo-400 transition-all shadow-sm focus:outline-none"
              >
                ⏭️ 跳过
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-emerald-400/80 tracking-wide animate-fade-in flex items-center gap-2">
              🎯 STAGE CLEAR{' '}
              <span className="text-[10px] text-zinc-500 font-normal">
                ( ⌨️ 按下 <b>Space</b> 或 <b>Enter</b> 刷入下一题 )
              </span>
            </div>
          )}
        </div>

        {/* 🎸 等比例指板主体结构 */}
        <div className="flex items-stretch justify-center select-none w-full">
          {/* 左侧：0 品 */}
          <div className="flex flex-col justify-between pt-[2.5%] pb-[2.5%] w-12 bg-zinc-900 border-y border-l border-zinc-700 rounded-l-xl shadow-lg mr-1 p-1 gap-y-1">
            {[...Array(6)].map((_, stringIdx) => {
              const noteName = getNoteByPosition(stringIdx, 0)
              const isFound = correctPositions.some(
                (p) => p.stringIdx === stringIdx && p.fretIdx === 0,
              )
              const isWrong =
                errorTrigger.s === stringIdx && errorTrigger.f === 0
              const isStringActive = activeStrings.includes(stringIdx)

              return (
                <button
                  key={stringIdx}
                  disabled={showAnswerMode || !isStringActive}
                  onClick={(e) => {
                    checkAnswer(stringIdx, 0)
                    e.currentTarget.blur()
                  }}
                  className={`h-8 w-full flex items-center justify-center relative rounded-md transition-all text-xs font-semibold focus:outline-none focus:ring-0
                    ${isStringActive ? 'hover:bg-amber-600/10 text-amber-500' : 'opacity-10 cursor-not-allowed text-zinc-600'}
                  `}
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

          {/* 中间：1-12 品原图覆盖网格 */}
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
                        (p) =>
                          p.stringIdx === stringIdx && p.fretIdx === fretIdx,
                      )
                      const isWrong =
                        errorTrigger.s === stringIdx &&
                        errorTrigger.f === fretIdx

                      if (fretIdx === 12) {
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
                          onClick={(e) => {
                            checkAnswer(stringIdx, fretIdx)
                            e.currentTarget.blur()
                          }}
                          className="h-full flex-1 flex items-center justify-center relative z-10 group focus:outline-none focus:ring-0"
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

          {/* 右侧：复选开关 */}
          <div className="flex flex-col justify-between pt-[2.5%] pb-[2.5%] w-12 bg-zinc-900 border-y border-r border-zinc-700 rounded-r-xl shadow-lg ml-1 p-1 gap-y-1 items-center">
            {[...Array(6)].map((_, stringIdx) => {
              const isChecked = activeStrings.includes(stringIdx)
              const isDisableCheckbox = isChecked && activeStrings.length === 1

              return (
                <label
                  key={stringIdx}
                  className={`h-8 w-full flex items-center justify-center relative cursor-pointer rounded-md transition-colors select-none ${isChecked ? 'hover:bg-indigo-500/10 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-600'} ${isDisableCheckbox ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisableCheckbox}
                    onChange={() => toggleString(stringIdx)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed transition-all focus:outline-none"
                  />
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
