import type { SyncPoint } from '../state/practiceState'

const storageKeyPrefix = 'fretsmith-sync:'

export class SyncManager {
  private gpFileName: string
  private mp3FileName: string
  private points: SyncPoint[] = []

  constructor(gpFileName: string, mp3FileName: string) {
    this.gpFileName = gpFileName
    this.mp3FileName = mp3FileName
    this.points = this.load()
  }

  getPoints(): SyncPoint[] {
    return [...this.points]
  }

  addPoint(barIndex: number, millisecondOffset: number, barPosition = 0, barOccurence = 0): SyncPoint | null {
    const existing = this.points.findIndex((p) => p.barIndex === barIndex)
    const point: SyncPoint = { barIndex, barPosition, barOccurence, millisecondOffset }

    const draft = [...this.points]
    if (existing >= 0) {
      draft[existing] = point
    } else {
      draft.push(point)
    }
    draft.sort((a, b) => a.barIndex - b.barIndex || a.barOccurence - b.barOccurence)

    for (let i = 1; i < draft.length; i++) {
      if (draft[i].millisecondOffset <= draft[i - 1].millisecondOffset) return null
    }

    this.points = draft
    this.save()
    return point
  }

  removePoint(barIndex: number, barOccurence = 0): void {
    this.points = this.points.filter(
      (p) => !(p.barIndex === barIndex && p.barOccurence === barOccurence),
    )
    this.save()
  }

  removePointByIndex(index: number): void {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1)
      this.save()
    }
  }

  getPointByIndex(index: number): SyncPoint | null {
    return this.points[index] ?? null
  }

  updatePoint(index: number, updates: Partial<SyncPoint>): void {
    if (index >= 0 && index < this.points.length) {
      this.points[index] = { ...this.points[index], ...updates }
      this.points.sort((a, b) => a.barIndex - b.barIndex || a.barOccurence - b.barOccurence)
      this.save()
    }
  }

  clear(): void {
    this.points = []
    this.save()
  }

  private save(): void {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.points))
    } catch {
      // localStorage quota exceeded — silently ignore
    }
  }

  private load(): SyncPoint[] {
    try {
      const raw = localStorage.getItem(this.storageKey())
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  private storageKey(): string {
    return `${storageKeyPrefix}${this.gpFileName}|${this.mp3FileName}`
  }
}
