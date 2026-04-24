import './styles/app.css'

import { PlayerMode, type model } from '@coderline/alphatab'

type Beat = model.Beat
type Score = model.Score
type Track = model.Track

import { AudioMediaHandler } from './audio/externalMediaHandler'
import { SyncManager } from './audio/syncManager'
import { PracticePlayer } from './player/alphaTabPlayer'
import {
  defaultPracticeState,
  formatMillis,
  type PlaybackMode,
  type PracticeState,
  type SyncPoint,
} from './state/practiceState'
import { renderLayout } from './ui/layout'
import { getBarStartLoopPoint, getBarEndLoopPoint, getBarFirstBeat, getBarLastBeat } from './ui/loopSelection'
import { updateSyncMarkerPositions } from './ui/waveformPanel'
import { formatTick, barPositionToTick, tickToBarPosition, findBarContainingTick } from './utils/tickUtils'
import { renderSyncPointEditor } from './ui/syncPointEditor'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('The app root was not found.')
}

let state = defaultPracticeState()
let currentScore: Score | null = null
let currentTracks: Track[] = []
let highlightedStartBeat: Beat | null = null
let highlightedEndBeat: Beat | null = null
let highlightedSyncPointBeat: Beat | null = null
let player: PracticePlayer | null = null
let pendingFile: File | null = null
let shouldResetViewport = false
let wavesurfer: HTMLAudioElement | null = null
let syncManager: SyncManager | null = null
let loadedGpBuffer: ArrayBuffer | null = null
let previewLoopTimeout: number | null = null

const computeScorePositions = (): string[] => {
  if (!currentScore) return []
  return state.syncPoints.map((sp) => {
    const tick = barPositionToTick(currentScore!, sp.barIndex, sp.barPosition)
    return formatTick(currentScore!, tick)
  })
}

const computeSelectedScoreDetail = (): { barNumber: number; beatNumber: string; tick: number } | null => {
  if (!currentScore || state.selectedSyncPointIndex === null) return null
  const point = state.syncPoints[state.selectedSyncPointIndex]
  if (!point) return null

  const tick = barPositionToTick(currentScore, point.barIndex, point.barPosition)
  const bar = findBarContainingTick(currentScore, tick)
  if (!bar) return null

  const barStart = bar.start
  const barDuration = bar.calculateDuration()
  const beatsInBar = bar.timeSignatureNumerator
  const ticksPerBeat = barDuration / beatsInBar
  const tickInBar = tick - barStart
  const beatNumber = ticksPerBeat > 0 ? tickInBar / ticksPerBeat + 1 : 1
  const tickInBeat = ticksPerBeat > 0 ? Math.round(tickInBar % ticksPerBeat) : 0

  return {
    barNumber: bar.index + 1,
    beatNumber: beatNumber < 1.01 ? '1' : beatNumber.toFixed(beatNumber % 1 < 0.01 ? 0 : 2),
    tick: tickInBeat,
  }
}

const setState = (updater: Partial<PracticeState> | ((current: PracticeState) => PracticeState)) => {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater }
  syncUi()
}

const normalizeLabel = (value: string | null | undefined, fallback: string) => {
  const text = value?.trim()
  if (!text) return fallback
  return /�|\?{2,}/.test(text) ? fallback : text
}

const updateLoopDetails = () => {
  const loopStartSelect = document.querySelector<HTMLSelectElement>('#set-loop-start')
  const loopEndSelect = document.querySelector<HTMLSelectElement>('#set-loop-end')
  const toggleLoop = document.querySelector<HTMLButtonElement>('#toggle-loop')
  const clearLoop = document.querySelector<HTMLButtonElement>('#clear-loop')

  if (loopStartSelect && !loopStartSelect.disabled) {
    loopStartSelect.options[0].text = state.loopStart ? `Bar ${state.loopStart.barIndex + 1}` : 'From'
    const startValue = state.interactionMode === 'setLoopStart' ? 'set' : 'normal'
    if (document.activeElement !== loopStartSelect || startValue === 'normal') {
      loopStartSelect.value = startValue
    }
  }

  if (loopEndSelect && !loopEndSelect.disabled) {
    loopEndSelect.options[0].text = state.loopEnd ? `Bar ${state.loopEnd.barIndex + 1}` : 'To'
    const endValue = state.interactionMode === 'setLoopEnd' ? 'set' : 'normal'
    if (document.activeElement !== loopEndSelect || endValue === 'normal') {
      loopEndSelect.value = endValue
    }
  }

  if (toggleLoop) {
    toggleLoop.classList.toggle('is-active', state.isLooping)
  }

  if (clearLoop) clearLoop.disabled = !(state.loopStart || state.loopEnd)
}

const applyLoopRangeToPlayer = () => {
  if (!player) return

  if (state.loopStart && state.loopEnd) {
    player.setLoopRange(state.loopStart.tick, state.loopEnd.tick)
    player.setLoopEnabled(state.isLooping)
    if (highlightedStartBeat && highlightedEndBeat) {
      player.highlightRange(highlightedStartBeat, highlightedEndBeat)
    }
  } else {
    player.setLoopEnabled(false)
    player.clearLoopRange()
  }
}

let lastTrackMixerKey = ''

