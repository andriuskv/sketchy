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

export {
  shuffleArray,
  yieldWork,
  getRandomString
}
