import { useEffect, useRef, useState, type SyntheticEvent, type PointerEvent as ReactPointerEvent, useEffectEvent } from "react";
import * as fileService from "services/files";
import Icon from "components/Icon/Icon";
import "./ImageViewer.css";
import * as pip from "./picture-in-picture"
import Toast from "./Toast/Toast";

type Props = {
  images: Image[],
  index: number,
  randomizeFlip?: boolean,
  inSession?: boolean,
  hideControls?: boolean,
  pause?: () => void,
  skip?: (manual?: boolean) => void,
  onImageReady?: (event: SyntheticEvent) => void,
  close: () => void
}

type StateImage = {
  index: number,
  url: string
}

function getImage(index: number, images: Image[]) {
  return {
    index,
    url: fileService.preloadImage(images[index])
  };
}

export default function ImageViewer({ images, index, randomizeFlip, inSession, hideControls, pause, skip, onImageReady, close }: Props) {
  const [image, setImage] = useState<StateImage>(() => getImage(index, images));
  const pointerPosStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const initialScale = useRef(1);
  const root = useRef(document.documentElement);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    setImage(getImage(index, images));
  }, [index]);

  function nextImage() {
    const nextIndex = image.index + 1;
    const index = nextIndex === images.length ? 0 : nextIndex;

    setImage(getImage(index, images));
  }

  function prevImage() {
    const nextIndex = image.index - 1;
    const index = nextIndex < 0 ? images.length - 1 :nextIndex;

    setImage(getImage(index, images));
  }

  function zoomIn() {
    const target = document.querySelector(".viewer-image") as HTMLImageElement;
    const scale = parseFloat(target.style.getPropertyValue("--scale"));
    let nextScale = scale + scale * 0.15;

    if (nextScale > 16) {
      nextScale = 16;
    }
    target.style.setProperty("--scale", (nextScale).toString());
  }

  function zoomOut() {
    const target = document.querySelector(".viewer-image") as HTMLImageElement;
    const scale = parseFloat(target.style.getPropertyValue("--scale"));
    let nextScale = scale - scale * 0.15;

    if (nextScale < 0.2) {
      nextScale =  0.2;
    }
    target.style.setProperty("--scale", (nextScale).toString());
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const { key } = event;

    if (key === "ArrowLeft") {
      prevImage();
    }
    else if (key === "ArrowRight") {
      nextImage();
    }
    else if (key === "=") {
      zoomIn();
    }
    else if (key === "-") {
      zoomOut();
    }
    else if (key === "Escape" ) {
      close();
    }
  });
  const onWheel = useEffectEvent((event: WheelEvent) => {
    const { deltaY } = event;

    if (deltaY > 0) {
      zoomOut();

    }
    else if (deltaY < 0) {
      zoomIn();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [image]);

  function resetImage() {
    const target = document.querySelector(".viewer-image") as HTMLImageElement;
    const container = document.querySelector(".viewer-image-container") as HTMLDivElement;

    target.style.setProperty("--dir", "1");
    target.style.setProperty("--scale", initialScale.current.toString());
    container.style.setProperty("--x", "50%");
    container.style.setProperty("--y", "50%");
  }

  function mirrorImage() {
    const target = document.querySelector(".viewer-image") as HTMLImageElement;
    const dir = parseInt(target.style.getPropertyValue("--dir"), 10);

    target.style.setProperty("--dir", (dir === 1 ? -1 : 1).toString());
  }

  function showInOriginalSize() {
    const target = document.querySelector(".viewer-image") as HTMLImageElement;
    target.style.setProperty("--scale", "1");
  }

  function handlePointerDown(event: ReactPointerEvent) {
    const imageElement = imageRef.current;

    if (!imageElement || event.button !== 0 || (event.target as Element | null)?.closest(".viewer-bar")) {
      return;
    }
    const rect = imageElement.getBoundingClientRect();
    const translateAmount = 0.5;
    const x = event.clientX - rect.left - (rect.width * translateAmount);
    const y = event.clientY - rect.top - (rect.height * translateAmount);

    pointerPosStart.current.x = x;
    pointerPosStart.current.y = y;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    root.current.style.cursor = "grabbing";
    root.current.style.userSelect = "none";
  }

  function handlePointerMove(event: PointerEvent) {
    const target = document.querySelector(".viewer-image-container") as HTMLImageElement;
    const { clientX, clientY } = event;
    const x = clientX - pointerPosStart.current.x;
    const y = clientY - pointerPosStart.current.y;

    target.style.setProperty("--x", `${x}px`);
    target.style.setProperty("--y", `${y}px`);
  }

  function handlePointerUp() {
    root.current.style.cursor = "";
    root.current.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
  }

  function handleImageLoad(event: SyntheticEvent) {
    const target = event.target as HTMLImageElement;
    const { width, height, naturalWidth, naturalHeight } = target;
    const { clientWidth, clientHeight } = document.documentElement;
    let scale = 1;

    if (width > height) {
      scale = clientWidth / width;

      if (scale * height >= clientHeight) {
        scale = clientHeight / height;
      }
    }
    else if (height >= clientHeight) {
      scale = clientHeight / height;

      if (scale * width >= clientWidth) {
        scale = clientWidth / width;
      }
    }
    else {
      scale = clientHeight / height;
    }
    initialScale.current = scale;

    target.parentElement!.style.setProperty("--x", "50%");
    target.parentElement!.style.setProperty("--y", "50%");
    target.style.setProperty("--scale", scale.toString());
    target.style.setProperty("--dir", randomizeFlip ? (Math.random() < 0.5 ? "1" : "-1") : "1");
    fileService.setImageDimensions(images[image.index].name, naturalWidth, naturalHeight);

    if (onImageReady) {
      onImageReady(event);
    }
  }

  function togglePip() {
    pip.toggle({
      data: {
        image,
        count: images.length
      },
      actions: {
        skip: () => skip!(true),
        pause: () => pause!()
      }
    });
  }

  async function copyImage() {
    const file = images[image.index].file;
    let data = null;

    if (ClipboardItem.supports(file.type)) {
      data = {
        [file.type]: file
      };
      return;
    }
    const blob = await fileService.convertImageToPng(file.name);

    if (blob) {
      data = {
        [blob.type]: blob
      };
    }

    if (data) {
      const clipboardItem = new ClipboardItem(data);
      await window.navigator.clipboard.write([clipboardItem]);

      setCopyMessage("Copied");
    }
    else {
      setCopyMessage("Failed to copy");
    }
  }

  function dismissMessage() {
    setCopyMessage("");
  }

  return (
    <div className={`viewer${inSession ? "" : " overlay"}`} onPointerDown={handlePointerDown}>
      {copyMessage ? <Toast message={copyMessage} position="top" offset="48px" duration={500} dismiss={dismissMessage}/> : null}
      {hideControls ? null : (
        <div className="viewer-bar viewer-top-bar">
          {inSession && pip.isSupported() ? (
            <button className="btn icon-btn" onClick={togglePip} title="Picture-in-picture">
              <Icon id="pip"/>
            </button>
          ) : null}
          <button className="btn icon-btn" onClick={copyImage} title="Copy image">
            <Icon id="copy"/>
          </button>
          <button className="btn icon-btn" onClick={showInOriginalSize} title="Original size">
            <Icon id="image-full"/>
          </button>
          <button className="btn icon-btn" onClick={mirrorImage} title="Mirror horizontally">
            <Icon id="flip-horizontal"/>
          </button>
          <button className="btn icon-btn" onClick={resetImage} title="Reset">
            <Icon id="reset"/>
          </button>
          {inSession ? (
            <button className="btn icon-btn" onClick={pause} title="pause">
              <Icon id="pause"/>
            </button>
          ) : (
          <button className="btn icon-btn" onClick={close} title="Close">
            <Icon id="close"/>
          </button>
          )}
        </div>
      )}
      <div className="viewer-image-container">
        <img src={image.url} className="viewer-image" onLoad={handleImageLoad} draggable="false" ref={imageRef}/>
      </div>
      {hideControls ? null : (
        <div className="viewer-bar viewer-bottom-bar">
          {inSession ? null : <span className="viewer-bar-item-info text-overflow">{images[image.index].name}</span>}
          <span className="viewer-bar-item-info">{image.index + 1} / {images.length}</span>
          {inSession && skip ? (
            <button className="btn text-btn" onClick={() => skip(true)}>Skip</button>
          ): (
            <>
              <button className="btn icon-btn" onClick={prevImage} title="Previous">
                <Icon id="chevron-left"/>
              </button>
              <button className="btn icon-btn" onClick={nextImage} title="Next">
                <Icon id="chevron-right"/>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