const syncTrackMixer = () => {
  const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')
  if (!trackSelect || !currentScore) return

  const key = `${currentScore.tracks.length}:${state.selectedTrackIndexes.join(',')}`
  if (key === lastTrackMixerKey) return
  lastTrackMixerKey = key

  const options = currentScore.tracks
    .map((track) => {
      const label = normalizeLabel(track.name || track.shortName, `Track ${track.index + 1}`)
      const selected = state.selectedTrackIndexes.length === 1 && state.selectedTrackIndexes[0] === track.index
      return `<option value="${track.index}" ${selected ? 'selected' : ''}>${label}</option>`
    })
    .join('')

  trackSelect.innerHTML = `<option value="all" ${state.selectedTrackIndexes.length > 1 ? 'selected' : ''}>All tracks</option>${options}`
  trackSelect.disabled = false
}

const syncUi = () => {
  const toolbarTime = document.querySelector<HTMLElement>('#toolbar-time')
  const playToggle = document.querySelector<HTMLButtonElement>('#play-toggle')
  const stopButton = document.querySelector<HTMLButtonElement>('#stop-button')
  const tempoSelect = document.querySelector<HTMLSelectElement>('#tempo-select')
  const zoomSelect = document.querySelector<HTMLSelectElement>('#zoom-select')
  const notationSelect = document.querySelector<HTMLSelectElement>('#notation-select')
  const countInToggle = document.querySelector<HTMLButtonElement>('#count-in-toggle-btn')
  const metronomeToggle = document.querySelector<HTMLButtonElement>('#metronome-toggle-btn')
  const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')
  const toggleLoop = document.querySelector<HTMLButtonElement>('#toggle-loop')

  if (toolbarTime) toolbarTime.textContent = `${formatMillis(state.currentTimeMs)} / ${formatMillis(state.endTimeMs)}`
  if (playToggle) {
    playToggle.disabled = !state.isLoaded
    const shouldShowPause = state.isPlaying
    const currentIcon = playToggle.dataset.icon
    if (currentIcon !== (shouldShowPause ? 'pause' : 'play')) {
      playToggle.dataset.icon = shouldShowPause ? 'pause' : 'play'
      const symbolSpan = playToggle.querySelector('.toolbar-symbol')
      if (symbolSpan) {
        symbolSpan.innerHTML = shouldShowPause
          ? '<svg class="toolbar-svg" viewBox="0 0 24 24"><rect x="7" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="13" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>'
          : '<svg class="toolbar-svg" viewBox="0 0 24 24"><path d="m8 5 12 7-12 7Z" fill="currentColor"/></svg>'
      }
    }
  }
  if (stopButton) stopButton.disabled = !state.isLoaded
  if (tempoSelect) tempoSelect.value = String(state.playbackSpeed)
  if (zoomSelect) zoomSelect.value = String(state.zoom)
  if (notationSelect) notationSelect.value = state.notationView
  if (countInToggle) countInToggle.classList.toggle('is-active', state.countInEnabled)
  if (metronomeToggle) metronomeToggle.classList.toggle('is-active', state.metronomeEnabled)
  if (trackSelect) trackSelect.disabled = !currentScore
  if (toggleLoop) toggleLoop.disabled = !state.isLoaded

  const loopStartSelect = document.querySelector<HTMLSelectElement>('#set-loop-start')
  const loopEndSelect = document.querySelector<HTMLSelectElement>('#set-loop-end')
  if (loopStartSelect) loopStartSelect.disabled = !state.isLoaded || state.isPlaying
  if (loopEndSelect) loopEndSelect.disabled = !state.isLoaded || state.isPlaying

  updateLoopDetails()
  syncTrackMixer()
  syncWaveformUi()
}

const syncWaveformUi = () => {
  const mp3Toggle = document.querySelector<HTMLButtonElement>('#mp3-toggle')
  const toggleSyncEditorBtn = document.querySelector<HTMLButtonElement>('#toggle-sync-editor')
  const panel = document.querySelector<HTMLElement>('.audio-sync-panel')

  if (mp3Toggle) {
    mp3Toggle.classList.toggle('is-active', state.waveformVisible)
    mp3Toggle.disabled = !state.isLoaded
  }
  if (toggleSyncEditorBtn) {
    toggleSyncEditorBtn.classList.toggle('is-active', state.syncPointEditorVisible)
    toggleSyncEditorBtn.disabled = !state.mp3Loaded
  }
  if (panel) {
    panel.classList.toggle('is-visible', state.waveformVisible)
  }

  updateSyncPointEditorUi()
}

let lastSyncEditorKey = ''

const updateSyncPointEditorUi = () => {
  const editorContainer = document.querySelector('.audio-sync-panel')
  if (!editorContainer) return

  const editorKey = `${state.syncPointEditorVisible}:${state.syncPoints.length}:${state.selectedSyncPointIndex}:${JSON.stringify(state.syncPoints)}`
  if (editorKey === lastSyncEditorKey) return
  lastSyncEditorKey = editorKey

  const scorePositions = computeScorePositions()
  const scoreDetail = computeSelectedScoreDetail()
  const existingEditor = editorContainer.querySelector('.sync-point-editor')

  if (existingEditor) {
    existingEditor.remove()
  }

  const editorHtml = renderSyncPointEditor(state, scorePositions, scoreDetail)

  const timeline = editorContainer.querySelector('.audio-timeline')
  if (editorHtml && timeline) {
    timeline.insertAdjacentHTML('afterend', editorHtml)
  }
}

