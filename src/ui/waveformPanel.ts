import type { PracticeState, SyncPoint } from '../state/practiceState'
import { renderSyncPointEditor } from './syncPointEditor'

const syncIcon = `
  <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12h4l3-8 2 16 3-8h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`

const clearSyncIcon = `
  <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>`

const playIcon = `
  <svg class="toolbar-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8 5 12 7-12 7Z" fill="currentColor" />
  </svg>`

export const renderAudioSyncPanel = (state: PracticeState, scorePositions: string[] = []) => `
  <section class="audio-sync-panel ${state.waveformVisible ? 'is-visible' : ''}">
    <div class="audio-sync-toolbar">
      <label class="file-button file-button-small" for="mp3-file-input">Load MP3</label>
      <input id="mp3-file-input" type="file" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac" />
      ${state.mp3FileName ? `<span class="audio-sync-filename">${state.mp3FileName}</span>` : ''}
      <button id="mp3-play-toggle" class="toolbar-icon-button toolbar-action-icon audio-sync-play-btn" title="Play/Pause MP3" ${state.mp3Loaded ? '' : 'disabled'}>
        <span class="toolbar-symbol" aria-hidden="true">${playIcon}</span>
        <span class="sr-only">Play MP3</span>
      </button>
      <button id="sync-mode-toggle" class="toolbar-icon-button toolbar-action-icon audio-sync-btn ${state.interactionMode === 'setSyncPoint' ? 'is-active' : ''}" title="Place sync points" ${state.mp3Loaded ? '' : 'disabled'}>
        <span class="toolbar-symbol" aria-hidden="true">${syncIcon}</span>
        <span class="sr-only">Sync mode</span>
      </button>
      <button id="clear-sync-points" class="toolbar-icon-button toolbar-action-icon audio-sync-btn" title="Clear all sync points" ${state.syncPoints.length ? '' : 'disabled'}>
        <span class="toolbar-symbol" aria-hidden="true">${clearSyncIcon}</span>
        <span class="sr-only">Clear sync points</span>
      </button>
      <button id="toggle-sync-editor" class="toolbar-icon-button toolbar-action-icon audio-sync-btn ${state.syncPointEditorVisible ? 'is-active' : ''}" title="Toggle sync point editor" ${state.mp3Loaded ? '' : 'disabled'}>
        <span class="toolbar-symbol" aria-hidden="true">✎</span>
        <span class="sr-only">Toggle editor</span>
      </button>
      <span class="audio-sync-time" id="audio-sync-time">0:00 / 0:00</span>
      <span class="audio-sync-status" id="audio-sync-status"></span>
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
    ${renderSyncPointEditor(state, scorePositions)}
    <div class="audio-sync-hint" id="audio-sync-hint">
      Drag the playhead or use <kbd>←</kbd> <kbd>→</kbd> to scrub · <kbd>Shift</kbd> for larger steps
    </div>
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
