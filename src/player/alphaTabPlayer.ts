import {
  AlphaTabApi,
  LayoutMode,
  PlayerMode,
  StaveProfile,
  type IEventEmitterOfT,
  type model,
} from '@coderline/alphatab'

type Beat = model.Beat
type Score = model.Score
type Track = model.Track

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

const soundFontUrl = '/alphatab/soundfont/sonivox.sf2'
const fontDirectory = '/alphatab/font/'

export class PracticePlayer {
  readonly api: AlphaTabApi

  constructor(container: HTMLElement, callbacks: PlayerCallbacks) {
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
        staveProfile: StaveProfile.Tab,
        scale: 1,
      },
      player: {
        enableCursor: true,
        enableElementHighlighting: true,
        enableAnimatedBeatCursor: false,
        enableUserInteraction: false,
        scrollMode: 1,
        scrollSpeed: 200,
        soundFont: soundFontUrl,
        playerMode: PlayerMode.EnabledAutomatic,
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
  }

  setCountInEnabled(enabled: boolean, volume = 0.75) {
    this.api.countInVolume = enabled ? volume : 0
  }

  togglePlay() {
    this.api.playPause()
  }

  stop() {
    this.api.stop()
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

  destroy() {
    this.api.destroy()
  }
}