const bindUi = () => {
  const fileInput = document.querySelector<HTMLInputElement>('#file-input')
  const tempoSelect = document.querySelector<HTMLSelectElement>('#tempo-select')
  const zoomSelect = document.querySelector<HTMLSelectElement>('#zoom-select')
  const notationSelect = document.querySelector<HTMLSelectElement>('#notation-select')
  const playToggle = document.querySelector<HTMLButtonElement>('#play-toggle')
  const stopButton = document.querySelector<HTMLButtonElement>('#stop-button')
  const setLoopStart = document.querySelector<HTMLSelectElement>('#set-loop-start')
  const setLoopEnd = document.querySelector<HTMLSelectElement>('#set-loop-end')
  const toggleLoop = document.querySelector<HTMLButtonElement>('#toggle-loop')
  const clearLoop = document.querySelector<HTMLButtonElement>('#clear-loop')
  const countInToggle = document.querySelector<HTMLButtonElement>('#count-in-toggle-btn')
  const metronomeToggle = document.querySelector<HTMLButtonElement>('#metronome-toggle-btn')
  const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')

  fileInput?.addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !player) return

    pendingFile = file
    syncManager = null
    shouldResetViewport = true
    highlightedStartBeat = null
    highlightedEndBeat = null
    player.clearLoopRange()
    currentScore = null
    currentTracks = []
    lastTrackMixerKey = ''

    const buffer = await file.arrayBuffer()
    loadedGpBuffer = buffer

    setState({
      ...defaultPracticeState(),
      fileName: file.name,
      songTitle: file.name,
      waveformVisible: state.waveformVisible,
      statusText: 'Loading Guitar Pro file…',
    })

    try {
      const result = player.api.load(buffer)
      if (!result) {
        throw new Error('This file format could not be loaded by alphaTab.')
      }
    } catch (error) {
      shouldResetViewport = false
      setState((current) => ({
        ...current,
        errorText: error instanceof Error ? error.message : 'Unable to load this file.',
        statusText: 'Choose another file or verify the format is supported.',
      }))
    } finally {
      input.value = ''
    }
  })

  tempoSelect?.addEventListener('change', (event) => {
    const nextSpeed = Number((event.currentTarget as HTMLSelectElement).value)
    player?.setPlaybackSpeed(nextSpeed)
    setState({ playbackSpeed: nextSpeed })
  })

  zoomSelect?.addEventListener('change', (event) => {
    const nextZoom = Number((event.currentTarget as HTMLSelectElement).value)
    player?.setZoom(nextZoom)
    setState({ zoom: nextZoom })
  })

  notationSelect?.addEventListener('change', (event) => {
    const nextNotationView = (event.currentTarget as HTMLSelectElement).value as PracticeState['notationView']
    player?.setNotationView(nextNotationView)
    setState({ notationView: nextNotationView })
  })

  playToggle?.addEventListener('click', () => {
    if (!player) return
    player.setCountInEnabled(state.countInEnabled, state.countInVolume)
    player.setMetronomeEnabled(state.metronomeEnabled, state.metronomeVolume)
    player.togglePlay()
  })

  stopButton?.addEventListener('click', () => {
    player?.stop()
    if (state.loopStart) {
      player?.seekToTick(state.loopStart.tick)
    } else {
      player?.seekToTick(0)
    }
    document.querySelector('.alpha-container')?.scrollTo({ top: 0, behavior: 'smooth' })
  })

  setLoopStart?.addEventListener('change', (event) => {
    const mode = (event.currentTarget as HTMLSelectElement).value
    setState({ interactionMode: mode === 'set' ? 'setLoopStart' : 'normal' })
  })

  setLoopEnd?.addEventListener('change', (event) => {
    const mode = (event.currentTarget as HTMLSelectElement).value
    setState({ interactionMode: mode === 'set' ? 'setLoopEnd' : 'normal' })
  })

  toggleLoop?.addEventListener('click', () => {
    const nextLooping = !state.isLooping
    player?.setLoopEnabled(nextLooping)
    setState({ isLooping: nextLooping })
  })

  clearLoop?.addEventListener('click', () => {
    highlightedStartBeat = null
    highlightedEndBeat = null
    player?.clearLoopRange()
    setState({
      loopStart: null,
      loopEnd: null,
      isLooping: false,
      interactionMode: 'normal',
    })
  })

  countInToggle?.addEventListener('click', () => {
    const enabled = !state.countInEnabled
    player?.setCountInEnabled(enabled, state.countInVolume)
    setState({ countInEnabled: enabled })
  })

  metronomeToggle?.addEventListener('click', () => {
    const enabled = !state.metronomeEnabled
    player?.setMetronomeEnabled(enabled, state.metronomeVolume)
    setState({ metronomeEnabled: enabled })
  })

  trackSelect?.addEventListener('change', (event) => {
    if (!currentScore || !player) return

    const value = (event.currentTarget as HTMLSelectElement).value
    if (value === 'all') {
      currentTracks = currentScore.tracks
      player.renderTracks(currentTracks)
      setState({
        selectedTrackIndexes: currentTracks.map((track: Track) => track.index),
        statusText: 'Rendering all tracks together.',
      })
      return
    }

    const trackIndex = Number(value)
    const track = currentScore.tracks[trackIndex]
    if (!track) return

    currentTracks = [track]
    player.renderTracks(currentTracks)
    setState({
      selectedTrackIndexes: [trackIndex],
      statusText: `Rendering ${normalizeLabel(track.name || track.shortName, `Track ${track.index + 1}`)}.`,
    })
  })

  const mp3FileInput = document.querySelector<HTMLInputElement>('#mp3-file-input')
  const mp3Toggle = document.querySelector<HTMLButtonElement>('#mp3-toggle')
  const audioTimeline = document.querySelector<HTMLElement>('#audio-timeline')

  mp3FileInput?.addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    await loadMp3File(file)
    input.value = ''
  })

  mp3Toggle?.addEventListener('click', () => {
    setState({ waveformVisible: !state.waveformVisible })
  })

  const toggleSyncEditor = document.querySelector<HTMLButtonElement>('#toggle-sync-editor')
  toggleSyncEditor?.addEventListener('click', () => {
    const willBeVisible = !state.syncPointEditorVisible
    if (!willBeVisible) {
      highlightedSyncPointBeat = null
      player?.clearHighlightedRange()
    }
    setState({
      syncPointEditorVisible: willBeVisible,
      selectedSyncPointIndex: willBeVisible ? state.selectedSyncPointIndex : null,
    })
  })

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    if (target.closest('#add-sync-point')) {
      addSyncPoint()
      return
    }

    if (target.closest('#clear-sync-points-editor')) {
      syncManager?.clear()
      highlightedSyncPointBeat = null
      player?.clearHighlightedRange()
      setState({
        syncPoints: [],
        syncPointPendingBar: null,
        selectedSyncPointIndex: null,
        statusText: 'Sync points cleared.',
      })
      refreshSyncMarkers([])
      ensureCorrectPlaybackMode()
      return
    }

    if (target.closest('.sync-point-item') && !target.closest('.sync-point-delete')) {
      const item = target.closest('.sync-point-item') as HTMLElement
      const index = Number(item.dataset.index)
      if (!isNaN(index)) {
        selectSyncPoint(index)
      }
      return
    }

    if (target.closest('.sync-point-delete')) {
      const btn = target.closest('.sync-point-delete') as HTMLElement
      const index = Number(btn.dataset.index)
      if (!isNaN(index)) {
        deleteSyncPointByIndex(index)
      }
      return
    }

    if (target.closest('#nudge-audio-back')) {
      nudgeAudioPosition(-100)
      return
    }

    if (target.closest('#nudge-audio-forward')) {
      nudgeAudioPosition(100)
      return
    }

    if (target.closest('#nudge-bar-back')) {
      nudgeScoreByBar(-1)
      return
    }

    if (target.closest('#nudge-bar-forward')) {
      nudgeScoreByBar(1)
      return
    }

    if (target.closest('#nudge-beat-back')) {
      nudgeScoreByBeat(-1)
      return
    }

    if (target.closest('#nudge-beat-forward')) {
      nudgeScoreByBeat(1)
      return
    }

    if (target.closest('#nudge-tick-back')) {
      nudgeScorePosition(-1)
      return
    }

    if (target.closest('#nudge-tick-forward')) {
      nudgeScorePosition(1)
      return
    }

    if (target.closest('#preview-1s')) {
      previewSyncPoint(1000)
      return
    }

    if (target.closest('#preview-2s')) {
      previewSyncPoint(2000)
      return
    }

    if (target.closest('#preview-stop')) {
      stopPreview()
      return
    }
  })

  if (audioTimeline) {
    let isDragging = false

    const seekFromMouse = (e: MouseEvent) => {
      const seconds = getTimelinePositionFromEvent(e, audioTimeline)
      seekAudioTo(seconds)
    }

    audioTimeline.addEventListener('mousedown', (e) => {
      if (!wavesurfer || !state.mp3Loaded) return
      isDragging = true
      seekFromMouse(e)
    })

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      seekFromMouse(e)
    })

    document.addEventListener('mouseup', () => {
      isDragging = false
    })

    audioTimeline.addEventListener('keydown', (e) => {
      if (!wavesurfer || !state.mp3Loaded) return
      const step = e.shiftKey ? 1000 : 100
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekAudioByOffset(-step)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekAudioByOffset(step)
      } else if (e.key === ' ') {
        e.preventDefault()
        if (wavesurfer.paused) {
          wavesurfer.play()
        } else {
          wavesurfer.pause()
        }
        syncWaveformUi()
      }
    })
  }

  document.addEventListener('keydown', (e) => {
    if (state.interactionMode !== 'editSyncPoint' || state.selectedSyncPointIndex === null) return
    if (!e.ctrlKey && !e.metaKey) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nudgeAudioPosition(-100)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      nudgeAudioPosition(100)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nudgeScorePosition(1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      nudgeScorePosition(-1)
    }
  })
}

