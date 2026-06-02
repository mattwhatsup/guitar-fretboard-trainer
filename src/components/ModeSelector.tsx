import { useGameStore } from '../store/useGameStore'

export const ModeSelector = () => {
  const { gameMode, setGameMode } = useGameStore()

  return (
    <div className="flex justify-center w-full py-2">
      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-64 shadow-lg">
        <button
          onClick={() => setGameMode('training')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none
            ${
              gameMode === 'training'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
        >
          🎯 训练模式
        </button>
        <button
          onClick={() => setGameMode('free')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none
            ${
              gameMode === 'free'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
        >
          🎸 自由模式
        </button>
      </div>
    </div>
  )
}
