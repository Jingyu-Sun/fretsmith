import './styles/app.css'

import type { model } from '@coderline/alphatab'

type Beat = model.Beat
type Score = model.Score
type Track = model.Track

import { PracticePlayer } from './player/alphaTabPlayer'
import {
  defaultPracticeState,
  formatMillis,
  type PracticeState,
} from './state/practiceState'
import { renderLayout } from './ui/layout'
import { getBarStartLoopPoint, getBarEndLoopPoint, getBarFirstBeat, getBarLastBeat } from './ui/loopSelection'

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
let shouldResetViewport = false

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
    shouldResetViewport = true
    highlightedStartBeat = null
    highlightedEndBeat = null
    player.clearLoopRange()
    currentScore = null
    currentTracks = []
    lastTrackMixerKey = ''
    setState({
      ...defaultPracticeState(),
      fileName: file.name,
      songTitle: file.name,
      statusText: 'Loading Guitar Pro file…',
    })

    try {
      await player.loadFile(file)
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
}

const handleBeatSelection = (beat: Beat) => {
  if (!player) return

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
      player?.clearLoopRange()
      const firstBeat = score.tracks[0].staves[0].bars[0].voices[0].beats[0]
      if (firstBeat) {
        player?.highlightRange(firstBeat, firstBeat)
      }
      player?.renderTracks(currentTracks)

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
        statusText: 'Ready to play.',
        errorText: null,
      }))

      player?.setPlaybackSpeed(state.playbackSpeed)
      player?.setZoom(state.zoom)
      player?.setNotationView(state.notationView)
      player?.setCountInEnabled(state.countInEnabled, state.countInVolume)
      player?.setMetronomeEnabled(state.metronomeEnabled, state.metronomeVolume)
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
      })
    },
    onRenderFinished: () => {
      syncTrackMixer()
      applyLoopRangeToPlayer()
      if (!highlightedStartBeat && !highlightedEndBeat) {
        player?.clearHighlightedRange()
      }
      if (shouldResetViewport) {
        shouldResetViewport = false
        player?.resetViewport()
      }
    },
  })
} catch (error) {
  setState({
    errorText: error instanceof Error ? error.message : 'Practice player initialization failed.',
    statusText: 'The score engine failed to start.',
  })
}

bindUi()
syncUi()