const handleBeatSelection = (beat: Beat) => {
  if (!player) return

  if (state.interactionMode === 'setSyncPoint') {
    if (!wavesurfer || !syncManager) return
    const barIndex = beat.voice.bar.index
    const barDuration = beat.voice.bar.calculateDuration()
    const barPosition = barDuration > 0 ? beat.playbackStart / barDuration : 0
    const millisecondOffset = wavesurfer.currentTime * 1000
    syncManager.addPoint(barIndex, millisecondOffset, barPosition)
    const points = syncManager.getPoints()

    if (state.playbackMode === 'mp3' && player) {
      player.applySyncPoints(points)
    }

    const beatLabel = barPosition > 0
      ? `Bar ${barIndex + 1}, beat ${Math.floor(barPosition * 4) + 1}`
      : `Bar ${barIndex + 1}`

    setState({
      syncPoints: points,
      statusText: `Sync point set: ${beatLabel} → ${formatMillis(millisecondOffset)}. Keep clicking or exit sync mode.`,
    })

    refreshSyncMarkers(points)
    ensureCorrectPlaybackMode()
    return
  }

  if (state.interactionMode === 'setLoopStart') {
    const nextLoopEnd = state.loopEnd
    if (nextLoopEnd && highlightedEndBeat) {
      const clickedBar = beat.voice.bar.index
      const endBar = nextLoopEnd.barIndex
      if (clickedBar > endBar) {
        highlightedStartBeat = getBarFirstBeat(highlightedEndBeat)
        highlightedEndBeat = getBarLastBeat(beat)
        const loopStart = getBarStartLoopPoint(highlightedStartBeat)
        const loopEnd = getBarEndLoopPoint(beat)
        player.highlightRange(highlightedStartBeat, highlightedEndBeat)
        player.setLoopRange(loopStart.tick, loopEnd.tick)
        setState({
          loopStart,
          loopEnd,
          interactionMode: 'normal',
          statusText: `Range start set to bar ${loopStart.barIndex + 1}.`,
        })
      } else {
        highlightedStartBeat = getBarFirstBeat(beat)
        const loopStart = getBarStartLoopPoint(beat)
        player.highlightRange(highlightedStartBeat, highlightedEndBeat)
        player.setLoopRange(loopStart.tick, nextLoopEnd.tick)
        setState({
          loopStart,
          loopEnd: nextLoopEnd,
          interactionMode: 'normal',
          statusText: `Range start set to bar ${loopStart.barIndex + 1}.`,
        })
      }
    } else {
      highlightedStartBeat = getBarFirstBeat(beat)
      player.highlightRange(highlightedStartBeat, getBarLastBeat(beat))
      setState({
        loopStart: getBarStartLoopPoint(beat),
        interactionMode: 'normal',
        statusText: `Range start set to bar ${beat.voice.bar.index + 1}.`,
      })
    }
    return
  }

  if (state.interactionMode === 'setLoopEnd') {
    const nextLoopStart = state.loopStart
    if (nextLoopStart && highlightedStartBeat) {
      const clickedBar = beat.voice.bar.index
      const startBar = nextLoopStart.barIndex
      if (clickedBar < startBar) {
        highlightedEndBeat = getBarLastBeat(highlightedStartBeat)
        highlightedStartBeat = getBarFirstBeat(beat)
        const loopStart = getBarStartLoopPoint(beat)
        const loopEnd = getBarEndLoopPoint(highlightedEndBeat)
        player.highlightRange(highlightedStartBeat, highlightedEndBeat)
        player.setLoopRange(loopStart.tick, loopEnd.tick)
        setState({
          loopStart,
          loopEnd,
          interactionMode: 'normal',
          statusText: `Range end set to bar ${loopEnd.barIndex + 1}.`,
        })
      } else {
        highlightedEndBeat = getBarLastBeat(beat)
        const loopEnd = getBarEndLoopPoint(beat)
        player.highlightRange(highlightedStartBeat, highlightedEndBeat)
        player.setLoopRange(nextLoopStart.tick, loopEnd.tick)
        setState({
          loopStart: nextLoopStart,
          loopEnd,
          interactionMode: 'normal',
          statusText: `Range end set to bar ${loopEnd.barIndex + 1}.`,
        })
      }
    } else {
      highlightedEndBeat = getBarLastBeat(beat)
      player.highlightRange(getBarFirstBeat(beat), highlightedEndBeat)
      setState({
        loopEnd: getBarEndLoopPoint(beat),
        interactionMode: 'normal',
        statusText: `Range end set to bar ${beat.voice.bar.index + 1}.`,
      })
    }
    return
  }

  const barStart = getBarStartLoopPoint(beat)
  player.seekToTick(barStart.tick)
  setState({ statusText: `Moved playback to bar ${barStart.barIndex + 1}.` })
}

