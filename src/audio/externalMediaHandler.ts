import type { synth } from '@coderline/alphatab'

type IExternalMediaHandler = synth.IExternalMediaHandler

export class AudioMediaHandler implements IExternalMediaHandler {
  private audio: HTMLAudioElement

  constructor(audio: HTMLAudioElement) {
    this.audio = audio
  }

  get backingTrackDuration(): number {
    return (this.audio.duration || 0) * 1000
  }

  get playbackRate(): number {
    return this.audio.playbackRate
  }

  set playbackRate(value: number) {
    this.audio.playbackRate = value
  }

  get masterVolume(): number {
    return this.audio.volume
  }

  set masterVolume(value: number) {
    this.audio.volume = value
  }

  seekTo(time: number): void {
    if (this.audio.duration > 0) {
      this.audio.currentTime = time / 1000
    }
  }

  play(): void {
    this.audio.play()
  }

  pause(): void {
    this.audio.pause()
  }
}
