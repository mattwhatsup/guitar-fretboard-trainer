import { useEffect, useState } from 'react'
import { getNoteByPosition } from '../utils/guitarLogic'
import { playGuitarTone } from '../utils/audioEngine'
import { useGameStore } from '../store/useGameStore'
import { ScoreBoard } from './ScoreBoard'

const getDisplayNoteName = (
  rawNote: string,
): { text: string; isAccidental: boolean } => {
  const mapping: Record<string, string> = {
    'C#': 'C#/Db',
    'D#': 'D#/Eb',
    'F#': 'F#/Gb',
    'G#': 'G#/Ab',
    'A#': 'A#/Bb',
  }
  if (mapping[rawNote]) return { text: mapping[rawNote], isAccidental: true }
  return { text: rawNote, isAccidental: false }
}

export const Fretboard = () => {
  const {
    instrument, // 🌟 完美注入乐器状态：'guitar' | 'ukulele'
    gameMode,
    correctPositions,
    lastClickedFeedback,
    showAnswerMode,
    activeStrings,
    gameStage,
    checkAnswer,
    revealAllAnswers,
    nextQuestion,
    toggleString,
  } = useGameStore()

  const IMAGE_FRETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const [errorTrigger, setErrorTrigger] = useState<{ s?: number; f?: number }>(
    {},
  )
  const [freeHighlights, setFreeHighlights] = useState<Record<string, boolean>>(
    {},
  )

  // 🌟 动态决定当前的琴弦总数
  const stringCount = instrument === 'guitar' ? 6 : 4

  // ❌ 错误红饼反馈
  useEffect(() => {
    if (gameMode === 'training' && lastClickedFeedback.status === 'wrong') {
      setErrorTrigger({
        s: lastClickedFeedback.stringIdx,
        f: lastClickedFeedback.fretIdx,
      })
      const timer = setTimeout(() => setErrorTrigger({}), 500)
      return () => clearTimeout(timer)
    }
  }, [lastClickedFeedback, gameMode])

  // ⌨️ 空格/回车 监听手动下一题
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameMode === 'training') {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          nextQuestion()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameMode, nextQuestion])

  const handleFretClick = (stringIdx: number, fretIdx: number) => {
    // 🌟 注入音频引擎联动，支持传参识别当前乐器发声频率
    playGuitarTone(instrument, stringIdx, fretIdx)
    checkAnswer(stringIdx, fretIdx)

    if (gameMode === 'free') {
      const coordKey = `${stringIdx}-${fretIdx}`
      setFreeHighlights((prev) => ({ ...prev, [coordKey]: true }))
      setTimeout(() => {
        setFreeHighlights((prev) => ({ ...prev, [coordKey]: false }))
      }, 2000)
    }
  }

  const isCompleted = gameStage === 'completed'

  return (
    <div className="w-full overflow-x-auto py-2 md:py-4 px-2 scrollbar-thin select-none">
      <div className="min-w-[920px] max-w-5xl mx-auto space-y-4">
        {/* 📊 看板区 */}
        <ScoreBoard />

        {/* 提示与状态栏 */}
        <div className="flex items-center justify-between px-2 h-8">
          {gameMode === 'training' ? (
            <>
              <div className="text-xs font-semibold text-zinc-400">
                目标搜索进度：已找到{' '}
                <span className="text-emerald-400 font-bold text-sm">
                  {correctPositions.length}
                </span>{' '}
                / {useGameStore.getState().totalTargetCount} 个
              </div>
              {isCompleted ? (
                <div className="text-xs font-bold text-emerald-400/80 tracking-wide flex items-center gap-2">
                  🎯 STAGE CLEAR{' '}
                  <span className="text-[10px] text-zinc-500 font-normal">
                    ( ⌨️ 按下 <b>Space</b> 或 <b>Enter</b> 刷入下一题 )
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      revealAllAnswers()
                      e.currentTarget.blur()
                    }}
                    disabled={showAnswerMode}
                    className="px-3 py-1 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none"
                  >
                    💡 正确答案
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs font-bold text-emerald-400 tracking-wide flex items-center gap-2">
              🎵 {instrument === 'guitar' ? '吉他' : '尤克里里'}
              自由演奏模式：点击任意品格即弹即显，不计分不限时
            </div>
          )}
        </div>

        {/* 🎸 指板网格 */}
        <div className="flex items-stretch justify-center w-full">
          {/* 左侧：0 品空弦音区 */}
          <div className="flex flex-col justify-between pt-[1.5%] pb-[1.5%] w-12 bg-zinc-900 border-y border-l border-zinc-700 rounded-l-xl p-1 gap-y-1">
            {[...Array(stringCount)].map((_, stringIdx) => {
              // 🌟 传入 instrument，使其正确索引到吉他（EADGBE）或尤克里里（GCEA）的空弦
              const rawNote = getNoteByPosition(instrument, stringIdx, 0)
              const displayInfo = getDisplayNoteName(rawNote)
              const isStringActive =
                gameMode === 'free' || activeStrings.includes(stringIdx)

              const isTrainingFound =
                gameMode === 'training' &&
                correctPositions.some(
                  (p) => p.stringIdx === stringIdx && p.fretIdx === 0,
                )
              const isTrainingWrong =
                gameMode === 'training' &&
                errorTrigger.s === stringIdx &&
                errorTrigger.f === 0
              const isFreeActive =
                gameMode === 'free' && freeHighlights[`${stringIdx}-0`]

              // 🌟 完美支持原版的正确答案高亮模式展现
              const isTargetAnswer =
                gameMode === 'training' &&
                showAnswerMode &&
                rawNote ===
                  useGameStore
                    .getState()
                    .currentNote.replace('Db', 'C#')
                    .replace('Eb', 'D#')
                    .replace('Gb', 'F#')
                    .replace('Ab', 'G#')
                    .replace('Bb', 'A#')
              const showBubble =
                isTrainingFound ||
                isTrainingWrong ||
                isFreeActive ||
                isTargetAnswer

              return (
                <button
                  key={stringIdx}
                  disabled={
                    (gameMode === 'training' && showAnswerMode) ||
                    !isStringActive
                  }
                  onClick={(e) => {
                    handleFretClick(stringIdx, 0)
                    e.currentTarget.blur()
                  }}
                  className={`h-8 w-full flex items-center justify-center relative rounded-md transition-all text-xs font-semibold focus:outline-none
                    ${isStringActive ? 'hover:bg-amber-600/10 text-amber-500' : 'opacity-10 cursor-not-allowed text-zinc-600'}
                  `}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all duration-200 shadow-md absolute z-20 px-0.5 tracking-tighter
                    ${displayInfo.isAccidental ? 'text-[10px]' : 'text-sm'}
                    ${showBubble ? 'scale-105' : 'scale-0'}
                    ${isFreeActive ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.85)]' : ''}
                    ${isTrainingFound ? (showAnswerMode ? 'bg-gradient-to-r from-indigo-400 to-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(129,140,248,0.85)]' : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_0_15px_rgba(52,211,153,0.85)]') : ''}
                    ${isTargetAnswer && !isTrainingFound ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(129,140,248,0.7)] animate-pulse' : ''}
                    ${isTrainingWrong ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.85)] animate-shake' : ''}
                  `}
                  >
                    {showBubble
                      ? isTrainingWrong
                        ? ''
                        : displayInfo.text
                      : ''}
                  </div>
                  <span className={showBubble ? 'opacity-0' : 'opacity-80'}>
                    {isStringActive ? `${stringIdx + 1}弦` : '✕'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 中间：1-12 品网格区 */}
          {/* 🌟 核心改进：根据不同乐器动态应用图片、不重复渲染，同时切换尤克里里更窄的纵横比 (aspect-[866/220]) */}
          <div
            className="relative flex-1 bg-no-repeat bg-cover bg-center border-y border-zinc-700 transition-all duration-300"
            style={{
              backgroundImage: `url('${instrument === 'guitar' ? './fretboard.png' : './ukulele-fretboard.png'}')`,
              aspectRatio: instrument === 'guitar' ? '866/335' : '866/177',
            }}
          >
            <div className="absolute inset-x-0 top-0 bottom-0 pt-[1.5%] pb-[1.5%] flex flex-col justify-between">
              {[...Array(stringCount)].map((_, stringIdx) => {
                const isStringActive =
                  gameMode === 'free' || activeStrings.includes(stringIdx)

                return (
                  <div
                    key={stringIdx}
                    className={`flex items-center ${instrument === 'guitar' ? 'h-[12%]' : 'h-[20%]'} w-full justify-between transition-opacity duration-200 ${!isStringActive ? 'opacity-15 pointer-events-none' : ''}`}
                  >
                    {IMAGE_FRETS.map((fretIdx) => {
                      // 🌟 传入 instrument
                      const rawNote = getNoteByPosition(
                        instrument,
                        stringIdx,
                        fretIdx,
                      )
                      const displayInfo = getDisplayNoteName(rawNote)

                      const isTrainingFound =
                        gameMode === 'training' &&
                        correctPositions.some(
                          (p) =>
                            p.stringIdx === stringIdx && p.fretIdx === fretIdx,
                        )
                      const isTrainingWrong =
                        gameMode === 'training' &&
                        errorTrigger.s === stringIdx &&
                        errorTrigger.f === fretIdx
                      const isFreeActive =
                        gameMode === 'free' &&
                        freeHighlights[`${stringIdx}-${fretIdx}`]

                      // 🌟 完美同步支持你原项目中的答案提示逻辑
                      const isTargetAnswer =
                        gameMode === 'training' &&
                        showAnswerMode &&
                        rawNote ===
                          useGameStore
                            .getState()
                            .currentNote.replace('Db', 'C#')
                            .replace('Eb', 'D#')
                            .replace('Gb', 'F#')
                            .replace('Ab', 'G#')
                            .replace('Bb', 'A#')
                      const showBubble =
                        isTrainingFound ||
                        isTrainingWrong ||
                        isFreeActive ||
                        isTargetAnswer

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
                          disabled={gameMode === 'training' && showAnswerMode}
                          onClick={(e) => {
                            handleFretClick(stringIdx, fretIdx)
                            e.currentTarget.blur()
                          }}
                          className="h-full flex-1 flex items-center justify-center relative z-10 group focus:outline-none"
                        >
                          {(!showAnswerMode || gameMode === 'free') && (
                            <div className="absolute w-[82%] h-[82%] rounded-md border border-transparent group-hover:bg-zinc-500/10 group-hover:border-indigo-500/20 transition-all pointer-events-none" />
                          )}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all duration-200 shadow-md absolute px-0.5 tracking-tighter whitespace-nowrap
                            ${displayInfo.isAccidental ? 'text-[9px] md:text-[10px]' : 'text-xs md:text-sm'}
                            ${showBubble ? 'scale-110' : 'scale-0 hover:scale-75 bg-zinc-600/30 text-zinc-100 backdrop-blur-[2px]'}
                            ${isFreeActive ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.85)]' : ''}
                            ${isTrainingFound ? (showAnswerMode ? 'bg-gradient-to-r from-indigo-400 to-cyan-500 text-zinc-950 shadow-[0_0_20px_rgba(129,140,248,0.85)]' : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.85)]') : ''}
                            ${isTargetAnswer && !isTrainingFound ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(129,140,248,0.7)] animate-pulse' : ''}
                            ${isTrainingWrong ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.85)] animate-shake' : ''}
                          `}
                          >
                            {showBubble
                              ? isTrainingWrong
                                ? ''
                                : displayInfo.text
                              : ''}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右侧：琴弦开关区 */}
          <div className="flex flex-col justify-between pt-[1.5%] pb-[1.5%] w-12 bg-zinc-900 border-y border-r border-zinc-700 rounded-r-xl shadow-lg ml-1 p-1 gap-y-1 items-center">
            {[...Array(stringCount)].map((_, stringIdx) => {
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
                    disabled={isDisableCheckbox || gameMode === 'free'}
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
