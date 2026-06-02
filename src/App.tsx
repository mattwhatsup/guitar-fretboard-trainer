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

        {/* 玻璃拟态数据面板 */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 backdrop-blur-md shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              正确得分
            </p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{score}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              总尝试
            </p>
            <p className="text-2xl font-bold text-zinc-200 mt-1">
              {totalAttempts}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              正确率
            </p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              {accuracy}%
            </p>
          </div>
        </div>
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

        {/* 答题后的反馈与下一题按钮 */}
        <div className="h-16 flex items-center justify-center w-full">
          {gameStage === 'completed' ? (
            <div className="flex flex-col items-center gap-3 animate-slide-up">
              <p className="text-lg font-semibold text-emerald-400">
                🎉 太强了！你把全指板所有的 {currentNote} 音都找齐了！
              </p>
              <button
                onClick={nextQuestion}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 active:translate-y-0.5 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                挑战下一个音符 →
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              小提示：找出全指板（0-11品）中所有的“{currentNote}
              ”，漏掉一个都不能通关哦！
            </p>
          )}
        </div>
      </main>

      {/* 底部：辅助控制与重置 */}
      <footer className="w-full text-center pb-4">
        <button
          onClick={resetGame}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors"
        >
          重置所有统计数据
        </button>
      </footer>
    </div>
  )
}
