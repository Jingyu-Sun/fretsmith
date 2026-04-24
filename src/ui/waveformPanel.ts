import type { PracticeState, SyncPoint } from '../state/practiceState'
import { renderSyncPointEditor } from './syncPointEditor'
import type { ScorePositionDetail } from './syncPointEditor'

export const renderAudioSyncPanel = (state: PracticeState, scorePositions: string[] = [], selectedScoreDetail: ScorePositionDetail | null = null) => `
  <section class="audio-sync-panel ${state.waveformVisible ? 'is-visible' : ''}">
    <div class="audio-sync-toolbar">
      <label class="file-button file-button-small" for="mp3-file-input">Load MP3</label>
      <input id="mp3-file-input" type="file" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac" />
      ${state.mp3FileName ? `<span class="audio-sync-filename">${state.mp3FileName}</span>` : ''}
      <button id="toggle-sync-editor" class="toolbar-icon-button toolbar-action-icon audio-sync-btn ${state.syncPointEditorVisible ? 'is-active' : ''}" title="Toggle sync point editor" ${state.mp3Loaded ? '' : 'disabled'}>
        <span class="toolbar-symbol" aria-hidden="true">✎</span>
        <span class="sr-only">Toggle editor</span>
      </button>
      <span class="audio-sync-time" id="audio-sync-time">0:00 / 0:00</span>
      <span class="audio-sync-status" id="audio-sync-status">${state.syncPoints.length > 0 ? `${state.syncPoints.length} sync point${state.syncPoints.length === 1 ? '' : 's'}` : ''}</span>
    </div>
    <div class="audio-timeline" id="audio-timeline" tabindex="0">
      <div class="audio-timeline-track">
        <div class="audio-timeline-progress" id="audio-timeline-progress"></div>
        <div class="audio-timeline-playhead" id="audio-timeline-playhead"></div>
      </div>
      <div class="audio-timeline-labels">
        <span>0:00</span>
        <span id="audio-timeline-end">0:00</span>
      </div>
    </div>
    <div class="audio-sync-editor-slot">${renderSyncPointEditor(state, scorePositions, selectedScoreDetail)}</div>
  </section>
`

export const updateSyncMarkerPositions = (
  container: HTMLElement,
  syncPoints: SyncPoint[],
  durationMs: number,
  selectedIndex: number | null,
  onSelect?: (index: number) => void,
) => {
  container.querySelectorAll('.audio-sync-marker').forEach((el) => el.remove())

  if (durationMs <= 0) return

  const track = container.querySelector('.audio-timeline-track')
  if (!track) return

  syncPoints.forEach((sp, index) => {
    const marker = document.createElement('div')
    marker.className = `audio-sync-marker ${index === selectedIndex ? 'selected' : ''}`
    marker.dataset.index = String(index)
    marker.dataset.label = `B${sp.barIndex + 1}`
    marker.title = `Sync Point #${index + 1}: Bar ${sp.barIndex + 1} — click to select`
    marker.style.left = `${(sp.millisecondOffset / durationMs) * 100}%`
    if (onSelect) {
      marker.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect(index)
      })
    }
    track.appendChild(marker)
  })
}