app.innerHTML = renderLayout(state, [])

const alphaContainer = document.querySelector<HTMLElement>('#alphaTab')
if (!alphaContainer) {
  throw new Error('The score container was not found.')
}

const makePlayerCallbacks = () => ({
  onScoreLoaded: (score: Score) => {
    currentScore = score
    currentTracks = [score.tracks[0]]
    player?.clearLoopRange()
    const firstBeat = score.tracks[0].staves[0].bars[0].voices[0].beats[0]
    if (firstBeat) {
      player?.highlightRange(firstBeat, firstBeat)
    }
    player?.renderTracks(currentTracks)

    let restoredSyncPoints: SyncPoint[] = []
    const loadedFile = pendingFile
    pendingFile = null
    if (loadedFile && !syncManager) {
      syncManager = new SyncManager(loadedFile.name)
      restoredSyncPoints = syncManager.getPoints()
    }

    const trackStates = score.tracks.map((track) => ({
      trackIndex: track.index,
      mute: track.playbackInfo.isMute,
      solo: track.playbackInfo.isSolo,
    }))

    setState((current) => ({
      ...current,
      isLoaded: true,
      fileName: loadedFile?.name ?? current.fileName,
      songTitle: normalizeLabel(score.title, loadedFile?.name || 'Untitled song'),
      endTimeMs: player?.api.endTime ?? 0,
      trackStates,
      selectedTrackIndexes: [score.tracks[0].index],
      syncPoints: restoredSyncPoints.length > 0 ? restoredSyncPoints : current.syncPoints,
      statusText: 'Ready to play.',
      errorText: null,
    }))

    if (state.syncPoints.length > 0 && player?.playerMode === PlayerMode.EnabledExternalMedia) {
      player.applySyncPoints(state.syncPoints)
    }

    player?.setPlaybackSpeed(state.playbackSpeed)
    player?.setZoom(state.zoom)
    player?.setNotationView(state.notationView)
    player?.setCountInEnabled(state.countInEnabled, state.countInVolume)
    player?.setMetronomeEnabled(state.metronomeEnabled, state.metronomeVolume)
  },
  onPlayerPositionChanged: (args: { currentTime: number; endTime: number; currentTick: number }) => {
    state = { ...state, currentTimeMs: args.currentTime, endTimeMs: args.endTime, currentBeatTick: args.currentTick }
    const toolbarTime = document.querySelector<HTMLElement>('#toolbar-time')
    if (toolbarTime) toolbarTime.textContent = `${formatMillis(state.currentTimeMs)} / ${formatMillis(state.endTimeMs)}`
  },
  onPlayingStateChanged: (isPlaying: boolean) => {
    setState({ isPlaying, statusText: isPlaying ? 'Playback running.' : state.statusText })
  },
  onActiveBeatsChanged: (beats: Beat[]) => {
    const firstBeat = beats[0]
    if (!firstBeat) return
    state = { ...state, currentBarIndex: firstBeat.voice.bar.index }
  },
  onBeatMouseDown: (beat: Beat) => {
    handleBeatSelection(beat)
  },
  onError: (message: string) => {
    setState({
      errorText: message,
      statusText: 'alphaTab reported an error.',
    })
  },
  onRenderFinished: () => {
    syncTrackMixer()
    applyLoopRangeToPlayer()
    if (!highlightedStartBeat && !highlightedEndBeat && !highlightedSyncPointBeat) {
      player?.clearHighlightedRange()
    }
    if (shouldResetViewport) {
      shouldResetViewport = false
      player?.resetViewport()
    }
  },
})

