const pipSupported = "documentPictureInPicture" in window;
let pipWindow: typeof window | null = null;
let actions: { [key: string]: any } = {};
let abortController = new AbortController();

type Params = {
  data: {
    [key: string]: any
  },
  actions: {
    [key: string]: any
  }
}

function isSupported() {
  return pipSupported;
}

function toggle(params: Params) {
  if (pipWindow) {
    cleanup();
    init(params);
  }
  else {
    init(params);
  }
}

function close(manuallyClosed?: boolean) {
  if (!pipWindow) {
    return;
  }
  pipWindow.close();
  cleanup();

  if (manuallyClosed) {
    window.focus();
  }
}

function cleanup() {
  if (pipWindow) {
    pipWindow.removeEventListener("unload", cleanup);
    abortController.abort();
    abortController = new AbortController();
  }
  pipWindow = null;
  actions = {}
}

async function init({ data, actions: viewerActions }: Params) {
  if (pipWindow) {
    return;
  }
  updateActions(viewerActions);
  pipWindow = await (window as any).documentPictureInPicture.requestWindow();

  if (!pipWindow) {
    return;
  }
  await copyStyleSheets(pipWindow!.document.head);

  pipWindow.document.head.insertAdjacentHTML("beforeend", `
    <style>
      body {
        overflow: hidden;
      }

      .session-bar-progress-container {
        position: absolute;
        top: var(--space-xs);
        left: var(--space-sm);
        right: var(--space-sm);
        flex-shrink: 0;
      }

      .session-bar-progress-bar {
        width: 100%;
        height: 4px;
        background-color: var(--color-primary);
        transform-origin: top left;
        transition: 0.1s scale;
      }

      .session-grace {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: var(--space-xl);
        height: 100%;

        &.hidden {
          display: none;
        }

        .btn.hidden {
          opacity: 0;
          visibility: hidden;
        }
      }

      .session-grace-value {
        font-size: var(--text-3xl);
      }

      .session-paused {
        display: grid;
        justify-content: center;
        align-items: center;
        height: 100%;

        &.hidden {
          display: none;
        }
      }

      .session-paused-title {
        font-size: var(--text-4xl);
        text-align: center;
      }

      .session-paused-buttons {
        align-self: start;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xl);
      }

      .viewer {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;

        &.hidden {
          display: none;
        }

        .icon-btn {
          --color: var(--color-white-60);

          &:hover, &:focus-visible {
            --color: var(--color-white);
            --background-color: var(--color-white-10);
          }
        }
      }

      .viewer-bar {
        position: absolute;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: end;
        gap: var(--space-md);
        width: 100%;
        padding: var(--space-md);
      }

      .viewer-top-bar {
        top: 0;
      }

      .viewer-bottom-bar {
        bottom: 0;
        padding-left: var(--space-xl);
      }

      .viewer-bar-item-info {
        margin-right: var(--space-md);
        font-size: var(--text-sm);
        white-space: nowrap;
        text-shadow:
          0 1px 1px var(--color-black-100-16),
          0 2px 2px var(--color-black-100-8);

        &.text-overflow {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .viewer-image-container {
        width: 100%;
        height: 1000%;
        max-height: 100%;
      }

      .viewer-image {
        object-fit: scale-down;
        max-width: 100%;
        height: 100%;
        margin-inline: auto;
      }
    </style>
  `);
  pipWindow.document.body.insertAdjacentHTML("beforeend", `
    <svg style="display: none;">
      <defs>
        <symbol id="pause" viewBox="0 0 24 24">
          <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
        </symbol>
      </defs>
    </svg>
    <div class="session-paused hidden">
      <h2 class="session-paused-title">Paused</h2>
      <div class="session-paused-buttons">
        <button id="session-pause-btn" class="btn primary-btn">Continue</button>
        <button id="session-end-btn" class="btn text-btn">Quit</button>
      </div>
    </div>
    <div class="session-grace hidden">
      <div class="session-grace-text">Starting</div>
      <div class="session-grace-value">0</div>
      <div class="session-grace-btns">
        <button id="session-grace-skip-btn" class="btn text-btn hidden">Skip Waiting</button>
        <button id="session-grace-end-btn" class="btn text-btn hidden">Quit</button>
      </div>
    </div>
    <div class="viewer">
      <div class="session-bar-progress-container">
        <div class="session-bar-progress-bar" style="scale: 0"></div>
      </div>
      <div class="viewer-bar viewer-top-bar">
        <button id="pause-btn" class="btn icon-btn" title="pause">
          <svg viewBox="0 0 24 24" class="svg-icon"><use href="#pause"></use></svg>
        </button>
      </div>
      <div class="viewer-image-container">
        <img src=${data.image.url} class="viewer-image" draggable="false" />
      </div>
      <div class="viewer-bar viewer-bottom-bar">
        <span class="viewer-bar-item-info">${data.image.index + 1} / ${data.count}</span>
        <button id="skip-btn" class="btn text-btn">Skip</button>
      </div>
    </div>
  `);
  pipWindow.addEventListener("unload", cleanup, { once: true });

  pipWindow.document.getElementById("pause-btn")?.addEventListener("click", () => actions.pause(), { signal: abortController.signal });
  pipWindow.document.getElementById("skip-btn")?.addEventListener("click", () => actions.skip(), { signal: abortController.signal });

  pipWindow.document.getElementById("session-pause-btn")?.addEventListener("click", () => actions.pause(), { signal: abortController.signal });
  pipWindow.document.getElementById("session-end-btn")?.addEventListener("click", handleEndSession, { signal: abortController.signal });

  pipWindow.document.getElementById("session-grace-skip-btn")?.addEventListener("click", () => actions.skipWaiting(), { signal: abortController.signal });
  pipWindow.document.getElementById("session-grace-end-btn")?.addEventListener("click", handleEndSession, { signal: abortController.signal });
}

