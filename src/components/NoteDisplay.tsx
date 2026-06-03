import { useGameStore } from '../store/useGameStore'

export const NoteDisplay = () => {
  // ⚙️ 接入 gameMode 模式状态
  const {
    currentNote,
    onlyNatural,
    accidentalMode,
    setOnlyNatural,
    setAccidentalMode,
    gameMode,
    isTimerRunning,
  } = useGameStore()

  // 🛠️ 核心改进：如果是自由演奏模式，出题面板原地隐身，不干扰视线
  if (gameMode === 'free') return null

  return (
    // 🛠️ 关键修正：加入 mx-auto 确保卡片本身在 max-w-2xl 限制下在整个页面绝对居中
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 mb-4 select-none w-full max-w-2xl mx-auto bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-2xl shadow-inner">
      {/* 🎯 左侧：题目与超大亮眼音名 */}

      <div className="flex items-center gap-3 justify-center w-full sm:w-auto">
        <span className="text-zinc-400 text-xs md:text-sm font-bold tracking-wider uppercase">
          查找目标：
        </span>
        {/* 💡 放大并突出了音名，增加了呼吸感的阴影，让它像一个真正的关卡卡片 */}
        <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-zinc-200 to-zinc-400 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] font-mono tracking-tighter bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
          {currentNote && isTimerRunning ? currentNote : 'N/A'}
        </div>
      </div>

      {/* 🛠️ 右侧：高级特训控制枢纽 */}
      <div className="flex items-center justify-center gap-4 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-800/80 pt-3 sm:pt-0 pl-0 sm:pl-4">
        {/* 开关：只限自然音符 */}
        <label className="flex items-center gap-2 cursor-pointer group text-xs text-zinc-400 font-semibold whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyNatural}
            onChange={(e) => setOnlyNatural(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 cursor-pointer transition-all focus:outline-none"
          />
          <span className="group-hover:text-zinc-200 transition-colors">
            只限自然音符
          </span>
        </label>

        {/* 下拉框：升降号样式选择 */}
        {!onlyNatural && (
          <div className="animate-fadeIn flex items-center">
            <select
              value={accidentalMode}
              onChange={(e) =>
                setAccidentalMode(e.target.value as 'sharp' | 'flat' | 'mixed')
              }
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-0 focus:border-zinc-700 cursor-pointer hover:text-zinc-200 transition-colors"
            >
              <option value="mixed">升降号混用</option>
              <option value="sharp">📢 只看升号 (#)</option>
              <option value="flat">📢 只看降号 (b)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
