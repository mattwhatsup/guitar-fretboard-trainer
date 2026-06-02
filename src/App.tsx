import { Fretboard } from './components/Fretboard'
import { useGameStore } from './store/useGameStore' // 如果你上一步文件夹叫 store

export default function App() {
  const { currentNote, score, totalAttempts, nextQuestion, resetGame } =
    useGameStore()

  // 计算正确率
  const accuracy =
    totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0

  const { gameStage } = useGameStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-between p-6 antialiased">
      {/* 顶部：标题栏与现代化计分板 */}
      <header className="w-full max-w-4xl text-center my-4">
        <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent mb-6">
          Fretboard Master / 吉他指板记忆训练
        </h1>
      </header>

      {/* 中部：核心游戏交互区 */}
      <main className="w-full max-w-5xl flex flex-col items-center my-auto gap-8">
        {/* 当前题目提示 */}
        <div className="text-center animate-fade-in">
          <p className="text-sm text-zinc-400 mb-1">
            请在指板上找出所有的音符：
          </p>
          <div className="text-7xl font-black text-white tracking-wide bg-zinc-900 border border-zinc-800 w-24 h-24 flex items-center justify-center rounded-2xl mx-auto shadow-inner">
            {currentNote}
          </div>
        </div>

        {/* 吉他指板组件 */}
        <Fretboard />

        {/* 底部纯文本通知广播站 */}
        <div className="h-16 flex items-center justify-center w-full select-none">
          {gameStage === 'completed' ? (
            <div className="text-center animate-slide-up">
              <p className="text-sm font-semibold text-zinc-300">
                {useGameStore.getState().showAnswerMode
                  ? `💡 已渲染全套答案，请移动视线至上方成绩栏开启新挑战。`
                  : `🎉 找齐全部目标！本次盲操精确定格在：${(useGameStore.getState().timerMs / 1000).toFixed(3)} 秒！`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              ⚡ 速度流计时赛进行中... 请立即点按全指板中所有的 “{currentNote}”
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
