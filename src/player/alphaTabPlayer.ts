import {
  AlphaTabApi,
  LayoutMode,
  PlayerMode,
  StaveProfile,
  type IEventEmitterOfT,
  type model,
  type synth,
} from '@coderline/alphatab'

import type { NotationView } from '../state/practiceState'

type Beat = model.Beat
type Score = model.Score
type Track = model.Track
type FlatSyncPoint = model.FlatSyncPoint
type IExternalMediaSynthOutput = synth.IExternalMediaSynthOutput

type PositionChangedEventArgs = {
  currentTime: number
  endTime: number
  currentTick: number
}

type PlayerStateChangedEventArgs = {
  state: number
}

type PlayerCallbacks = {
  onScoreLoaded: (score: Score) => void
  onPlayerPositionChanged: (args: PositionChangedEventArgs) => void
  onPlayingStateChanged: (isPlaying: boolean) => void
  onActiveBeatsChanged: (beats: Beat[]) => void
  onBeatMouseDown: (beat: Beat) => void
  onError: (message: string) => void
  onRenderFinished: () => void
}

const soundFontUrl = `${import.meta.env.BASE_URL}alphatab/soundfont/sonivox.sf2`
const fontDirectory = `${import.meta.env.BASE_URL}alphatab/font/`

const notationViewToStaveProfile: Record<NotationView, StaveProfile> = {
  default: StaveProfile.Default,
  'score-tab': StaveProfile.ScoreTab,
  score: StaveProfile.Score,
  tab: StaveProfile.Tab,
  'tab-mixed': StaveProfile.TabMixed,
}

export class PracticePlayer {
  readonly api: AlphaTabApi
  readonly container: HTMLElement
  readonly playerMode: PlayerMode

  constructor(container: HTMLElement, callbacks: PlayerCallbacks, playerMode = PlayerMode.EnabledAutomatic) {
    this.container = container
    this.playerMode = playerMode
    const isExternalMedia = playerMode === PlayerMode.EnabledExternalMedia
    this.api = new AlphaTabApi(container, {
      core: {
        includeNoteBounds: true,
        fontDirectory,
      },
      importer: {
        encoding: 'gb18030',
      },
      display: {
        layoutMode: LayoutMode.Page,
        staveProfile: notationViewToStaveProfile.tab,
        scale: 1,
      },
      player: {
        enableCursor: true,
        enableElementHighlighting: true,
        enableAnimatedBeatCursor: false,
        enableUserInteraction: false,
        scrollElement: container.parentElement as HTMLElement,
        scrollOffsetY: -30,
        scrollMode: 1,
        scrollSpeed: 200,
        soundFont: isExternalMedia ? undefined : soundFontUrl,
        playerMode,
      },
    })

    this.api.scoreLoaded.on((score) => callbacks.onScoreLoaded(score))
    ;(this.api.playerPositionChanged as IEventEmitterOfT<PositionChangedEventArgs>).on((args) => callbacks.onPlayerPositionChanged(args))
    ;(this.api.playerStateChanged as IEventEmitterOfT<PlayerStateChangedEventArgs>).on((args) => callbacks.onPlayingStateChanged(args.state === 1))
    this.api.activeBeatsChanged.on((args) => callbacks.onActiveBeatsChanged(args.activeBeats))
    this.api.beatMouseDown.on((beat) => callbacks.onBeatMouseDown(beat))
    this.api.renderFinished.on(() => callbacks.onRenderFinished())
    this.api.error.on((error) => callbacks.onError(error.message))
  }

  loadFile(file: File, trackIndexes?: number[]) {
    return file.arrayBuffer().then((buffer) => {
      const result = this.api.load(buffer, trackIndexes)
      if (!result) {
        throw new Error('This file format could not be loaded by alphaTab.')
      }
    })
  }

  renderTracks(tracks: Track[]) {
    this.api.renderTracks(tracks)
  }

  setPlaybackSpeed(speed: number) {
    this.api.playbackSpeed = speed
  }

  setZoom(zoom: number) {
    this.api.settings.display.scale = zoom
    this.api.updateSettings()
    this.api.render()
  }

  setNotationView(view: NotationView) {
    this.api.settings.display.staveProfile = notationViewToStaveProfile[view]
    this.api.updateSettings()
    this.api.render()
  }

  setCountInEnabled(enabled: boolean, volume = 0.75) {
    this.api.countInVolume = enabled ? volume : 0
  }

  setMetronomeEnabled(enabled: boolean, volume = 0.5) {
    this.api.metronomeVolume = enabled ? volume : 0
  }

  togglePlay() {
    this.api.playPause()
  }

  stop() {
    this.api.stop()
  }

  resetViewport() {
    const scrollParent = this.container.parentElement
    const reset = () => {
      this.container.scrollTop = 0
      this.container.scrollLeft = 0
      if (scrollParent) {
        scrollParent.scrollTop = 0
        scrollParent.scrollLeft = 0
      }
      window.scrollTo(0, 0)
    }

    reset()

    const onScroll = () => reset()
    scrollParent?.addEventListener('scroll', onScroll)
    window.addEventListener('scroll', onScroll)
    setTimeout(() => {
      scrollParent?.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
    }, 1000)
  }

  getTickPosition(): number {
    return this.api.tickPosition
  }

  seekToTick(tick: number) {
    this.api.tickPosition = tick
  }

  setLoopRange(startTick: number, endTick: number) {
    this.api.playbackRange = { startTick, endTick }
  }

  clearLoopRange() {
    this.api.playbackRange = null
    this.api.clearPlaybackRangeHighlight()
  }

  setLoopEnabled(enabled: boolean) {
    this.api.isLooping = enabled
  }

  highlightRange(startBeat: Beat, endBeat: Beat) {
    this.api.highlightPlaybackRange(startBeat, endBeat)
  }

  clearHighlightedRange() {
    this.api.clearPlaybackRangeHighlight()
  }

  changeTrackSolo(track: Track, solo: boolean) {
    this.api.changeTrackSolo([track], solo)
  }

  changeTrackMute(track: Track, mute: boolean) {
    this.api.changeTrackMute([track], mute)
  }

  getExternalMediaOutput(): IExternalMediaSynthOutput {
    return this.api.player!.output as IExternalMediaSynthOutput
  }

  applySyncPoints(syncPoints: FlatSyncPoint[]) {
    const score = this.api.score
    if (!score) return
    score.applyFlatSyncPoints(syncPoints)
    this.api.updateSyncPoints()
  }

  destroy() {
    this.api.destroy()
  }
}
