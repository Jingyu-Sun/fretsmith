import type { TrackControlState } from '../state/practiceState'

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const renderTrackMixer = (tracks: TrackControlState[], selectedTrackIndexes: number[]) => {
  if (!tracks.length) {
    return '<p class="empty-text">Load a file to see track mute and solo controls.</p>'
  }

  return tracks
    .map(
      (track) => `
        <article class="track-card ${selectedTrackIndexes.includes(track.trackIndex) ? 'is-selected' : ''}">
          <button class="track-name-button" data-track-select="${track.trackIndex}">Track ${track.trackIndex + 1}</button>
          <div class="track-actions">
            <button class="mini-button ${track.solo ? 'is-active' : ''}" data-track-solo="${track.trackIndex}">Solo</button>
            <button class="mini-button ${track.mute ? 'is-active' : ''}" data-track-mute="${track.trackIndex}">Mute</button>
          </div>
        </article>
      `,
    )
    .join('')
}

export const renderTrackMixerWithNames = (
  tracks: Array<TrackControlState & { name: string }>,
  selectedTrackIndexes: number[],
) => {
  if (!tracks.length) {
    return '<p class="empty-text">Load a file to see track mute and solo controls.</p>'
  }

  return tracks
    .map(
      (track) => `
        <article class="track-card ${selectedTrackIndexes.includes(track.trackIndex) ? 'is-selected' : ''}">
          <button class="track-name-button" data-track-select="${track.trackIndex}">${escapeHtml(track.name)}</button>
          <div class="track-actions">
            <button class="mini-button ${track.solo ? 'is-active' : ''}" data-track-solo="${track.trackIndex}">Solo</button>
            <button class="mini-button ${track.mute ? 'is-active' : ''}" data-track-mute="${track.trackIndex}">Mute</button>
          </div>
        </article>
      `,
    )
    .join('')
}
