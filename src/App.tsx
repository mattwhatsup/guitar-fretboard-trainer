import { ModeSelector } from './components/ModeSelector'
import { NoteDisplay } from './components/NoteDisplay'
import { Fretboard } from './components/Fretboard'

function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 selection:bg-indigo-500/30">
      {/* 👑 顶部页头区域：应用名、版本号 与 模式选择一体化 */}
      <header className="w-full max-w-5xl mx-auto border-b border-zinc-900 pb-4 mb-2 flex flex-col items-center gap-3">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            FRETBOARD MASTER
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-widest text-zinc-600 mt-0.5">
            VERSION 1.2.0
          </p>
        </div>

        {/* 🎛️ 顶级控制：放置在页头正下方 */}
        <ModeSelector />
      </header>

      {/* 🎮 主操作区 */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto gap-2 md:gap-4">
        {/* 题目大字（已完美水平居中，自由模式下自动隐身） */}
        <NoteDisplay />

        {/* 吉他指板主网格（内部计分板在自由模式下自动隐身） */}
        <Fretboard />
      </main>

      {/* ☕ 页脚 */}
      <footer className="w-full max-w-5xl mx-auto text-center text-[10px] text-zinc-700 pt-4 border-t border-zinc-950">
        🎸 吉他指板记忆特训器 · 2026
      </footer>
    </div>
  )
}

export default App