function handleEndSession() {
  actions.endSession();
  close(true);
}

async function copyStyleSheets(head: HTMLElement) {
  const allCSS = [...document.styleSheets]
    .map(styleSheet => {
      try {
        return [...styleSheet.cssRules].map((r) => r.cssText).join("");
      } catch {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = styleSheet.type;
        link.media = styleSheet.media as unknown as string;
        link.href = styleSheet.href!;
        head.appendChild(link);
        return null;
      }
    })
    .filter(Boolean)
    .join("\n");

  const style = document.createElement("style");
  style.textContent = allCSS;
  head.appendChild(style);
}

function updateImage(image: { url: string, index: number }, count: number) {
  if (!pipWindow) {
    return;
  }
  const element = pipWindow.document.querySelector(".viewer-image") as HTMLImageElement;
  element.src = image.url;

  updateImageIndex(image.index, count);
}

function updateImageIndex(index: number, count: number) {
  if (!pipWindow) {
    return;
  }
  const element = pipWindow.document.querySelector(".viewer-bar-item-info") as HTMLImageElement;
  element.textContent = `${index + 1} / ${count}`;
}

function updateProgressBar(progress: number) {
  if (!pipWindow) {
    return;
  }
  const element = pipWindow.document.querySelector(".session-bar-progress-bar") as HTMLImageElement;
  element.style.scale = `${progress} 1`;
}

function updateActions(viewerActions: { [key: string]: any }) {
  actions = { ...actions, ...viewerActions };
}

function handlePipPause(paused: boolean) {
  if (!pipWindow) {
    return;
  }
  const viewer = pipWindow.document.querySelector(".viewer") as HTMLDivElement;
  const sessionPaused = pipWindow.document.querySelector(".session-paused") as HTMLDivElement;
  const graceView = pipWindow.document.querySelector(".session-grace") as HTMLDivElement;

  viewer.classList.toggle("hidden", paused);
  sessionPaused.classList.toggle("hidden", !paused);
  graceView.classList.toggle("hidden", !paused);
}

function toggleGraceView(visible: boolean) {
  if (!pipWindow) {
    return;
  }
  const graceView = pipWindow.document.querySelector(".session-grace") as HTMLDivElement;
  const viewer = pipWindow.document.querySelector(".viewer") as HTMLDivElement;
  const sessionPaused = pipWindow.document.querySelector(".session-paused") as HTMLDivElement;

  viewer.classList.toggle("hidden", visible);
  sessionPaused.classList.toggle("hidden", visible);
  graceView.classList.toggle("hidden", !visible);
}

function updateGraceView(value: number, text: string, showButtons: boolean) {
  if (!pipWindow) {
    return;
  }
  const graceText = pipWindow.document.querySelector(".session-grace-text") as HTMLDivElement;
  const graceValue = pipWindow.document.querySelector(".session-grace-value") as HTMLDivElement;
  const skipBtn =  pipWindow.document.getElementById("session-grace-skip-btn") as HTMLButtonElement;
  const endBtn = pipWindow.document.getElementById("session-grace-end-btn") as HTMLButtonElement;

  graceText.textContent = text;
  graceValue.textContent = String(value);

  skipBtn.classList.toggle("hidden", !showButtons);
  endBtn.classList.toggle("hidden", !showButtons);
}

export {
  isSupported,
  close,
  toggle,
  updateImage,
  updateProgressBar,
  updateActions,
  handlePipPause,
  toggleGraceView,
  updateGraceView
};
