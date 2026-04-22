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
      <path d="M8 3h8M8 21h8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
      <path d="M12 3v0c-3.3 0-6 3.6-6 8s2.7 8 6 8 6-3.6 6-8-2.7-8-6-8z" fill="none" stroke="currentColor" stroke-width="1.9" />
      <path d="M12 3c2 2.5 2 5 0 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>`,
  speed: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5a7.5 7.5 0 1 1-7.5 7.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
      <path d="M12 8v4.2l3 1.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m6.5 3.5-3 2.5 3 2.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  metronome: `
    <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 21h7l2.5-15h-12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M12 6V3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M12 14l4-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" />
    </svg>`,
  loop: `
    <svg class="toolbar-svg" viewBox="0 0 176 154" aria-hidden="true">
      <path fill="currentColor" d="M85.558479,90.838089 C98.162216,99.357796 110.445412,107.758934 124.108932,117.104156 C110.408577,126.283867 97.861397,134.690918 83.743675,144.150284 C83.554710,138.908585 83.337486,135.120560 83.299187,131.330719 C83.230492,124.532738 83.274887,124.553162 76.504913,124.374626 C63.681557,124.036469 51.126312,122.559242 41.757027,112.489105 C34.935440,105.157249 30.337942,96.610542 30.281641,86.208115 C30.237497,78.052650 30.361019,69.892067 30.099903,61.743702 C29.961874,57.436333 31.932352,56.090710 35.813763,56.343952 C39.641193,56.593674 44.421860,55.279243 44.485870,61.609070 C44.563293,69.265244 44.450485,76.924164 44.593117,84.578674 C44.861084,98.959686 55.646008,109.532356 69.960472,109.589813 C83.149620,109.642761 83.077370,109.641212 83.366005,96.198364 C83.405495,94.359535 84.585808,92.545204 85.558479,90.838089 Z M96.872925,43.669048 C108.244926,41.198666 118.924194,48.949543 122.752045,60.790817 C124.675583,66.741203 124.398132,73.413246 125.028267,79.767639 C125.387497,83.390121 125.886765,87.042259 125.748238,90.659027 C125.591576,94.749405 127.654015,95.061722 130.967239,95.169701 C134.687241,95.290932 135.622223,93.322357 135.790710,90.385811 C136.564911,76.892311 136.304245,63.429928 129.521347,51.279106 C123.429947,40.367023 113.804665,34.132240 101.210686,33.026165 C97.409485,32.692318 93.557053,32.975933 89.729729,32.897243 C83.860291,32.776573 81.987297,30.873096 81.927307,25.136909 C81.892532,21.812601 81.841217,18.488277 81.754936,15.165061 C81.748146,14.903316 81.407959,14.650229 80.708702,13.679674 C69.920105,21.034084 59.113804,28.400566 47.204384,36.519024 C58.693592,44.297115 69.734779,51.771896 82.082588,60.131256 C82.082588,55.009903 81.834305,51.411201 82.193459,47.874184 C82.358528,46.248550 83.714859,44.743877 84.935532,43.279953 C84.908936,48.473759 84.397034,53.566799 84.070671,58.671700 C83.776688,63.270199 82.938904,64.013405 79.180367,61.586143 C69.987457,55.649387 60.982201,49.421978 51.907024,43.303234 C51.495029,43.025452 51.157829,42.638325 50.752197,42.349274 C42.204327,36.258179 42.176838,35.829174 50.775509,30.135134 C60.030468,24.006498 69.325699,17.938021 78.651588,11.917996 C79.831581,11.156296 81.303688,10.847138 82.640457,10.328318 C83.112114,11.813909 83.896339,13.279792 83.991508,14.789121 C84.200821,18.108604 84.188385,21.456091 84.029327,24.780802 C83.873062,28.047071 85.282692,28.990097 88.455063,29.175457 C95.357956,29.578781 102.592804,29.340372 109.045258,31.395134 C123.825737,36.101925 134.926483,46.535904 136.862366,64.822227 C137.839432,74.051605 137.580856,83.412971 137.849518,92.715569 C137.950119,96.198616 136.283020,98.000534 132.708099,97.908043 C130.876312,97.860641 129.042587,97.872169 127.209846,97.880905 C123.654388,97.897858 122.119461,96.109489 122.155823,92.593285 C122.226471,85.762497 121.800186,78.907051 122.233559,72.103462 C123.235497,56.373833 111.966072,46.818443 99.348694,44.799385 C98.561989,44.673500 97.821815,44.256931 96.872925,43.669048 Z"/>
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
