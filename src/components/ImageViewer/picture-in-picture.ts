import { formatDuration } from "@/utils";

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
  if (!pipSupported) {
    return;
  }

  if (pipWindow) {
    cleanup();
  }
  init(params);
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
        z-index: 1;
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

      .break-view {
        z-index: 1;
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: var(--space-xl);
        height: 100%;

        &.hidden {
          display: none;
        }
      }

      .break-view-value {
        font-size: var(--text-3xl);
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

        &:hover, &:has(:focus-visible) {
          .viewer-bar {
            opacity: 1;
            visibility: visible;
          }
        }
      }

      .viewer-bar {
        opacity: 0;
        visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: end;
        gap: var(--space-md);
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

        &.hidden {
          display: none;
        }

        &.text-overflow {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .viewer-mirror-icon {
        &.hidden {
          display: none;
        }
      }

      .viewer-image-container {
        width: 100%;
        height: 1000%;
        max-height: 100%;
      }

      .viewer-image {
        --dir: 1;
        --scale: 1;
        --rotation: 0;

        object-fit: scale-down;
        max-width: 100%;
        height: 100%;
        margin-inline: auto;
        rotate: calc(var(--rotation) * 1deg);
        scale: calc(var(--dir) * var(--scale)) var(--scale);
      }
    </style>
  `);
  pipWindow.document.body.insertAdjacentHTML("beforeend", `
    <svg style="display: none;">
      <defs>
        <symbol id="pause" viewBox="0 0 24 24">
          <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
        </symbol>
        <symbol id="chevron-left" viewBox="0 0 24 24">
          <path d="M15.4 16.6L10.8 12 15.4 7.4 14 6 8 12 14 18 15.4 16.6Z" />
        </symbol>
        <symbol id="chevron-right" viewBox="0 0 24 24">
          <path d="M8.6 16.6L13.2 12 8.6 7.4 10 6 16 12 10 18 8.6 16.6Z" />
        </symbol>
        <symbol id="flip-horizontal" viewBox="0 0 24 24">
          <path
            d="M15 21H17V19H15M19 9H21V7H19M3 5V19C3 20.1 3.9 21 5 21H9V19H5V5H9V3H5C3.9 3 3 3.9 3 5M19 3V5H21C21 3.9 20.1 3 19 3M11 23H13V1H11M19 17H21V15H19M15 5H17V3H15M19 13H21V11H19M19 21C20.1 21 21 20.1 21 19H19Z" />
        </symbol>
        <symbol id="rotate" viewBox="0 0 24 24">
          <path
            d="M16.89,15.5L18.31,16.89C19.21,15.73 19.76,14.39 19.93,13H17.91C17.77,13.87 17.43,14.72 16.89,15.5M13,17.9V19.92C14.39,19.75 15.74,19.21 16.9,18.31L15.46,16.87C14.71,17.41 13.87,17.76 13,17.9M19.93,11C19.76,9.61 19.21,8.27 18.31,7.11L16.89,8.53C17.43,9.28 17.77,10.13 17.91,11M15.55,5.55L11,1V4.07C7.06,4.56 4,7.92 4,12C4,16.08 7.05,19.44 11,19.93V17.91C8.16,17.43 6,14.97 6,12C6,9.03 8.16,6.57 11,6.09V10L15.55,5.55Z" />
        </symbol>
        <symbol id="reset" viewBox="0 0 24 24">
          <path
            d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
        </symbol>
      </defs>
    </svg>
    <div class="session-paused hidden">
      <h2 class="session-paused-title">Paused</h2>
      <div class="session-paused-buttons">
        <button id="session-pause-btn" class="btn primary-btn">Resume</button>
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
    <div class="break-view hidden">
      <div class="break-text">Break</div>
      <div class="break-value">0</div>
      <div class="break-btns">
        <button id="break-continue-btn" class="btn text-btn hidden">Continue</button>
        <button id="break-end-btn" class="btn text-btn hidden">Quit</button>
      </div>
    </div>
    <div class="viewer">
      <div class="session-bar-progress-container">
        <div class="session-bar-progress-bar" style="scale: 0"></div>
      </div>
      <div id="viewer-top-bar" class="viewer-bar viewer-top-bar">
      ${data.inSession ? `
        <button class="btn icon-btn" title="Pause" data-btn-type="pause">
          <svg viewBox="0 0 24 24" class="svg-icon"><use href="#pause"></use></svg>
        </button>` : ""}
        <button class="btn icon-btn" title="Rotate" data-btn-type="rotate">
          <svg viewBox="0 0 24 24" class="svg-icon"><use href="#rotate"></use></svg>
        </button>
        <button class="btn icon-btn" title="Mirror" data-btn-type="mirror">
          <svg viewBox="0 0 24 24" class="svg-icon"><use href="#flip-horizontal"></use></svg>
        </button>
        <button class="btn icon-btn" title="Reset" data-btn-type="reset">
          <svg viewBox="0 0 24 24" class="svg-icon"><use href="#reset"></use></svg>
        </button>
      </div>
      <div class="viewer-image-container">
        <img src=${data.imageUrl} class="viewer-image" draggable="false" style="--dir: ${data.image.mirrored ? -1 : 1}; --rotation: 0;"/>
      </div>
      <div id="viewer-bottom-bar" class="viewer-bar viewer-bottom-bar${data.inSession ? "" : " viewer-bottom-bar-end-session"}">
        <svg id="viewer-image-mirror" viewBox="0 0 24 24" class="svg-icon viewer-mirror-icon ${data.image.mirrored ? "" : "hidden"}" title="Mirrored"><use href="#flip-horizontal"></use></svg>
        <span id="viewer-image-name" class="viewer-bar-item-info text-overflow ${data.inSession ? " hidden" : ""}">${data.image.name}</span>
        <span id="viewer-image-count" class="viewer-bar-item-info">${data.index + 1} / ${data.count}</span>
        ${data.inSession ? `<button class="btn text-btn" data-btn-type="skip">Skip</button>` : `
          <button id="prev-btn" class="btn icon-btn" title="Previous" data-btn-type="prev">
            <svg viewBox="0 0 24 24" class="svg-icon"><use href="#chevron-left"></use></svg>
          </button>
          <button id="next-btn" class="btn icon-btn" title="Next" data-btn-type="next">
            <svg viewBox="0 0 24 24" class="svg-icon"><use href="#chevron-right"></use></svg>
          </button>
        `}
      </div>
    </div>
  `);
  pipWindow.addEventListener("unload", cleanup, { once: true });
  pipWindow.document.getElementById("viewer-top-bar")?.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest("[data-btn-type]") as HTMLButtonElement;

    if (btn) {
      const { btnType } = btn.dataset;

      switch (btnType) {
        case "pause":
          actions.pause();
          break;
        case "rotate":
          actions.rotate();
          break;
        case "mirror":
          actions.mirror();
          break;
        case "reset":
          actions.reset();
          break;
      }
    }
  });
  pipWindow.document.getElementById("viewer-bottom-bar")?.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest("[data-btn-type]") as HTMLButtonElement;

    if (btn) {
      const { btnType } = btn.dataset;

      switch (btnType) {
        case "skip":
          actions.skip();
          break;
        case "prev":
          actions.prev();
          break;
        case "next":
          actions.next();
          break;
      }
    }
  }, { signal: abortController.signal });

  pipWindow.document.getElementById("session-pause-btn")?.addEventListener("click", () => actions.pause(), { signal: abortController.signal });
  pipWindow.document.getElementById("session-end-btn")?.addEventListener("click", handleEndPractice, { signal: abortController.signal });

  pipWindow.document.getElementById("session-grace-skip-btn")?.addEventListener("click", () => actions.skipWaiting(), { signal: abortController.signal });
  pipWindow.document.getElementById("session-grace-end-btn")?.addEventListener("click", handleEndPractice, { signal: abortController.signal });

  pipWindow.document.getElementById("break-continue-btn")?.addEventListener("click", () => actions.skip(), { signal: abortController.signal });
  pipWindow.document.getElementById("break-end-btn")?.addEventListener("click", handleEndPractice, { signal: abortController.signal });
}

function handleEndPractice() {
  actions.endPractice();
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

function updateImage(image: { url: string, index: number, mirrored?: boolean, name: string }, count: number) {
  if (!pipWindow) {
    return;
  }
  const imageElement = pipWindow.document.querySelector(".viewer-image") as HTMLImageElement;
  const mirroredElement = pipWindow.document.getElementById("viewer-image-mirror") as HTMLElement;
  const nameElement = pipWindow.document.getElementById("viewer-image-name") as HTMLSpanElement;
  const countElement = pipWindow.document.getElementById("viewer-image-count") as HTMLSpanElement;

  imageElement.style.setProperty("--dir", (image.mirrored ? -1 : 1).toString());
  imageElement.style.setProperty("--rotation", "0");
  imageElement.src = image.url;
  mirroredElement.classList.toggle("hidden", !image.mirrored);
  nameElement.textContent = image.name;
  countElement.textContent = `${image.index + 1} / ${count}`;
}

function rotateImage(deg: number) {
  if (!pipWindow) {
    return;
  }
  const target = pipWindow.document.querySelector(".viewer-image") as HTMLImageElement;

  target.style.setProperty("--rotation", (deg).toString());
}

function mirrorImage(dir: 1 | -1) {
  if (!pipWindow) {
    return;
  }
  const target = pipWindow.document.querySelector(".viewer-image") as HTMLImageElement;

  target.style.setProperty("--dir", (dir).toString());
}

function resetImage({ mirrored }: { mirrored?: boolean }) {
  if (!pipWindow) {
    return;
  }
  const target = pipWindow.document.querySelector(".viewer-image") as HTMLImageElement;

  target.style.setProperty("--dir", (mirrored ? -1 : 1).toString());
  target.style.setProperty("--rotation", "0");
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
  const breakView = pipWindow.document.querySelector(".break-view") as HTMLDivElement;

  viewer.classList.toggle("hidden", visible);
  sessionPaused.classList.toggle("hidden", visible);
  graceView.classList.toggle("hidden", !visible);
  breakView.classList.toggle("hidden", visible);
}

function toggleBreakView(visible: boolean) {
  if (!pipWindow) {
    return;
  }
  const viewer = pipWindow.document.querySelector(".viewer") as HTMLDivElement;
  const sessionPaused = pipWindow.document.querySelector(".session-paused") as HTMLDivElement;
  const graceView = pipWindow.document.querySelector(".session-grace") as HTMLDivElement;
  const breakView = pipWindow.document.querySelector(".break-view") as HTMLDivElement;

  viewer.classList.toggle("hidden", visible);
  sessionPaused.classList.toggle("hidden", visible);
  graceView.classList.toggle("hidden", visible);
  breakView.classList.toggle("hidden", !visible);
}

function updateBreakView(value: number) {
  if (!pipWindow) {
    return;
  }
  const breakValue = pipWindow.document.querySelector(".break-value") as HTMLDivElement;
  breakValue.textContent = formatDuration(Math.round(value / 1000));
}

function updateGraceView(value: number, text: string, showButtons: boolean) {
  if (!pipWindow) {
    return;
  }
  const graceText = pipWindow.document.querySelector(".session-grace-text") as HTMLDivElement;
  const graceValue = pipWindow.document.querySelector(".session-grace-value") as HTMLDivElement;
  const skipBtn = pipWindow.document.getElementById("session-grace-skip-btn") as HTMLButtonElement;
  const endBtn = pipWindow.document.getElementById("session-grace-end-btn") as HTMLButtonElement;


  graceText.textContent = text;
  graceValue.textContent = String(Math.round(value / 1000));

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
  rotateImage,
  mirrorImage,
  resetImage,
  handlePipPause,
  toggleGraceView,
  toggleBreakView,
  updateGraceView,
  updateBreakView
};