const switchPlaybackMode = (mode: PlaybackMode) => {
  if (state.playbackMode === mode) return

  player?.stop()
  player?.destroy()
  player = null

  const playerMode = mode === 'mp3' ? PlayerMode.EnabledExternalMedia : PlayerMode.EnabledAutomatic

  try {
    player = new PracticePlayer(alphaContainer, makePlayerCallbacks(), playerMode)

    if (mode === 'mp3' && wavesurfer) {
      const output = player.getExternalMediaOutput()
      output.handler = new AudioMediaHandler(wavesurfer)
    }

    setState({ playbackMode: mode })

    if (loadedGpBuffer) {
      shouldResetViewport = true
      player.api.load(loadedGpBuffer)
    }
  } catch (error) {
    setState({
      errorText: error instanceof Error ? error.message : 'Mode switch failed.',
      statusText: 'Failed to switch playback mode.',
    })
  }
}

const ensureCorrectPlaybackMode = () => {
  const wantMp3 = state.mp3Loaded && state.syncPoints.length > 0 && loadedGpBuffer !== null
  if (wantMp3 && state.playbackMode === 'gp') {
    switchPlaybackMode('mp3')
  } else if (!wantMp3 && state.playbackMode === 'mp3') {
    switchPlaybackMode('gp')
  }
}

const loadMp3File = async (file: File) => {
  if (wavesurfer) {
    wavesurfer.pause()
    wavesurfer.removeAttribute('src')
    wavesurfer.load()
  } else {
    wavesurfer = new Audio()
  }

  const url = URL.createObjectURL(file)
  wavesurfer.src = url

  await new Promise<void>((resolve, reject) => {
    wavesurfer!.addEventListener('canplaythrough', () => resolve(), { once: true })
    wavesurfer!.addEventListener('error', () => reject(new Error('Failed to load audio file.')), { once: true })
  })

  URL.revokeObjectURL(url)

  wavesurfer.addEventListener('timeupdate', () => {
    if (state.playbackMode === 'mp3' && player && wavesurfer) {
      const isEditingPaused = state.interactionMode === 'editSyncPoint' && wavesurfer.paused
      if (!isEditingPaused) {
        player.getExternalMediaOutput().updatePosition(wavesurfer.currentTime * 1000)
      }
    }
    updateTimelineScrubber()
  })

  setState({
    mp3FileName: file.name,
    mp3Loaded: true,
    statusText: 'MP3 loaded. Scrub to find positions, then click bars in the score to set sync points.',
  })

  updateTimelineEndLabel()

  if (syncManager) {
    const points = syncManager.getPoints()
    if (points.length > 0) {
      setState({ syncPoints: points })
      refreshSyncMarkers(points)
      ensureCorrectPlaybackMode()
    }
  }
}

const updateTimelineScrubber = () => {
  if (!wavesurfer) return
  const duration = wavesurfer.duration || 0
  if (duration <= 0) return

  const pct = (wavesurfer.currentTime / duration) * 100
  const progress = document.querySelector<HTMLElement>('#audio-timeline-progress')
  const playhead = document.querySelector<HTMLElement>('#audio-timeline-playhead')
  const timeDisplay = document.querySelector<HTMLElement>('#audio-sync-time')

  if (progress) progress.style.width = `${pct}%`
  if (playhead) playhead.style.left = `${pct}%`
  if (timeDisplay) {
    timeDisplay.textContent = `${formatMillis(wavesurfer.currentTime * 1000)} / ${formatMillis(duration * 1000)}`
  }
}

const updateTimelineEndLabel = () => {
  if (!wavesurfer) return
  const endLabel = document.querySelector<HTMLElement>('#audio-timeline-end')
  if (endLabel) endLabel.textContent = formatMillis((wavesurfer.duration || 0) * 1000)
}

