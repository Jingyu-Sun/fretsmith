import type { model } from '@coderline/alphatab'
import type { LoopPoint } from '../state/practiceState'

type Beat = model.Beat

export const getBeatLoopPoint = (beat: Beat): LoopPoint => ({
  barIndex: beat.voice.bar.index,
  beatIndex: beat.index,
  tick: beat.absolutePlaybackStart,
})

export const orderLoopPoints = (a: LoopPoint, b: LoopPoint) => {
  if (a.tick <= b.tick) {
    return { start: a, end: b }
  }

  return { start: b, end: a }
}
