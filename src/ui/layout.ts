import type { LoopPoint, PracticeState } from '../state/practiceState'

const loopLabel = (point: LoopPoint | null, fallback: string) =>
  point ? `Bar ${point.barIndex + 1}` : fallback

const renderSpeedOptions = (selectedSpeed: number) =>
  [0.5, 0.6, 0.75, 0.9, 1, 1.1, 1.25]
    .map((speed) => `<option value="${speed}" ${selectedSpeed === speed ? 'selected' : ''}>${Math.round(speed * 100)}%</option>`)
    .join('')

const renderZoomOptions = (selectedZoom: number) =>
  [0.75, 0.85, 1, 1.15, 1.3, 1.5]
    .map((zoom) => `<option value="${zoom}" ${selectedZoom === zoom ? 'selected' : ''}>${Math.round(zoom * 100)}%</option>`)
    .join('')

export const renderLayout = (state: PracticeState) => `
  <div class="app-shell">
    <header class="topbar topbar-compact">
      <div class="brand-block">
        <div class="brand-row">
          <p class="eyebrow">Guitar Nerd</p>
          <label class="file-button" for="file-input">Open GP file</label>
          <input id="file-input" type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp7,.gp8" />
        </div>
        <h1 class="title">${state.songTitle}</h1>
        <p class="subtitle">${state.fileName}</p>
      </div>
    </header>

    <main class="workspace workspace-single">
      <section class="score-panel">
        <div class="score-status">
          <span id="status-text">${state.errorText ?? state.statusText}</span>
          <span id="playback-time">0:00 / 0:00</span>
        </div>
        <div id="debug-text" class="debug-banner ${state.debugText ? 'is-visible' : ''}">${state.debugText ?? ''}</div>
        <div id="alpha-container" class="alpha-container">
          <div id="alphaTab" class="alpha-surface"></div>
        </div>
      </section>
    </main>

    <footer class="transport-bar transport-bar-jitashe">
      <div class="transport-left toolbar-group">
        <label class="toolbar-select-pill">
          <span class="toolbar-label">Tempo</span>
          <select id="tempo-select" class="toolbar-select">${renderSpeedOptions(state.playbackSpeed)}</select>
        </label>
        <label class="toolbar-select-pill">
          <span class="toolbar-label">Zoom</span>
          <select id="zoom-select" class="toolbar-select">${renderZoomOptions(state.zoom)}</select>
        </label>
        <label class="toolbar-select-pill toolbar-track-pill">
          <span class="toolbar-label">Track</span>
          <select id="track-select" class="toolbar-select" ${state.trackStates.length ? '' : 'disabled'}>
            <option value="all" ${state.selectedTrackIndexes.length > 1 ? 'selected' : ''}>All tracks</option>
          </select>
        </label>
        <span class="transport-pill" id="view-pill">Tab</span>
        <span class="transport-time" id="toolbar-time">${loopLabel(null, '')}${String(formatTimePlaceholder(state.currentTimeMs, state.endTimeMs))}</span>
      </div>
      <div class="transport-center toolbar-center">
        <button id="play-toggle" class="play-button play-button-round" ${state.isLoaded ? '' : 'disabled'}>${state.isPlaying ? 'Pause' : 'Play'}</button>
      </div>
      <div class="transport-right toolbar-group toolbar-actions">
        <label class="toolbar-select-pill">
          <span class="toolbar-label">Set A</span>
          <select id="set-loop-start" class="toolbar-select">
            <option value="normal" ${state.interactionMode === 'setLoopStart' ? '' : 'selected'}>${loopLabel(state.loopStart, 'Pick on score')}</option>
            <option value="set">Click score for A</option>
          </select>
        </label>
        <label class="toolbar-select-pill">
          <span class="toolbar-label">Set B</span>
          <select id="set-loop-end" class="toolbar-select">
            <option value="normal" ${state.interactionMode === 'setLoopEnd' ? '' : 'selected'}>${loopLabel(state.loopEnd, 'Pick on score')}</option>
            <option value="set">Click score for B</option>
          </select>
        </label>
        <button id="toggle-loop" class="toolbar-icon-button ${state.isLooping ? 'is-active' : ''}" ${state.loopStart && state.loopEnd ? '' : 'disabled'}>Loop</button>
        <button id="clear-loop" class="toolbar-icon-button" ${state.loopStart || state.loopEnd ? '' : 'disabled'}>Clear</button>
        <label class="toolbar-checkbox-pill">
          <input id="count-in-toggle" type="checkbox" ${state.countInEnabled ? 'checked' : ''} />
          <span>Count-in</span>
        </label>
        <button id="stop-button" class="toolbar-icon-button" ${state.isLoaded ? '' : 'disabled'}>Stop</button>
      </div>
    </footer>
  </div>
`

const formatTimePlaceholder = (currentTimeMs: number, endTimeMs: number) => `${Math.floor(currentTimeMs / 60000)}:${String(Math.floor(currentTimeMs / 1000) % 60).padStart(2, '0')} / ${Math.floor(endTimeMs / 60000)}:${String(Math.floor(endTimeMs / 1000) % 60).padStart(2, '0')}`
