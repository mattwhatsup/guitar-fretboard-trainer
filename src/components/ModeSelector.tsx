import { useGameStore } from '../store/useGameStore'

export const ModeSelector = () => {
  const { gameMode, setGameMode, instrument, setInstrument } = useGameStore()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full py-2">
      {/* 乐器切换 Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-60 shadow-lg">
        <button
          onClick={() => setInstrument('guitar')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none
            ${instrument === 'guitar' ? 'bg-amber-600 text-white shadow shadow-amber-600/20' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          🎸 吉他 (6弦)
        </button>
        <button
          onClick={() => setInstrument('ukulele')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none
            ${instrument === 'ukulele' ? 'bg-amber-500 text-white shadow shadow-amber-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          🍍 尤克里里 (4弦)
        </button>
      </div>

      {/* 训练模式切换 Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-60 shadow-lg">
        <button
          onClick={() => setGameMode('training')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none
            ${gameMode === 'training' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          🎯 训练模式
        </button>
        <button
          onClick={() => setGameMode('free')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none
            ${gameMode === 'free' ? 'bg-emerald-600 text-white shadow shadow-emerald-600/20' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          🎸 自由模式
        </button>
      </div>
    </div>
  )
}
