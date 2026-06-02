import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

const formatTime = (totalMs: number) => {
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const ms = totalMs % 1000
  const pad = (num: number, size: number = 2) =>
    num.toString().padStart(size, '0')
  return `${pad(minutes)}:${pad(seconds)}.${pad(ms, 3)}`
}

export const ScoreBoard = () => {
  const {
    gameMode,
    timerMs,
    isTimerRunning,
    totalPassed,
    totalTimeSpentMs,
    gameStage,
    incrementTimer,
    nextQuestion,
    resetGame,
  } = useGameStore()

  // ⏱️ 计时器脉搏（心跳）内聚在看板组件内部
  useEffect(() => {
    let lastTime = performance.now()
    let frameId: number
    const runTimer = () => {
      if (isTimerRunning && gameMode === 'training') {
        const now = performance.now()
        const delta = now - lastTime
        incrementTimer(Math.round(delta))
        lastTime = now
        frameId = requestAnimationFrame(runTimer)
      }
    }
    if (isTimerRunning && gameMode === 'training') {
      lastTime = performance.now()
      frameId = requestAnimationFrame(runTimer)
    }
    return () => cancelAnimationFrame(frameId)
  }, [isTimerRunning, incrementTimer, gameMode])

  // ====================================================================
  // 🛠️ 核心改进：如果是自由演奏模式，数据面板直接隐身，不干扰演奏体验
  // ====================================================================
  if (gameMode === 'free') return null

  const averageTimeMs =
    totalPassed > 0 ? Math.round(totalTimeSpentMs / totalPassed) : 0
  const isCompleted = gameStage === 'completed'

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner text-center items-center animate-fadeIn">
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
        <button
          onClick={(e) => {
            resetGame()
            e.currentTarget.blur()
          }}
          className="px-2.5 py-1.5 text-xs font-bold text-zinc-500 border border-zinc-800 bg-zinc-900/50 rounded-xl hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-950 transition-all active:scale-95 whitespace-nowrap focus:outline-none"
        >
          🔄 清零
        </button>
        <button
          onClick={(e) => {
            nextQuestion()
            e.currentTarget.blur()
          }}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-md focus:outline-none
            ${
              isCompleted
                ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/20 animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
            }
          `}
        >
          挑战下一音符 →
        </button>
      </div>
    </div>
  )
}
