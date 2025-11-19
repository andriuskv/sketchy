import { useEffect, useRef, useState, type SyntheticEvent, type PointerEvent as ReactPointerEvent, useEffectEvent } from "react";
import * as fileService from "services/files";
import Icon from "components/Icon/Icon";
import "./ImageViewer.css";
import * as pip from "./picture-in-picture"

type Props = {
  images: Image[],
  index: number,
  overlay?: boolean,
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

export default function ImageViewer({ images, index, overlay, inSession, hideControls, pause, skip, onImageReady, close }: Props) {
  const [image, setImage] = useState<StateImage>(() => getImage(index, images));
  const pointerPosStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const initialScale = useRef(1);
  const root = useRef(document.documentElement);

  useEffect(() => {
    setImage(getImage(index, images));
  }, [index]);

  function nextImage() {
    const nextIndex = image.index + 1;
    const index = nextIndex === images.length ? 0 : nextIndex;

    setImage(getImage(index, images));
  }

  function prevImage() {
    const index = image.index - 1;

    if (index === -1) {
      setImage({
        index: images.length - 1,
        url: fileService.preloadImage(images[images.length - 1])
      });
      return;
    }
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

    if (!imageElement || event.button !== 0 || event.target.closest(".viewer-bar")) {
      return;
    }
    const containerElement = imageElement.parentElement!;
    const rect = containerElement.getBoundingClientRect();
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
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = document.documentElement.clientHeight;
    const { clientX, clientY } = event;
    const x = ((clientX - pointerPosStart.current.x) / viewWidth) * 100;
    const y = ((clientY - pointerPosStart.current.y) / viewHeight) * 100;

    target.style.setProperty("--x", `${x}%`);
    target.style.setProperty("--y", `${y}%`);
  }

  function handlePointerUp() {
    root.current.style.cursor = "";
    root.current.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
  }

  function handleImageLoad(event: SyntheticEvent) {
    const target = event.target as HTMLImageElement;
    const { width, height } = target;
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = document.documentElement.clientHeight;
    let scale = 1;

    if (width > height) {
      scale = viewWidth / width;

      if (scale * height >= viewHeight) {
        scale = viewHeight / height;
      }
    }
    else if (height >= viewHeight) {
      scale = viewHeight / height;

      if (scale * width >= viewWidth) {
        scale = viewWidth / width;
      }
    }
    else {
      scale = viewHeight / height;
    }
    initialScale.current = scale;

    target.parentElement!.classList.add("animate");
    target.parentElement!.style.setProperty("--x", "50%");
    target.parentElement!.style.setProperty("--y", "50%");
    target.style.setProperty("--scale", scale.toString());
    target.style.setProperty("--dir", "1");

    setTimeout(() => {
      target.parentElement!.classList.remove("animate");
    }, 200);

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

  return (
    <div className={`viewer${overlay ? " overlay" : ""}`} onPointerDown={handlePointerDown}>
      {hideControls ? null : (
        <div className="viewer-bar viewer-top-bar">
          {inSession && pip.isSupported() ? (
            <button className="btn icon-btn" onClick={togglePip} title="Picture-in-picture">
              <Icon id="pip"/>
            </button>
          ) : null}
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
