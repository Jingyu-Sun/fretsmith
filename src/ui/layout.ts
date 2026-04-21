import type { LoopPoint, NotationView, PracticeState } from '../state/practiceState'

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
  tempo: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 8 13h3l-1 7 6-10h-3l2-6Z" fill="currentColor" />
    </svg>`,
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
      <path d="M8 5h8l2 4v10H6V9l2-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M9 5V3m6 2V3m-3 7v3l2 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  from: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5v14M18 8l-5 4 5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  to: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 5v14M6 8l5 4-5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  loop: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h9a4 4 0 0 1 0 8h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m14 18 2 2 2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M17 17H8a4 4 0 0 1 0-8h1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m10 6-2-2-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  clear: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>`,
  play: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 6 10 6-10 6Z" fill="currentColor" />
    </svg>`,
  pause: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h3v12H8zm5 0h3v12h-3z" fill="currentColor" />
    </svg>`,
  stop: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
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
        ${renderSelectShell('tempo-select', renderSpeedOptions(state.playbackSpeed), icon.tempo, 'Tempo', 'tempo-pill')}
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
        <label class="toolbar-checkbox-pill toolbar-count-pill">
          <input id="count-in-toggle" type="checkbox" ${state.countInEnabled ? 'checked' : ''} />
          <span class="toolbar-symbol" aria-hidden="true">${icon.countIn}</span>
          <span class="sr-only">Count-in</span>
        </label>
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
        ${renderSelectShell(
          'set-loop-start',
          `<option value="normal" ${state.interactionMode === 'setLoopStart' ? '' : 'selected'}>${loopLabel(state.loopStart, 'From')}</option>
           <option value="set">Click score for From</option>`,
          icon.from,
          'Loop from',
          'loop-pill loop-pill-wide',
        )}
        ${renderSelectShell(
          'set-loop-end',
          `<option value="normal" ${state.interactionMode === 'setLoopEnd' ? '' : 'selected'}>${loopLabel(state.loopEnd, 'To')}</option>
           <option value="set">Click score for To</option>`,
          icon.to,
          'Loop to',
          'loop-pill loop-pill-wide',
        )}
        <button id="toggle-loop" class="toolbar-icon-button toolbar-action-icon ${state.isLooping ? 'is-active' : ''}" ${state.loopStart && state.loopEnd ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.loop}</span>
          <span class="sr-only">Toggle loop</span>
        </button>
        <button id="clear-loop" class="toolbar-icon-button toolbar-action-icon" ${state.loopStart || state.loopEnd ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.clear}</span>
          <span class="sr-only">Clear loop</span>
        </button>
      </div>
    </footer>
  </div>
`

const formatTimePlaceholder = (currentTimeMs: number, endTimeMs: number) => `${Math.floor(currentTimeMs / 60000)}:${String(Math.floor(currentTimeMs / 1000) % 60).padStart(2, '0')} / ${Math.floor(endTimeMs / 60000)}:${String(Math.floor(endTimeMs / 1000) % 60).padStart(2, '0')}`
