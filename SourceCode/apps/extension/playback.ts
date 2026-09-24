export function readVideoTime() {
  const video = document.querySelector('video');
  return video ? { currentTime: video.currentTime, duration: video.duration, paused: video.paused } : null;
}

import type { TimedTranscriptCue } from '../../types.js';

export function seekVideo(time: number): boolean {
  const video = document.querySelector('video');
  if (!video) return false;
  video.currentTime = time;
  return true;
}

export function activeTranscriptIndex(entries: Array<Pick<TimedTranscriptCue, 'start'>>, currentTime: number): number {
  let index = -1;
  for (let candidate = 0; candidate < entries.length; candidate += 1) {
    const start = entries[candidate].start;
    if (start == null || start > currentTime) continue;
    const activeStart = index < 0 ? null : entries[index].start;
    if (activeStart == null || start >= activeStart) index = candidate;
  }
  return index;
}
