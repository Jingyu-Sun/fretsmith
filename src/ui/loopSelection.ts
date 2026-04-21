import type { model } from '@coderline/alphatab'
import type { LoopPoint } from '../state/practiceState'

type Beat = model.Beat

export const getBeatLoopPoint = (beat: Beat): LoopPoint => ({
  barIndex: beat.voice.bar.index,
  beatIndex: beat.index,
  tick: beat.absolutePlaybackStart,
})

export const getBarFirstBeat = (beat: Beat): Beat =>
  beat.voice.bar.voices[0].beats[0]

export const getBarLastBeat = (beat: Beat): Beat => {
  const beats = beat.voice.bar.voices[0].beats
  return beats[beats.length - 1]
}

export const getBarStartLoopPoint = (beat: Beat): LoopPoint => {
  const firstBeat = getBarFirstBeat(beat)
  return {
    barIndex: beat.voice.bar.index,
    beatIndex: firstBeat.index,
    tick: firstBeat.absolutePlaybackStart,
  }
}

export const getBarEndLoopPoint = (beat: Beat): LoopPoint => {
  const lastBeat = getBarLastBeat(beat)
  return {
    barIndex: beat.voice.bar.index,
    beatIndex: lastBeat.index,
    tick: lastBeat.absolutePlaybackStart + lastBeat.playbackDuration,
  }
}

export const orderLoopPoints = (a: LoopPoint, b: LoopPoint) => {
  if (a.tick <= b.tick) {
    return { start: a, end: b }
  }

  return { start: b, end: a }
}
