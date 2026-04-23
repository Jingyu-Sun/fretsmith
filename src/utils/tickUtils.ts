import type { model } from '@coderline/alphatab'

type Score = model.Score
type MasterBar = model.MasterBar

export const findBarContainingTick = (score: Score, tick: number): MasterBar | null => {
  for (const bar of score.masterBars) {
    const barStart = bar.start
    const barDuration = bar.calculateDuration()
    const barEnd = barStart + barDuration
    if (tick >= barStart && tick < barEnd) {
      return bar
    }
  }
  return score.masterBars[score.masterBars.length - 1] ?? null
}

export const tickToBarPosition = (
  score: Score,
  tick: number,
): { barIndex: number; barPosition: number } | null => {
  const bar = findBarContainingTick(score, tick)
  if (!bar) return null

  const barStart = bar.start
  const barDuration = bar.calculateDuration()
  const barPosition = barDuration > 0 ? (tick - barStart) / barDuration : 0

  return { barIndex: bar.index, barPosition }
}

export const barPositionToTick = (score: Score, barIndex: number, barPosition: number): number => {
  const bar = score.masterBars[barIndex]
  if (!bar) return 0

  const barStart = bar.start
  const barDuration = bar.calculateDuration()
  return barStart + barPosition * barDuration
}

export const formatTick = (score: Score, tick: number): string => {
  const bar = findBarContainingTick(score, tick)
  if (!bar) return 'Unknown'

  const barStart = bar.start
  const barDuration = bar.calculateDuration()
  const tickInBar = tick - barStart
  const beatsInBar = bar.timeSignatureNumerator
  const ticksPerBeat = barDuration / beatsInBar

  const beatNumber = ticksPerBeat > 0 ? tickInBar / ticksPerBeat : 0
  const beatWhole = Math.floor(beatNumber)
  const beatFraction = beatNumber - beatWhole

  if (beatFraction < 0.01) {
    return `Bar ${bar.index + 1}, beat ${beatWhole + 1}`
  } else {
    return `Bar ${bar.index + 1}, beat ${(beatNumber + 1).toFixed(2)}`
  }
}
