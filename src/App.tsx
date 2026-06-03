import { useEffect } from 'react'
import { ModeSelector } from './components/ModeSelector'
import { NoteDisplay } from './components/NoteDisplay'
import { Fretboard } from './components/Fretboard'
import packageJson from '../package.json'
import { initAudioContext } from './utils/audioEngine' // 🌟 引入全局音频激活函数

function App() {
  // 🌟 全局 iOS/微信 专属手势捕获解锁逻辑
  useEffect(() => {
    const unlock = () => {
      initAudioContext()
      // 成功触发一次后，解绑事件，不留性能尾巴
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchend', unlock)
    }

    // 绑定全局点击和触屏抬起事件（iOS 尤为看重 touchend）
    window.addEventListener('click', unlock)
    window.addEventListener('touchend', unlock)

    // 针对 iOS 微信端内置环境的防拦截注入
    if (window.WeixinJSBridge) {
      window.WeixinJSBridge.invoke('getNetworkType', {}, unlock, false)
    } else {
      document.addEventListener('WeixinJSBridgeReady', unlock, false)
    }

    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchend', unlock)
      document.removeEventListener('WeixinJSBridgeReady', unlock)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 selection:bg-indigo-500/30">
      {/* 👑 顶部页头区域：应用名、版本号、GitHub 链接与模式选择 */}
      <header className="w-full max-w-5xl mx-auto border-b border-zinc-900 pb-4 mb-2 flex flex-col items-center gap-3 relative">
        {/* 🐙 GitHub 经典卡片样式链接元素 */}
        <div className="md:absolute md:right-0 md:top-2 flex items-center">
          <a
            href="https://github.com/你的用户名/你的仓库名" // 👈 请替换为你真实的 GitHub 仓库链接
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all focus:outline-none shadow-md group"
          >
            <svg
              className="w-4 h-4 fill-current transition-transform group-hover:scale-110"
              viewBox="0 0 16 16"
              version="1.1"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            <span>GitHub</span>
            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
              ↗
            </span>
          </a>
        </div>

        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-black tracking-wider bg-linear-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            FRETBOARD MASTER
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-widest text-zinc-600 mt-0.5">
            VERSION {packageJson.version}
          </p>
        </div>

        {/* 🎛️ 顶级控制：放置在页头正下方 */}
        <ModeSelector />
      </header>

      {/* 🎮 主操作区 */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto gap-2 md:gap-4">
        {/* 题目大字 */}
        <NoteDisplay />

        {/* 吉他指板主网格（内部复选框开关已全面美化为混音台红叉风格） */}
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
