import { useEffect } from 'react'
import { Fretboard } from './components/Fretboard'
import { useGameStore } from './store/useGameStore'

function App() {
  const {
    currentNote,
    gameStage,
    onlyNatural,
    accidentalMode,
    initGame,
    setOnlyNatural,
    setAccidentalMode,
  } = useGameStore()

  // 页面首次装载，启动吉他引擎脉搏
  useEffect(() => {
    initGame()
  }, [initGame])

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col justify-between antialiased selection:bg-indigo-500/30">
      {/* 顶部极简导航 */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md px-6 py-4 select-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <h1 className="text-sm font-black tracking-wider uppercase text-zinc-300">
              Fretboard Master /{' '}
              <span className="text-indigo-400">指板盲操速度赛</span>
            </h1>
          </div>
          <div className="text-[11px] text-zinc-500 font-medium bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800/60">
            v1.4.0 • Realtime Timer
          </div>
        </div>
      </header>

      {/* 主操作核心区 */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 w-full">
        <div className="w-full max-w-5xl px-4 flex flex-col items-center">
          {/* ==================================================================== */}
          {/* 🎯 动态任务核心播报区（集成：自然音开关 + 升降倾向下拉组件） */}
          {/* ==================================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 mb-4 select-none w-full max-w-2xl bg-zinc-950/30 border border-zinc-800/40 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-sm md:text-base font-semibold">
                请在指板上找出所有的：
              </span>
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-100 to-zinc-400 drop-shadow-sm font-mono tracking-tighter">
                {currentNote}
              </div>
            </div>

            {/* 🛠️ 高级特训控制枢纽 */}
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 pl-0 sm:pl-4">
              {/* 开关：只限自然音符 */}
              <label className="flex items-center gap-2 cursor-pointer group text-xs text-zinc-400 font-medium">
                <input
                  type="checkbox"
                  checked={onlyNatural}
                  onChange={(e) => setOnlyNatural(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 cursor-pointer transition-all"
                />
                <span className="group-hover:text-zinc-200 transition-colors">
                  只限自然音符
                </span>
              </label>

              {/* 下拉框：升降号样式选择（仅在 unfiltered 时才浮现） */}
              {!onlyNatural && (
                <div className="animate-fade-in flex items-center">
                  <select
                    value={accidentalMode}
                    onChange={(e) =>
                      setAccidentalMode(
                        e.target.value as 'sharp' | 'flat' | 'mixed',
                      )
                    }
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-0 focus:border-zinc-700 cursor-pointer hover:text-zinc-200 transition-colors"
                  >
                    <option value="mixed">升降号混用</option>
                    <option value="sharp">📢 只用升号 (#)</option>
                    <option value="flat">📢 只用降号 (b)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 吉他实体高清长图指板面板 */}
          <Fretboard />
        </div>
      </main>

      {/* 底部通知广播站 */}
      <footer className="h-14 flex items-center justify-center w-full select-none border-t border-zinc-900 bg-zinc-950/20">
        {gameStage === 'completed' ? (
          <div className="text-center animate-slide-up">
            <p className="text-xs font-semibold text-zinc-400">
              {useGameStore.getState().showAnswerMode
                ? `💡 已渲染全套参考答案。敲击 [ 空格 / 回车 ] 或点击上方按钮刷入新任务。`
                : `🎉 搜寻大获全胜！精准用时：${(useGameStore.getState().timerMs / 1000).toFixed(3)} 秒！`}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 italic font-medium tracking-wide">
            ⚡ 速度盲练中...
            消除一切高亮焦点虚线框框，请直接利用鼠标或触屏点选正确音位。
          </p>
        )}
      </footer>
    </div>
  )
}

export default App
