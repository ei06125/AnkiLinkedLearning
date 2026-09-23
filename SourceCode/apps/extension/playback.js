export function readVideoTime() {
  const video = document.querySelector('video');
  return video ? { currentTime: video.currentTime, duration: video.duration, paused: video.paused } : null;
}

export function seekVideo(time) {
  const video = document.querySelector('video');
  if (!video) return false;
  video.currentTime = time;
  return true;
}

export function activeTranscriptIndex(entries, currentTime) {
  let index = -1;
  for (let candidate = 0; candidate < entries.length; candidate += 1) {
    const start = entries[candidate].start;
    if (start == null || start > currentTime) continue;
    if (index < 0 || start >= entries[index].start) index = candidate;
  }
  return index;
}