const seekAudioTo = (seconds: number) => {
  if (!wavesurfer) return
  wavesurfer.currentTime = Math.max(0, Math.min(seconds, wavesurfer.duration || 0))
  updateTimelineScrubber()
}

const seekAudioByOffset = (offsetMs: number) => {
  if (!wavesurfer) return
  seekAudioTo(wavesurfer.currentTime + offsetMs / 1000)
}

const getTimelinePositionFromEvent = (e: MouseEvent, timeline: HTMLElement): number => {
  const rect = timeline.querySelector('.audio-timeline-track')?.getBoundingClientRect()
  if (!rect || !wavesurfer) return 0
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  return (x / rect.width) * (wavesurfer.duration || 0)
}

const refreshSyncMarkers = (points: SyncPoint[]) => {
  const timeline = document.querySelector<HTMLElement>('#audio-timeline')
  if (!timeline) return
  const durationMs = (wavesurfer?.duration || 0) * 1000
  updateSyncMarkerPositions(timeline, points, durationMs, state.selectedSyncPointIndex, selectSyncPoint)
}

const highlightSyncPointOnScore = (barIndex: number, barPosition: number) => {
  if (!currentScore || !player || currentTracks.length === 0) return
  const bar = currentScore.masterBars[barIndex]
  if (!bar) return
  const staff = currentTracks[0].staves[0]
  if (!staff) return
  const barStaff = staff.bars[barIndex]
  if (!barStaff || barStaff.voices.length === 0) return
  const voice = barStaff.voices[0]
  if (voice.beats.length === 0) return

  const barDuration = bar.calculateDuration()
  const targetTick = bar.start + barPosition * barDuration
  let closestBeat = voice.beats[0]
  let minDiff = Math.abs(closestBeat.absolutePlaybackStart - targetTick)
  for (const beat of voice.beats) {
    const diff = Math.abs(beat.absolutePlaybackStart - targetTick)
    if (diff < minDiff) {
      minDiff = diff
      closestBeat = beat
    }
  }

  highlightedSyncPointBeat = closestBeat
  player.highlightRange(closestBeat, closestBeat)
}

const selectSyncPoint = (index: number) => {
  if (!syncManager || !currentScore || !player) return
  const point = syncManager.getPointByIndex(index)
  if (!point) return

  setState({
    selectedSyncPointIndex: index,
    syncPointEditorVisible: true,
    interactionMode: 'editSyncPoint',
  })

  const tick = barPositionToTick(currentScore, point.barIndex, point.barPosition)
  player.seekToTick(tick)

  if (wavesurfer) {
    seekAudioTo(point.millisecondOffset / 1000)
  }

  highlightSyncPointOnScore(point.barIndex, point.barPosition)

  refreshSyncMarkers(state.syncPoints)
}

const addSyncPoint = () => {
  if (!syncManager || !wavesurfer || !currentScore || !player) return
  if (state.syncPoints.length >= 10) return

  const currentTick = state.currentBeatTick ?? 0
  const barPos = tickToBarPosition(currentScore, currentTick)
  if (!barPos) return

  const millisecondOffset = wavesurfer.currentTime * 1000
  syncManager.addPoint(barPos.barIndex, millisecondOffset, barPos.barPosition)
  const points = syncManager.getPoints()

  if (state.playbackMode === 'mp3' && player) {
    player.applySyncPoints(points)
  }

  const newIndex = points.findIndex(
    (p) => p.barIndex === barPos.barIndex && p.millisecondOffset === millisecondOffset,
  )

  setState({
    syncPoints: points,
    selectedSyncPointIndex: newIndex >= 0 ? newIndex : null,
    syncPointEditorVisible: true,
    interactionMode: 'editSyncPoint',
    statusText: `Sync point added at ${formatTick(currentScore, currentTick)}`,
  })

  refreshSyncMarkers(points)
  ensureCorrectPlaybackMode()
}

const deleteSyncPointByIndex = (index: number) => {
  if (!syncManager) return
  syncManager.removePointByIndex(index)
  const points = syncManager.getPoints()

  if (state.playbackMode === 'mp3' && player) {
    player.applySyncPoints(points)
  }

  highlightedSyncPointBeat = null
  player?.clearHighlightedRange()

  setState({
    syncPoints: points,
    selectedSyncPointIndex: null,
    statusText: `Sync point #${index + 1} removed.`,
  })

  refreshSyncMarkers(points)
  ensureCorrectPlaybackMode()
}

const nudgeAudioPosition = (deltaMs: number) => {
  if (!syncManager || !currentScore || state.selectedSyncPointIndex === null) return
  const point = syncManager.getPointByIndex(state.selectedSyncPointIndex)
  if (!point) return

  const newOffset = Math.max(0, point.millisecondOffset + deltaMs)
  syncManager.updatePoint(state.selectedSyncPointIndex, { millisecondOffset: newOffset })
  const points = syncManager.getPoints()

  if (state.playbackMode === 'mp3' && player) {
    player.applySyncPoints(points)
  }

  setState({ syncPoints: points })

  if (wavesurfer) {
    seekAudioTo(newOffset / 1000)
  }

  refreshSyncMarkers(points)
}

