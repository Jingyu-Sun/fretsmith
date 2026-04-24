export type InteractionMode = 'normal' | 'setLoopStart' | 'setLoopEnd' | 'setSyncPoint'
export type NotationView = 'default' | 'score-tab' | 'score' | 'tab' | 'tab-mixed'
export type PlaybackMode = 'gp' | 'mp3'
export type SyncEditorMode = 'idle' | 'selected' | 'previewing'

export type LoopPoint = {
  barIndex: number
  beatIndex: number
  tick: number
}

export type TrackControlState = {
  trackIndex: number
  mute: boolean
  solo: boolean
}

export type SyncPoint = {
  barIndex: number
  barPosition: number
  barOccurence: number
  millisecondOffset: number
}

export type PracticeState = {
  fileName: string
  songTitle: string
  isLoaded: boolean
  isPlaying: boolean
  isLooping: boolean
  interactionMode: InteractionMode
  playbackMode: PlaybackMode
  playbackSpeed: number
  zoom: number
  notationView: NotationView
  currentTimeMs: number
  endTimeMs: number
  currentBarIndex: number | null
  currentBeatTick: number | null
  loopStart: LoopPoint | null
  loopEnd: LoopPoint | null
  countInEnabled: boolean
  countInVolume: number
  metronomeEnabled: boolean
  metronomeVolume: number
  selectedTrackIndexes: number[]
  trackStates: TrackControlState[]
  mp3FileName: string | null
  mp3Loaded: boolean
  syncPoints: SyncPoint[]
  syncPointPendingBar: number | null
  selectedSyncPointIndex: number | null
  syncPointEditorVisible: boolean
  syncEditorMode: SyncEditorMode
  waveformVisible: boolean
  statusText: string
  errorText: string | null
}

export const defaultPracticeState = (): PracticeState => ({
  fileName: '',
  songTitle: '',
  isLoaded: false,
  isPlaying: false,
  isLooping: false,
  interactionMode: 'normal',
  playbackMode: 'gp',
  playbackSpeed: 1,
  zoom: 1,
  notationView: 'tab',
  currentTimeMs: 0,
  endTimeMs: 0,
  currentBarIndex: null,
  currentBeatTick: null,
  loopStart: null,
  loopEnd: null,
  countInEnabled: true,
  countInVolume: 0.75,
  metronomeEnabled: false,
  metronomeVolume: 0.5,
  selectedTrackIndexes: [0],
  trackStates: [],
  mp3FileName: null,
  mp3Loaded: false,
  syncPoints: [],
  syncPointPendingBar: null,
  selectedSyncPointIndex: null,
  syncPointEditorVisible: false,
  syncEditorMode: 'idle',
  waveformVisible: false,
  statusText: 'Choose a file to render the score and enable playback.',
  errorText: null,
})

export const hasLoopRange = (state: PracticeState) =>
  Boolean(state.loopStart && state.loopEnd)

export const formatPlaybackSpeed = (speed: number) => `${speed.toFixed(2).replace(/\.00$/, '')}x`

export const formatMillis = (value: number) => {
  const totalSeconds = Math.max(0, Math.floor(value / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
