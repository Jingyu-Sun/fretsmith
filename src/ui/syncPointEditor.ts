import type { PracticeState, SyncPoint } from '../state/practiceState'

const playIcon = `
  <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8 5 12 7-12 7Z" fill="currentColor"/>
  </svg>
`

const stopIcon = `
  <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/>
  </svg>
`

const formatAudioTime = (ms: number): string => {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(3)
  return `${minutes}:${seconds.padStart(6, '0')}`
}

const formatAudioSeconds = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const formatAudioMs = (ms: number): string => {
  return String(Math.round(ms % 1000))
}

const renderSyncPointList = (
  syncPoints: SyncPoint[],
  selectedIndex: number | null,
  scorePositions: string[],
) => {
  if (syncPoints.length === 0) {
    return '<div class="sync-point-empty">No sync points yet. Click "+ Add" to create one.</div>'
  }

  return syncPoints
    .map((point, index) => {
      const isSelected = index === selectedIndex
      const audioTime = formatAudioTime(point.millisecondOffset)
      const scorePos = scorePositions[index] || `Bar ${point.barIndex + 1}`

      return `
        <button class="sync-point-item ${isSelected ? 'selected' : ''}" data-index="${index}" data-action="select-sync-point" type="button">
          <span class="sync-point-radio">${isSelected ? '●' : '○'}</span>
          <span class="sync-point-number">#${index + 1}</span>
          <span class="sync-point-audio">${audioTime}</span>
          <span class="sync-point-arrow">→</span>
          <span class="sync-point-score">${scorePos}</span>
          <span class="sync-point-delete" data-index="${index}" data-action="delete-sync-point" role="button" tabindex="-1" title="Delete sync point">
            <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
        </button>
      `
    })
    .join('')
}

export interface ScorePositionDetail {
  barNumber: number
  beatNumber: string
  tick: number
  maxTick: number
}

export const renderSyncPointEditor = (
  state: PracticeState,
  scorePositions: string[],
  selectedScoreDetail: ScorePositionDetail | null,
): string => {
  if (!state.syncPointEditorVisible) {
    return ''
  }

  const selectedPoint = state.selectedSyncPointIndex !== null
    ? state.syncPoints[state.selectedSyncPointIndex] ?? null
    : null

  const canAddMore = state.syncPoints.length < 10
  const hasSyncPoints = state.syncPoints.length > 0
  const isPreviewing = state.syncEditorMode === 'previewing'

  return `
    <div class="sync-point-editor" data-sync-editor-state="${isPreviewing ? 'previewing' : 'idle'}">
      <div class="sync-point-header">
        <button class="sync-point-add-btn" id="add-sync-point" data-action="add-sync-point" ${canAddMore ? '' : 'disabled'} title="${canAddMore ? 'Add sync point at current position' : 'Maximum 10 sync points reached'}">
          <span>+ Add</span>
        </button>
        <button class="sync-point-clear-btn" id="clear-sync-points-editor" data-action="clear-sync-points" ${hasSyncPoints ? '' : 'disabled'} title="Clear all sync points">
          <span>Clear All</span>
        </button>
        <span class="sync-point-count">${state.syncPoints.length} / 10</span>
        ${selectedPoint ? `
          <div class="sync-point-preview-controls">
            <button class="fine-tune-btn fine-tune-btn-compact" id="preview-1s" data-action="preview-sync-point" data-duration-ms="1000" title="Play 1 second from sync point (repeats)">
              ${playIcon}
              <span>Preview 1s</span>
            </button>
            <button class="fine-tune-btn fine-tune-btn-compact" id="preview-2s" data-action="preview-sync-point" data-duration-ms="2000" title="Play 2 seconds from sync point (repeats)">
              ${playIcon}
              <span>Preview 2s</span>
            </button>
            <button class="fine-tune-btn fine-tune-btn-compact" id="preview-stop" data-action="stop-sync-preview" ${isPreviewing ? '' : 'disabled'} title="Stop preview playback">
              ${stopIcon}
              <span>Stop preview</span>
            </button>
          </div>
        ` : ''}
      </div>
      <div class="sync-point-body">
        <div class="sync-point-list-column">
          <div class="sync-point-list">
            ${renderSyncPointList(state.syncPoints, state.selectedSyncPointIndex, scorePositions)}
          </div>
        </div>
        ${selectedPoint && selectedScoreDetail ? `
          <div class="sync-point-editor-column">
            <div class="fine-tune-row">
              <span class="fine-tune-label-inline">Audio:</span>
              <div class="fine-tune-nudge-group">
                <button class="fine-tune-btn fine-tune-btn-compact" data-action="nudge-audio" data-delta-ms="-1000" title="−1s">−</button>
                <span class="fine-tune-nudge-value" id="audio-seconds-value">${formatAudioSeconds(selectedPoint.millisecondOffset)}</span>
                <button class="fine-tune-btn fine-tune-btn-compact" data-action="nudge-audio" data-delta-ms="1000" title="+1s">+</button>
              </div>
              <div class="fine-tune-nudge-group">
                <button class="fine-tune-btn fine-tune-btn-compact" data-action="nudge-audio" data-delta-ms="-1" title="−1ms">−</button>
                <input class="fine-tune-ms-input" id="audio-ms-input" type="number" min="0" max="999" value="${formatAudioMs(selectedPoint.millisecondOffset)}" title="Milliseconds" />
                <button class="fine-tune-btn fine-tune-btn-compact" data-action="nudge-audio" data-delta-ms="1" title="+1ms">+</button>
                <span class="fine-tune-range-label">ms</span>
              </div>
            </div>
            <div class="fine-tune-row">
              <span class="fine-tune-label-inline">Score:</span>
              <div class="fine-tune-nudge-group">
                <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-bar-back" data-action="nudge-bar" data-delta="-1" title="−1 bar">−</button>
                <span class="fine-tune-nudge-value">Bar ${selectedScoreDetail.barNumber}</span>
                <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-bar-forward" data-action="nudge-bar" data-delta="1" title="+1 bar">+</button>
              </div>
              <div class="fine-tune-nudge-group">
                <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-beat-back" data-action="nudge-beat" data-delta="-1" title="−1 beat">−</button>
                <span class="fine-tune-nudge-value">Beat ${selectedScoreDetail.beatNumber}</span>
                <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-beat-forward" data-action="nudge-beat" data-delta="1" title="+1 beat">+</button>
              </div>
              <div class="fine-tune-nudge-group">
                <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-tick-back" data-action="nudge-tick" data-delta="-60" title="−60 ticks">−</button>
                <span class="fine-tune-nudge-value">Tick ${selectedScoreDetail.tick}</span>
                <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-tick-forward" data-action="nudge-tick" data-delta="60" title="+60 ticks">+</button>
              </div>
              <span class="fine-tune-range-label" id="tick-range-label">0–${selectedScoreDetail.maxTick}</span>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `
}
