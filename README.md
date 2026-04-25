# FretSmith

FretSmith is a Guitar Pro practice player built with Vite, TypeScript, and alphaTab.

Try it now at **[jingyu-sun.github.io/fretsmith](https://jingyu-sun.github.io/fretsmith/)** — no install required.

Load Guitar Pro files in the browser, render notation and tablature, sync with MP3 audio, adjust playback speed and zoom, switch notation views, isolate tracks, use count-in and metronome, define a selected range, and toggle loop playback for focused practice.

## Features

- Open local Guitar Pro files
- Render score and tablature with alphaTab
- Play, pause, and stop playback
- Change playback speed
- Change score zoom
- Switch notation views:
  - Default
  - Score + Tab
  - Score
  - Tab
  - Tab Mixed
- Select individual tracks or render all tracks
- Enable or disable count-in
- Enable or disable metronome
- Define a selected range from the score
- Toggle loop playback independently of the selected range
- **Audio playback**: Load an audio file (MP3, WAV, OGG, M4A, FLAC, AAC) alongside the score for external audio playback with a visual timeline, playhead, and seek controls
- **Score/audio sync**: Map positions in the score to timestamps in the audio using sync points — the score cursor follows the audio during playback
  - Add up to 10 sync points per file pair
  - One sync point per bar with automatic upsert
  - Fine-tune audio time (seconds + milliseconds) and score position (bar, beat, tick) with nudge controls
  - Monotonic ordering enforced — audio and score positions must stay in the same rank order
  - Preview sync points with looping 1s/2s playback
  - Sync points persist in localStorage, keyed by GP + audio filename pair
  - Click a score bar to select its sync point; click a bar without one to deselect

## Tech stack

- Vite
- TypeScript
- alphaTab
- alphaTab Vite plugin

## Project structure

- [src/main.ts](src/main.ts) — app state, UI binding, alphaTab callbacks
- [src/player/alphaTabPlayer.ts](src/player/alphaTabPlayer.ts) — alphaTab wrapper used by the app
- [src/audio/externalMediaHandler.ts](src/audio/externalMediaHandler.ts) — external media handler for MP3 playback via alphaTab
- [src/audio/syncManager.ts](src/audio/syncManager.ts) — sync point persistence and ordering validation
- [src/ui/layout.ts](src/ui/layout.ts) — main app layout and toolbar markup
- [src/ui/waveformPanel.ts](src/ui/waveformPanel.ts) — audio sync panel with timeline and markers
- [src/ui/syncPointEditor.ts](src/ui/syncPointEditor.ts) — sync point editor with fine-tune controls
- [src/utils/tickUtils.ts](src/utils/tickUtils.ts) — tick/bar/beat conversion utilities
- [src/state/practiceState.ts](src/state/practiceState.ts) — practice state types and defaults
- [src/styles/app.css](src/styles/app.css) — application styling

## Getting started

### Requirements

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Usage

Visit **[jingyu-sun.github.io/fretsmith](https://jingyu-sun.github.io/fretsmith/)**, or run `npm run dev` locally:

1. Click **Open GP File**
2. Choose a supported Guitar Pro file
3. Use the bottom toolbar to control playback, notation, zoom, track selection, count-in, metronome, the selected range, and loop playback
4. Click the **Audio** button in the toolbar to open the audio panel, then **Load Audio** to load an audio file
5. Open the sync editor (pencil button) to add sync points mapping score positions to audio timestamps
6. Click **+ Add** to create a sync point at the current playhead position, or **Update** to modify an existing one for the current bar
7. Use the fine-tune controls to adjust audio time and score position precisely

## Supported file types

The file picker is configured for:

- `.gp`
- `.gp3`
- `.gp4`
- `.gp5`
- `.gpx`
- `.gp7`
- `.gp8`

Audio files: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac`

Actual support depends on what alphaTab and the browser can load successfully.

## Notes

- Files are read client-side in the browser — nothing is uploaded to a server.
- The app is designed for practice workflows rather than score editing.
- Rendering and playback behavior are provided by alphaTab.
- Sync points are stored in the browser's localStorage and persist across sessions.
