# FretSmith

FretSmith is a local Guitar Pro practice player built with Vite, TypeScript, and alphaTab.

It lets you load Guitar Pro files in the browser, render notation and tablature, adjust playback speed and zoom, switch notation views, isolate tracks, use count-in and metronome, define a selected range, and toggle loop playback for focused practice.

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

## Tech stack

- Vite
- TypeScript
- alphaTab
- alphaTab Vite plugin

## Project structure

- [src/main.ts](src/main.ts) — app state, UI binding, alphaTab callbacks
- [src/player/alphaTabPlayer.ts](src/player/alphaTabPlayer.ts) — alphaTab wrapper used by the app
- [src/ui/layout.ts](src/ui/layout.ts) — main app layout and toolbar markup
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

1. Start the app with `npm run dev`
2. Open the local URL shown by Vite
3. Click **Open GP File**
4. Choose a supported Guitar Pro file
5. Use the bottom toolbar to control playback, notation, zoom, track selection, count-in, metronome, the selected range, and loop playback

## Supported file types

The file picker is configured for:

- `.gp`
- `.gp3`
- `.gp4`
- `.gp5`
- `.gpx`
- `.gp7`
- `.gp8`

Actual support depends on what alphaTab can load successfully.

## Notes

- Files are loaded locally from your machine through the browser UI.
- The app is designed for practice workflows rather than score editing.
- Rendering and playback behavior are provided by alphaTab.
