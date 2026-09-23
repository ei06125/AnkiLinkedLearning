export function readVideoTime() {
  const video = document.querySelector('video');
  return video ? { currentTime: video.currentTime, paused: video.paused } : null;
}

export function seekVideo(time) {
  const video = document.querySelector('video');
  if (!video) return false;
  video.currentTime = time;
  return true;
}
