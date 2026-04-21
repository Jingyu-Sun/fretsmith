import type { LoopPoint, NotationView, PracticeState } from '../state/practiceState'

const loopLabel = (point: LoopPoint | null, fallback: string) =>
  point ? `Bar ${point.barIndex + 1}` : fallback

const renderSpeedOptions = (selectedSpeed: number) =>
  [0.25, 0.5, 0.75, 0.9, 1, 1.5, 2]
    .map((speed) => `<option value="${speed}" ${selectedSpeed === speed ? 'selected' : ''}>${speed}x</option>`)
    .join('')

const renderZoomOptions = (selectedZoom: number) =>
  [0.25, 0.5, 0.75, 0.85, 1, 1.15, 1.3, 1.5, 2]
    .map((zoom) => `<option value="${zoom}" ${selectedZoom === zoom ? 'selected' : ''}>${Math.round(zoom * 100)}%</option>`)
    .join('')

const renderNotationOptions = (selectedView: NotationView) =>
  [
    { value: 'default', label: 'Default' },
    { value: 'score-tab', label: 'Score + Tab' },
    { value: 'score', label: 'Score' },
    { value: 'tab', label: 'Tab' },
    { value: 'tab-mixed', label: 'Tab Mixed' },
  ]
    .map((view) => `<option value="${view.value}" ${selectedView === view.value ? 'selected' : ''}>${view.label}</option>`)
    .join('')

const renderMeta = (state: PracticeState) => {
  const meta = [state.songTitle, state.fileName].filter(Boolean)
  if (!meta.length) return ''

  return `
        <div class="title-stack">
          ${state.songTitle ? `<h1 class="title">${state.songTitle}</h1>` : ''}
          ${state.fileName ? `<p class="subtitle">${state.fileName}</p>` : ''}
        </div>`
}

const icon = {
  zoom: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="m15 15 4.5 4.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
    </svg>`,
  track: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5v9.2a3 3 0 1 1-2-2.82V7.3l8-1.8v7.5a3 3 0 1 1-2-2.82V5z" fill="currentColor" />
    </svg>`,
  notation: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 18V7.5a2.5 2.5 0 1 1 2 2.45V18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M13 9.5h5M13 13h5M13 16.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>`,
  countIn: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v7l4 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M8 1h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>`,
  loop: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 2l2 2-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M19 4H8a4 4 0 0 0 0 8h1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <path d="M7 22l-2-2 2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M5 20h11a4 4 0 0 0 0-8h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>`,
  clear: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>`,
  play: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 12 7-12 7Z" fill="currentColor" />
    </svg>`,
  pause: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="13" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>`,
  stop: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>`,
}

const selectIcon = (svg: string, label: string) => `
  <span class="toolbar-symbol" aria-hidden="true">${svg}</span>
  <span class="sr-only">${label}</span>
`

const renderSelectShell = (id: string, options: string, icon: string, label: string, extraClass = '', disabled = false) => `
  <div class="toolbar-select-pill toolbar-select-compact ${extraClass}">
    ${selectIcon(icon, label)}
    <select id="${id}" class="toolbar-select" ${disabled ? 'disabled' : ''}>${options}</select>
  </div>
`

export const renderLayout = (state: PracticeState) => `
  <div class="app-shell">
    <header class="topbar topbar-compact">
      <div class="brand-block">
        <div class="brand-lockup">
          <span class="brand-kicker">Practice smarter</span>
          <span class="brand-wordmark">GUITAR NERD</span>
        </div>
        ${renderMeta(state)}
      </div>
      <div class="topbar-time" id="toolbar-time">${String(formatTimePlaceholder(state.currentTimeMs, state.endTimeMs))}</div>
      <div class="topbar-actions">
        <label class="file-button" for="file-input">Open GP File</label>
        <input id="file-input" type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp7,.gp8" />
      </div>
    </header>

    <main class="workspace workspace-single">
      <section class="score-panel">
        <div id="alpha-container" class="alpha-container">
          <div id="alphaTab" class="alpha-surface"></div>
        </div>
      </section>
    </main>

    <footer class="transport-bar transport-bar-jitashe">
      <div class="transport-left toolbar-group">
        <div class="toolbar-select-pill tempo-pill">
          <select id="tempo-select" class="toolbar-select">${renderSpeedOptions(state.playbackSpeed)}</select>
        </div>
        ${renderSelectShell('zoom-select', renderZoomOptions(state.zoom), icon.zoom, 'Zoom', 'zoom-pill')}
        ${renderSelectShell('notation-select', renderNotationOptions(state.notationView), icon.notation, 'Notation', 'notation-pill')}
        ${renderSelectShell(
          'track-select',
          `<option value="all" ${state.selectedTrackIndexes.length > 1 ? 'selected' : ''}>All tracks</option>`,
          icon.track,
          'Track',
          'toolbar-track-pill',
          !state.trackStates.length,
        )}
        <button id="count-in-toggle-btn" class="toolbar-icon-button toolbar-action-icon ${state.countInEnabled ? 'is-active' : ''}">
          <span class="toolbar-symbol" aria-hidden="true">${icon.countIn}</span>
          <span class="sr-only">Count-in</span>
        </button>
      </div>
      <div class="transport-center toolbar-center">
        <button id="play-toggle" class="play-button play-button-round" ${state.isLoaded ? '' : 'disabled'}>
          <span class="toolbar-symbol toolbar-symbol-strong" aria-hidden="true">${state.isPlaying ? icon.pause : icon.play}</span>
          <span class="sr-only">${state.isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button id="stop-button" class="toolbar-icon-button toolbar-stop-button" ${state.isLoaded ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.stop}</span>
          <span class="sr-only">Stop</span>
        </button>
      </div>
      <div class="transport-right toolbar-group toolbar-actions">
        <span class="toolbar-range-label">Selected Range:</span>
        <div class="toolbar-select-pill loop-pill">
          <select id="set-loop-start" class="toolbar-select">
            <option value="normal" ${state.interactionMode === 'setLoopStart' ? '' : 'selected'}>${loopLabel(state.loopStart, 'From')}</option>
            <option value="set">Click score</option>
          </select>
        </div>
        <span class="toolbar-range-dash">&mdash;</span>
        <div class="toolbar-select-pill loop-pill">
          <select id="set-loop-end" class="toolbar-select">
            <option value="normal" ${state.interactionMode === 'setLoopEnd' ? '' : 'selected'}>${loopLabel(state.loopEnd, 'To')}</option>
            <option value="set">Click score</option>
          </select>
        </div>
        <button id="toggle-loop" class="toolbar-icon-button toolbar-action-icon ${state.isLooping ? 'is-active' : ''}" ${state.isLoaded ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.loop}</span>
          <span class="sr-only">Toggle loop playback</span>
        </button>
        <button id="clear-loop" class="toolbar-icon-button toolbar-action-icon" ${state.loopStart || state.loopEnd ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.clear}</span>
          <span class="sr-only">Clear selected range</span>
        </button>
      </div>
    </footer>
  </div>
`

const formatTimePlaceholder = (currentTimeMs: number, endTimeMs: number) => `${Math.floor(currentTimeMs / 60000)}:${String(Math.floor(currentTimeMs / 1000) % 60).padStart(2, '0')} / ${Math.floor(endTimeMs / 60000)}:${String(Math.floor(endTimeMs / 1000) % 60).padStart(2, '0')}`