const nudgeScorePosition = (deltaTicks: number) => {
  if (!syncManager || !currentScore || state.selectedSyncPointIndex === null) return
  const point = syncManager.getPointByIndex(state.selectedSyncPointIndex)
  if (!point) return

  const currentTick = barPositionToTick(currentScore, point.barIndex, point.barPosition)
  const newTick = Math.max(0, currentTick + deltaTicks)
  const newBarPos = tickToBarPosition(currentScore, newTick)
  if (!newBarPos) return

  syncManager.updatePoint(state.selectedSyncPointIndex, {
    barIndex: newBarPos.barIndex,
    barPosition: newBarPos.barPosition,
  })
  const points = syncManager.getPoints()

  if (state.playbackMode === 'mp3' && player) {
    player.applySyncPoints(points)
  }

  setState({ syncPoints: points })
  player?.seekToTick(newTick)
  if (wavesurfer) seekAudioTo(point.millisecondOffset / 1000)
  highlightSyncPointOnScore(newBarPos.barIndex, newBarPos.barPosition)
  refreshSyncMarkers(points)
}

const nudgeScoreByBar = (deltaBar: number) => {
  if (!syncManager || !currentScore || state.selectedSyncPointIndex === null) return
  const point = syncManager.getPointByIndex(state.selectedSyncPointIndex)
  if (!point) return

  const targetBarIndex = Math.max(0, Math.min(currentScore.masterBars.length - 1, point.barIndex + deltaBar))
  const targetBar = currentScore.masterBars[targetBarIndex]
  if (!targetBar) return

  syncManager.updatePoint(state.selectedSyncPointIndex, {
    barIndex: targetBarIndex,
    barPosition: 0,
  })
  const points = syncManager.getPoints()

  if (state.playbackMode === 'mp3' && player) {
    player.applySyncPoints(points)
  }

  setState({ syncPoints: points })
  player?.seekToTick(targetBar.start)
  if (wavesurfer) seekAudioTo(point.millisecondOffset / 1000)
  highlightSyncPointOnScore(targetBarIndex, 0)
  refreshSyncMarkers(points)
}

const nudgeScoreByBeat = (deltaBeat: number) => {
  if (!syncManager || !currentScore || state.selectedSyncPointIndex === null) return
  const point = syncManager.getPointByIndex(state.selectedSyncPointIndex)
  if (!point) return

  const currentBar = currentScore.masterBars[point.barIndex]
  if (!currentBar) return

  const barDuration = currentBar.calculateDuration()
  const beatsInBar = currentBar.timeSignatureNumerator
  const ticksPerBeat = barDuration / beatsInBar

  const currentTick = barPositionToTick(currentScore, point.barIndex, point.barPosition)
  const newTick = Math.max(0, currentTick + deltaBeat * ticksPerBeat)
  const newBarPos = tickToBarPosition(currentScore, newTick)
  if (!newBarPos) return

  syncManager.updatePoint(state.selectedSyncPointIndex, {
    barIndex: newBarPos.barIndex,
    barPosition: newBarPos.barPosition,
  })
  const points = syncManager.getPoints()

  if (state.playbackMode === 'mp3' && player) {
    player.applySyncPoints(points)
  }

  setState({ syncPoints: points })
  player?.seekToTick(newTick)
  if (wavesurfer) seekAudioTo(point.millisecondOffset / 1000)
  highlightSyncPointOnScore(newBarPos.barIndex, newBarPos.barPosition)
  refreshSyncMarkers(points)
}

const stopPreview = () => {
  if (!wavesurfer) return

  if (previewLoopTimeout !== null) {
    clearTimeout(previewLoopTimeout)
    previewLoopTimeout = null
  }

  wavesurfer.pause()

  if (syncManager && state.selectedSyncPointIndex !== null) {
    const point = syncManager.getPointByIndex(state.selectedSyncPointIndex)
    if (point) {
      seekAudioTo(point.millisecondOffset / 1000)
    }
  }

  setState({ syncPointPreviewLooping: false })
}

let previewDurationMs = 1000

const previewSyncPoint = (durationMs: number) => {
  if (!wavesurfer || !currentScore || !player || state.selectedSyncPointIndex === null) return
  const point = syncManager?.getPointByIndex(state.selectedSyncPointIndex)
  if (!point) return

  if (previewLoopTimeout !== null) {
    clearTimeout(previewLoopTimeout)
    previewLoopTimeout = null
  }
  wavesurfer.pause()

  previewDurationMs = durationMs
  state = { ...state, syncPointPreviewLooping: true }

  const tick = barPositionToTick(currentScore, point.barIndex, point.barPosition)
  player.seekToTick(tick)
  seekAudioTo(point.millisecondOffset / 1000)
  wavesurfer.play().catch(() => {})

  const scheduleNext = () => {
    previewLoopTimeout = window.setTimeout(() => {
      if (!state.syncPointPreviewLooping || !wavesurfer || !currentScore || !player) return
      const p = syncManager?.getPointByIndex(state.selectedSyncPointIndex!)
      if (!p) return
      wavesurfer.pause()
      const t = barPositionToTick(currentScore, p.barIndex, p.barPosition)
      player.seekToTick(t)
      seekAudioTo(p.millisecondOffset / 1000)
      wavesurfer.play().catch(() => {})
      scheduleNext()
    }, previewDurationMs)
  }

  scheduleNext()
}


try {
  player = new PracticePlayer(alphaContainer, makePlayerCallbacks())
} catch (error) {
  setState({
    errorText: error instanceof Error ? error.message : 'Practice player initialization failed.',
    statusText: 'The score engine failed to start.',
  })
}

bindUi()
syncUi()
