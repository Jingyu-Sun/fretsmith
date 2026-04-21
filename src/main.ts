import './styles/app.css'

import type { model } from '@coderline/alphatab'

type Beat = model.Beat
type Score = model.Score
type Track = model.Track

import { PracticePlayer } from './player/alphaTabPlayer'
import {
  defaultPracticeState,
  formatMillis,
  hasLoopRange,
  type PracticeState,
} from './state/practiceState'
import { renderLayout } from './ui/layout'
import { getBeatLoopPoint, orderLoopPoints } from './ui/loopSelection'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('The app root was not found.')
}

let state = defaultPracticeState()
let currentScore: Score | null = null
let currentTracks: Track[] = []
let highlightedStartBeat: Beat | null = null
let highlightedEndBeat: Beat | null = null
let player: PracticePlayer | null = null
let pendingFile: File | null = null

const setState = (updater: Partial<PracticeState> | ((current: PracticeState) => PracticeState)) => {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater }
  syncUi()
}

const normalizeLabel = (value: string | null | undefined, fallback: string) => {
  const text = value?.trim()
  if (!text) return fallback
  return /�|\?{2,}/.test(text) ? fallback : text
}

const setDebugText = (debugText: string | null) => {
  setState({ debugText })
}

const updateLoopDetails = () => {
  const loopStartSelect = document.querySelector<HTMLSelectElement>('#set-loop-start')
  const loopEndSelect = document.querySelector<HTMLSelectElement>('#set-loop-end')
  const toggleLoop = document.querySelector<HTMLButtonElement>('#toggle-loop')
  const clearLoop = document.querySelector<HTMLButtonElement>('#clear-loop')

  if (loopStartSelect) {
    loopStartSelect.options[0].text = state.loopStart ? `Bar ${state.loopStart.barIndex + 1}` : 'Pick on score'
    loopStartSelect.value = state.interactionMode === 'setLoopStart' ? 'set' : 'normal'
  }

  if (loopEndSelect) {
    loopEndSelect.options[0].text = state.loopEnd ? `Bar ${state.loopEnd.barIndex + 1}` : 'Pick on score'
    loopEndSelect.value = state.interactionMode === 'setLoopEnd' ? 'set' : 'normal'
  }

  if (toggleLoop) {
    toggleLoop.disabled = !hasLoopRange(state)
    toggleLoop.textContent = state.isLooping ? 'Loop on' : 'Loop off'
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

const syncTrackMixer = () => {
  const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')
  if (!trackSelect || !currentScore) return

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
  const statusText = document.querySelector<HTMLElement>('#status-text')
  const debugText = document.querySelector<HTMLElement>('#debug-text')
  const playbackTime = document.querySelector<HTMLElement>('#playback-time')
  const toolbarTime = document.querySelector<HTMLElement>('#toolbar-time')
  const playToggle = document.querySelector<HTMLButtonElement>('#play-toggle')
  const stopButton = document.querySelector<HTMLButtonElement>('#stop-button')
  const tempoSelect = document.querySelector<HTMLSelectElement>('#tempo-select')
  const zoomSelect = document.querySelector<HTMLSelectElement>('#zoom-select')
  const countInToggle = document.querySelector<HTMLInputElement>('#count-in-toggle')
  const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')

  if (statusText) statusText.textContent = state.errorText ?? state.statusText
  if (debugText) {
    debugText.textContent = state.debugText ?? ''
    debugText.classList.toggle('is-visible', Boolean(state.debugText))
  }
  if (playbackTime) playbackTime.textContent = `${formatMillis(state.currentTimeMs)} / ${formatMillis(state.endTimeMs)}`
  if (toolbarTime) toolbarTime.textContent = `${formatMillis(state.currentTimeMs)} / ${formatMillis(state.endTimeMs)}`
  if (playToggle) {
    playToggle.disabled = !state.isLoaded
    playToggle.textContent = state.isPlaying ? 'Pause' : 'Play'
  }
  if (stopButton) stopButton.disabled = !state.isLoaded
  if (tempoSelect) tempoSelect.value = String(state.playbackSpeed)
  if (zoomSelect) zoomSelect.value = String(state.zoom)
  if (countInToggle) countInToggle.checked = state.countInEnabled
  if (trackSelect) trackSelect.disabled = !currentScore

  updateLoopDetails()
  syncTrackMixer()
}

const bindUi = () => {
  const fileInput = document.querySelector<HTMLInputElement>('#file-input')
  const tempoSelect = document.querySelector<HTMLSelectElement>('#tempo-select')
  const zoomSelect = document.querySelector<HTMLSelectElement>('#zoom-select')
  const playToggle = document.querySelector<HTMLButtonElement>('#play-toggle')
  const stopButton = document.querySelector<HTMLButtonElement>('#stop-button')
  const setLoopStart = document.querySelector<HTMLSelectElement>('#set-loop-start')
  const setLoopEnd = document.querySelector<HTMLSelectElement>('#set-loop-end')
  const toggleLoop = document.querySelector<HTMLButtonElement>('#toggle-loop')
  const clearLoop = document.querySelector<HTMLButtonElement>('#clear-loop')
  const countInToggle = document.querySelector<HTMLInputElement>('#count-in-toggle')
  const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')

  fileInput?.addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
      setDebugText('File picker closed without selecting a file.')
      return
    }

    if (!player) {
      setDebugText('PracticePlayer was not initialized, so the selected file cannot be loaded.')
      return
    }

    pendingFile = file
    highlightedStartBeat = null
    highlightedEndBeat = null
    currentScore = null
    currentTracks = []
    setState({
      ...defaultPracticeState(),
      fileName: file.name,
      songTitle: file.name,
      statusText: 'Loading Guitar Pro file…',
      debugText: `Selected ${file.name} (${file.size} bytes). Waiting for alphaTab to parse the file.`,
    })

    try {
      await player.loadFile(file)
      setDebugText(`alphaTab accepted ${file.name}. Waiting for scoreLoaded/renderFinished callbacks.`)
    } catch (error) {
      setState((current) => ({
        ...current,
        errorText: error instanceof Error ? error.message : 'Unable to load this file.',
        statusText: 'Choose another file or verify the format is supported.',
        debugText: error instanceof Error ? `loadFile threw: ${error.message}` : 'loadFile threw a non-Error value.',
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

  playToggle?.addEventListener('click', () => {
    if (!player) return
    if (state.countInEnabled) {
      player.setCountInEnabled(true, state.countInVolume)
    }
    player.togglePlay()
  })

  stopButton?.addEventListener('click', () => {
    player?.stop()
    if (state.loopStart) {
      player?.seekToTick(state.loopStart.tick)
    }
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
    if (!hasLoopRange(state)) return
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

  countInToggle?.addEventListener('change', (event) => {
    const enabled = (event.currentTarget as HTMLInputElement).checked
    player?.setCountInEnabled(enabled, state.countInVolume)
    setState({ countInEnabled: enabled })
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
}

const handleBeatSelection = (beat: Beat) => {
  if (!player) return

  const nextPoint = getBeatLoopPoint(beat)

  if (state.interactionMode === 'setLoopStart') {
    highlightedStartBeat = beat
    const nextLoopEnd = state.loopEnd
    if (nextLoopEnd && highlightedEndBeat) {
      const ordered = orderLoopPoints(nextPoint, nextLoopEnd)
      player.highlightRange(ordered.start.tick === nextPoint.tick ? beat : highlightedEndBeat, ordered.end.tick === nextLoopEnd.tick ? highlightedEndBeat : beat)
      player.setLoopRange(ordered.start.tick, ordered.end.tick)
      setState({
        loopStart: ordered.start,
        loopEnd: ordered.end,
        interactionMode: 'normal',
        statusText: `Loop start set to bar ${ordered.start.barIndex + 1}.`,
      })
    } else {
      player.clearHighlightedRange()
      setState({
        loopStart: nextPoint,
        interactionMode: 'normal',
        statusText: `Loop start set to bar ${nextPoint.barIndex + 1}.`,
      })
    }
    return
  }

  if (state.interactionMode === 'setLoopEnd') {
    highlightedEndBeat = beat
    const nextLoopStart = state.loopStart
    if (nextLoopStart && highlightedStartBeat) {
      const ordered = orderLoopPoints(nextLoopStart, nextPoint)
      const startBeat = ordered.start.tick === nextLoopStart.tick ? highlightedStartBeat : beat
      const endBeat = ordered.end.tick === nextPoint.tick ? beat : highlightedStartBeat
      player.highlightRange(startBeat, endBeat)
      player.setLoopRange(ordered.start.tick, ordered.end.tick)
      setState({
        loopStart: ordered.start,
        loopEnd: ordered.end,
        interactionMode: 'normal',
        statusText: `Loop end set to bar ${ordered.end.barIndex + 1}.`,
      })
    } else {
      setState({
        loopEnd: nextPoint,
        interactionMode: 'normal',
        statusText: `Loop end set to bar ${nextPoint.barIndex + 1}.`,
      })
    }
    return
  }

  player.seekToTick(nextPoint.tick)
  setState({ statusText: `Moved playback to bar ${nextPoint.barIndex + 1}.` })
}

app.innerHTML = renderLayout(state)

const alphaContainer = document.querySelector<HTMLElement>('#alphaTab')
if (!alphaContainer) {
  throw new Error('The score container was not found.')
}

try {
  player = new PracticePlayer(alphaContainer, {
  onScoreLoaded: (score: Score) => {
    currentScore = score
    currentTracks = [score.tracks[0]]
    player?.renderTracks(currentTracks)
    setDebugText(`scoreLoaded fired with ${score.tracks.length} track(s). Rendering the first track.`)

    const trackStates = score.tracks.map((track) => ({
      trackIndex: track.index,
      mute: track.playbackInfo.isMute,
      solo: track.playbackInfo.isSolo,
    }))

    setState((current) => ({
      ...current,
      isLoaded: true,
      fileName: pendingFile?.name ?? current.fileName,
      songTitle: normalizeLabel(score.title, pendingFile?.name || 'Untitled song'),
      endTimeMs: player?.api.endTime ?? 0,
      trackStates,
      selectedTrackIndexes: [score.tracks[0].index],
      statusText: 'Click play to start, or Set A / Set B to choose a loop.',
      errorText: null,
    }))

    player?.setPlaybackSpeed(state.playbackSpeed)
    player?.setZoom(state.zoom)
    player?.setCountInEnabled(state.countInEnabled, state.countInVolume)
  },
  onPlayerPositionChanged: (args: { currentTime: number; endTime: number; currentTick: number }) => {
    setState({
      currentTimeMs: args.currentTime,
      endTimeMs: args.endTime,
      currentBeatTick: args.currentTick,
    })
  },
  onPlayingStateChanged: (isPlaying: boolean) => {
    setState({ isPlaying, statusText: isPlaying ? 'Playback running.' : state.statusText })
  },
  onActiveBeatsChanged: (beats: Beat[]) => {
    const firstBeat = beats[0]
    if (!firstBeat) return
    setState({ currentBarIndex: firstBeat.voice.bar.index })
  },
  onBeatMouseDown: (beat: Beat) => {
    handleBeatSelection(beat)
  },
  onError: (message: string) => {
    setState({
      errorText: message,
      statusText: 'alphaTab reported an error.',
      debugText: `alphaTab error event: ${message}`,
    })
  },
  onRenderFinished: () => {
    setDebugText('renderFinished fired. The score should now be visible.')
    syncTrackMixer()
    applyLoopRangeToPlayer()
  },
})
} catch (error) {
  setState({
    errorText: error instanceof Error ? error.message : 'Practice player initialization failed.',
    statusText: 'The score engine failed to start.',
    debugText: error instanceof Error ? `PracticePlayer constructor failed: ${error.message}` : 'PracticePlayer constructor failed with a non-Error value.',
  })
}

bindUi()
syncUi()
