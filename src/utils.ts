function shuffleArray<T>(array: T[]) {
  let index = array.length;

  while (index) {
    const randomIndex = Math.floor(Math.random() * index);

    index -= 1;
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function yieldWork() {
  // @ts-ignore
  if ("scheduler" in window && "yield" in scheduler) {
    // @ts-ignore
    return scheduler.yield();
  }
  return new Promise(resolve => setTimeout(resolve, 0));
}

function getRandomString(length = 8) {
  return Math.random().toString(32).slice(2, 2 + length);
}

function formatDuration(totalSeconds: number, showHours = false) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (showHours) {
    return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
  }
  return `${padTime(minutes)}:${padTime(seconds)}`;
}

function padTime(time: number | string, pad = true) {
  return pad ? `00${time}`.slice(-2) : time.toString();
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {
  shuffleArray,
  yieldWork,
  getRandomString,
  formatDuration,
  delay
}
