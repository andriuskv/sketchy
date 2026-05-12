let timeoutId = 0;
let params: { id: string, duration: number, interval: number } | null = null;

onmessage = function ({ data }) {
  const { id, action, duration, interval = 1000 } = data;

  if (action === "start") {
    clearTimeout(timeoutId);

    if (duration) {
      params = { id, duration: duration || 0, interval };
      countdown(performance.now());
    }
    else {
      update(performance.now(), data.elapsed || 0);
    }
  }
  else if (action === "stop") {
    clearTimeout(timeoutId);
    timeoutId = 0;
  }
  else if (action === "update-duration" && params) {
    params.duration = duration;
  }
};

function countdown(elapsed: number) {
  if (!params) {
    return;
  }
  const diff = performance.now() - elapsed;
  const interval = params.interval;
  const adjustedInterval = interval - diff;

  elapsed += interval;
  // params.duration -= adjustedInterval;
  params.duration -= interval;

  timeoutId = self.setTimeout(() => {
    postMessage({ elapsed, ...params });

    if (params && params.duration >= 0) {
      countdown(elapsed);
    }
  }, adjustedInterval);
}

function update(start: number, elapsed = 0) {
  const interval = Math.random() * 5 + 15;
  const diff = performance.now() - start;

  start += interval;
  elapsed += interval;

  postMessage({ diff: interval, elapsed });

  timeoutId = self.setTimeout(() => {
    update(start, elapsed);
  }, interval - diff);
}

export { };
