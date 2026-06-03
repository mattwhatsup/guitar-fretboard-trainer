# 🎸 Guitar & Ukulele Fretboard Trainer

A modern, interactive fretboard memory training tool built with React, TypeScript, and Vite. Designed to help guitarists and ukulele players master note positions on the fretboard, improve sight-reading skills, and strengthen music theory fundamentals through gamified practice.

## ✨ Features

### 🎯 Smart Training Mode

- **Random Note Quizzes**: The system generates random target notes, and you must click the correct position(s) on the fretboard.
- **Instant Feedback**:
  - ✅ **Correct**: Highlights in green and plays the corresponding tone to reinforce auditory memory.
  - ❌ **Incorrect**: Shows a red shake animation to help correct mistakes immediately.
- **Progress Tracking**: Real-time display of accuracy and completion status for each stage.
- **Hint System**: Stuck? Use the "Show Answers" button to reveal all valid positions for the current target note.
- **Keyboard Support**: Press `Space` or `Enter` to quickly skip to the next question, keeping your practice flow uninterrupted.

### 🎵 Free Play Mode

- **Unrestricted Exploration**: Practice without the pressure of quizzes. Click any fret to play and learn.
- **Real-time Note Display**: Instantly shows note names (e.g., C#, Db) upon interaction, serving as a quick reference guide.
- **String Control**: Toggle individual strings on or off to focus on specific string groups or scales.

### 🎼 Realistic Audio Engine

- **Synthesized Tones**: Built-in lightweight audio engine plays realistic guitar/ukulele tones for every note clicked.
- **Low Latency**: Ensures immediate audio feedback for a responsive playing experience.

### 📱 Multi-Instrument Support

- **Guitar**: Standard 6-string guitar fretboard with full note mapping up to the 12th fret.
- **Ukulele**: Standard 4-string ukulele fretboard, adapted for its unique tuning logic.

### 🎨 Modern UI/UX

- **Responsive Design**: Fully optimized for both desktop and mobile devices.
- **Visual Aids**:
  - Special marking for accidental notes (e.g., C#/Db).
  - Clear fret inlays and markers.
  - Smooth animations and transitions for a polished feel.

## 🚀 Tech Stack

- **Frontend Framework**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Lightweight global state management)
- **Styling**: Tailwind CSS (Inferred from class names in source code)

## 📦 Installation & Setup

### Prerequisites

- Node.js >= 18.0.0
- npm / yarn / pnpm

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```
