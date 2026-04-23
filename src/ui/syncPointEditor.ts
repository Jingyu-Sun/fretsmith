import type { PracticeState, SyncPoint } from '../state/practiceState'

const formatAudioTime = (ms: number): string => {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(3)
  return `${minutes}:${seconds.padStart(6, '0')}`
}

const renderSyncPointList = (
  syncPoints: SyncPoint[],
  selectedIndex: number | null,
  scorePositions: string[],
) => {
  if (syncPoints.length === 0) {
    return '<div class="sync-point-empty">No sync points yet. Click "Add Sync Point" to create one.</div>'
  }

  return syncPoints
    .map((point, index) => {
      const isSelected = index === selectedIndex
      const audioTime = formatAudioTime(point.millisecondOffset)
      const scorePos = scorePositions[index] || `Bar ${point.barIndex + 1}`

      return `
        <div class="sync-point-item ${isSelected ? 'selected' : ''}" data-index="${index}">
          <span class="sync-point-radio">${isSelected ? '●' : '○'}</span>
          <span class="sync-point-number">#${index + 1}</span>
          <span class="sync-point-audio">${audioTime}</span>
          <span class="sync-point-arrow">→</span>
          <span class="sync-point-score">${scorePos}</span>
          <button class="sync-point-delete" data-index="${index}" title="Delete sync point">
            <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      `
    })
    .join('')
}

export const renderSyncPointEditor = (
  state: PracticeState,
  scorePositions: string[],
): string => {
  if (!state.syncPointEditorVisible) {
    return ''
  }

  const selectedPoint = state.selectedSyncPointIndex !== null
    ? state.syncPoints[state.selectedSyncPointIndex] ?? null
    : null
  const selectedScorePos = state.selectedSyncPointIndex !== null
    ? scorePositions[state.selectedSyncPointIndex] ?? ''
    : ''

  const canAddMore = state.syncPoints.length < 10
  const audioTime = selectedPoint ? formatAudioTime(selectedPoint.millisecondOffset) : '0:00.000'
  const isLooping = state.syncPointPreviewLooping

  return `
    <div class="sync-point-editor">
      <div class="sync-point-header">
        <button class="sync-point-add-btn" id="add-sync-point" ${canAddMore ? '' : 'disabled'} title="${canAddMore ? 'Add sync point at current position' : 'Maximum 10 sync points reached'}">
          <span>+ Add Sync Point</span>
        </button>
        <span class="sync-point-count">${state.syncPoints.length} / 10 points</span>
        ${selectedPoint ? `
          <div class="sync-point-preview-controls">
            <button class="fine-tune-btn fine-tune-btn-compact" id="preview-1s" title="Play 1 second from sync point">
              <span>▶ 1s</span>
            </button>
            <button class="fine-tune-btn fine-tune-btn-compact" id="preview-2s" title="Play 2 seconds from sync point">
              <span>▶ 2s</span>
            </button>
            <button class="fine-tune-btn fine-tune-btn-compact ${isLooping ? 'is-active' : ''}" id="preview-loop" title="Toggle loop playback">
              <span>↻ Loop</span>
            </button>
            <button class="fine-tune-btn fine-tune-btn-compact" id="preview-stop" title="Stop preview playback">
              <span>■ Stop</span>
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
        ${selectedPoint ? `
          <div class="sync-point-editor-column">
            <div class="fine-tune-row">
              <span class="fine-tune-label-inline">Audio:</span>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-audio-back" title="Move audio position back 100ms">
                <span>◀ 100ms</span>
              </button>
              <span class="fine-tune-value-inline">${audioTime}</span>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-audio-forward" title="Move audio position forward 100ms">
                <span>100ms ▶</span>
              </button>
            </div>
            <div class="fine-tune-row">
              <span class="fine-tune-label-inline">Score:</span>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-bar-back" title="Move back 1 bar">
                <span>◀ Bar</span>
              </button>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-beat-back" title="Move back 1 beat">
                <span>◀ Beat</span>
              </button>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-tick-back" title="Move back 1 tick">
                <span>◀ Tick</span>
              </button>
              <span class="fine-tune-value-inline">${selectedScorePos}</span>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-tick-forward" title="Move forward 1 tick">
                <span>Tick ▶</span>
              </button>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-beat-forward" title="Move forward 1 beat">
                <span>Beat ▶</span>
              </button>
              <button class="fine-tune-btn fine-tune-btn-compact" id="nudge-bar-forward" title="Move forward 1 bar">
                <span>Bar ▶</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `
}
