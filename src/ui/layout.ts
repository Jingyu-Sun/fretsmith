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
      <rect x="3" y="3" width="18" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" />
      <rect x="3" y="9.5" width="18" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" />
      <rect x="3" y="16" width="18" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" />
    </svg>`,
  notation: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h16M4 12h16M4 16h16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      <ellipse cx="10" cy="16" rx="2.5" ry="2" transform="rotate(-15 10 16)" fill="currentColor" />
      <path d="M12.3 15V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>`,
  countIn: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 3h8M8 21h8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
      <path d="M16 3c0 4-4 6-4 9s-4 5-4 9" fill="none" stroke="currentColor" stroke-width="1.9" />
      <path d="M8 3c0 4 4 6 4 9s4 5 4 9" fill="none" stroke="currentColor" stroke-width="1.9" />
    </svg>`,
  speed: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  metronome: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 21h7l2.5-15h-12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M12 6V3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M12 14l4-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" />
    </svg>`,
  loop: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 2l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M20 5H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M7 22l-3-3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M4 19h12a4 4 0 0 0 4-4v-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
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
  rewind: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5v14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
      <path d="m18 6-10 6 10 6Z" fill="currentColor" />
    </svg>`,
  github: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" />
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
          <span class="brand-wordmark">FRETSMITH</span>
        </div>
        ${renderMeta(state)}
      </div>
      <div class="topbar-time" id="toolbar-time">${String(formatTimePlaceholder(state.currentTimeMs, state.endTimeMs))}</div>
      <div class="topbar-actions">
        <label class="file-button" for="file-input">Open GP File</label>
        <input id="file-input" type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp7,.gp8" />
        <a href="https://github.com/Jingyu-Sun/fretsmith" target="_blank" rel="noopener noreferrer" class="toolbar-icon-button github-link" title="View on GitHub">
          <span class="toolbar-symbol" aria-hidden="true">${icon.github}</span>
          <span class="sr-only">View on GitHub</span>
        </a>
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
      <div class="transport-playback">
        <button id="stop-button" class="toolbar-icon-button toolbar-transport-button" title="Rewind" ${state.isLoaded ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.rewind}</span>
          <span class="sr-only">Rewind</span>
        </button>
        <button id="play-toggle" class="play-button play-button-round" ${state.isLoaded ? '' : 'disabled'}>
          <span class="toolbar-symbol toolbar-symbol-strong" aria-hidden="true">${state.isPlaying ? icon.pause : icon.play}</span>
          <span class="sr-only">${state.isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        ${renderSelectShell('tempo-select', renderSpeedOptions(state.playbackSpeed), icon.speed, 'Tempo', 'tempo-pill')}
        <button id="count-in-toggle-btn" class="toolbar-icon-button toolbar-action-icon ${state.countInEnabled ? 'is-active' : ''}" title="Count-in">
          <span class="toolbar-symbol" aria-hidden="true">${icon.countIn}</span>
          <span class="sr-only">Count-in</span>
        </button>
        <button id="metronome-toggle-btn" class="toolbar-icon-button toolbar-action-icon ${state.metronomeEnabled ? 'is-active' : ''}" title="Metronome">
          <span class="toolbar-symbol" aria-hidden="true">${icon.metronome}</span>
          <span class="sr-only">Metronome</span>
        </button>
        <button id="toggle-loop" class="toolbar-icon-button toolbar-action-icon ${state.isLooping ? 'is-active' : ''}" title="Loop" ${state.isLoaded ? '' : 'disabled'}>
          <span class="toolbar-symbol" aria-hidden="true">${icon.loop}</span>
          <span class="sr-only">Toggle loop playback</span>
        </button>
      </div>
      <div class="transport-settings">
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
      </div>
      <div class="transport-loop">
        <div class="toolbar-range-group">
          <div class="toolbar-select-pill loop-pill loop-pill-flat">
            <select id="set-loop-start" class="toolbar-select">
              <option value="normal" ${state.interactionMode === 'setLoopStart' ? '' : 'selected'}>${loopLabel(state.loopStart, 'From')}</option>
              <option value="set">Click score</option>
            </select>
          </div>
          <span class="toolbar-range-dash">&mdash;</span>
          <div class="toolbar-select-pill loop-pill loop-pill-flat">
            <select id="set-loop-end" class="toolbar-select">
              <option value="normal" ${state.interactionMode === 'setLoopEnd' ? '' : 'selected'}>${loopLabel(state.loopEnd, 'To')}</option>
              <option value="set">Click score</option>
            </select>
          </div>
          <button id="clear-loop" class="toolbar-icon-button toolbar-action-icon toolbar-clear-inline" title="Clear selected range" ${state.loopStart || state.loopEnd ? '' : 'disabled'}>
            <span class="toolbar-symbol" aria-hidden="true">${icon.clear}</span>
            <span class="sr-only">Clear selected range</span>
          </button>
        </div>
      </div>
    </footer>
  </div>
`

const formatTimePlaceholder = (currentTimeMs: number, endTimeMs: number) => `${Math.floor(currentTimeMs / 60000)}:${String(Math.floor(currentTimeMs / 1000) % 60).padStart(2, '0')} / ${Math.floor(endTimeMs / 60000)}:${String(Math.floor(endTimeMs / 1000) % 60).padStart(2, '0')}`
