import { useEffect, useRef, useState, type SyntheticEvent, type PointerEvent as ReactPointerEvent, useEffectEvent } from "react";
import Icon from "components/Icon/Icon";
import ImageList from "components/ImageList/ImageList";
import "./EndSessionView.css";

type Props = {
  images: Image[],
  close: () => void
}

type StateImage = {
  index: number,
  url: string
}

export default function EndSessionView({ images, close }: Props) {
  const [image, setImage] = useState<StateImage | null>(null);
  const pointerPosStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const initialScale = useRef(1);
  const root = useRef(document.documentElement);

  function nextImage() {
    if (!image) {
      return;
    }
    const nextIndex = image.index + 1;
    const index = nextIndex === images.length ? 0 : nextIndex;

    URL.revokeObjectURL(image.url);

    setImage({
      index: index,
      url: URL.createObjectURL(images[index].file)
    });
  }

  function prevImage() {
    if (!image) {
      return;
    }
    const prevIndex = image.index - 1;

    URL.revokeObjectURL(image.url);

    if (prevIndex === -1) {
      setImage({
        index: images.length - 1,
        url: URL.createObjectURL(images[images.length - 1].file)
      });
      return;
    }
    setImage({
      index: prevIndex,
      url: URL.createObjectURL(images[prevIndex].file)
    });
  }

  function zoomIn() {
    if (!image) {
      return;
    }
    const target = document.querySelector(".end-session-expanded-image") as HTMLImageElement;
    const scale = parseFloat(target.style.getPropertyValue("--scale"));
    let nextScale = scale + scale * 0.15;

    if (nextScale > 16) {
      nextScale = 16;
    }
    target.style.setProperty("--scale", (nextScale).toString());
  }

  function zoomOut() {
    if (!image) {
      return;
    }
    const target = document.querySelector(".end-session-expanded-image") as HTMLImageElement;
    const scale = parseFloat(target.style.getPropertyValue("--scale"));
    let nextScale = scale - scale * 0.15;

    if (nextScale < 0.2) {
      nextScale =  0.2;
    }
    target.style.setProperty("--scale", (nextScale).toString());
  }

  function hideImage() {
    if (!image) {
      return;
    }
    URL.revokeObjectURL(image.url);
    setImage(null);
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
      hideImage();
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


  function viewImage(index: number, file: File) {
    setImage({
      index,
      url: URL.createObjectURL(file)
    });
  }

  function resetImage() {
    if (!image) {
      return;
    }
    const target = document.querySelector(".end-session-expanded-image") as HTMLImageElement;
    const container = document.querySelector(".end-session-expanded-image-container") as HTMLDivElement;

    target.style.setProperty("--dir", "1");
    target.style.setProperty("--scale", initialScale.current.toString());
    container.style.setProperty("--x", "50%");
    container.style.setProperty("--y", "50%");
  }

  function mirrorImage() {
    if (!image) {
      return;
    }
    const target = document.querySelector(".end-session-expanded-image") as HTMLImageElement;
    const dir = parseInt(target.style.getPropertyValue("--dir"), 10);

    target.style.setProperty("--dir", (dir === 1 ? -1 : 1).toString());
  }

  function showInOriginalSize() {
    if (!image) {
      return;
    }
    const target = document.querySelector(".end-session-expanded-image") as HTMLImageElement;
    target.style.setProperty("--scale", "1");
  }

  function handlePointerDown(event: ReactPointerEvent) {
    const imageElement = imageRef.current;

    if (!imageElement || !image || event.button !== 0) {
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
  }

  function handlePointerMove(event: PointerEvent) {
    if (!image) {
      return;
    }
    const target = document.querySelector(".end-session-expanded-image-container") as HTMLImageElement;
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
    window.removeEventListener("pointermove", handlePointerMove);
  }

  function handeImageLoad(event: SyntheticEvent) {
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
    target.style.setProperty("--scale", scale.toString());
    target.style.setProperty("--dir", "1");
  }

  return (
    <>
      {image ? (
        <div className="images-view-mask" onPointerDown={handlePointerDown}>
          <div className="images-view-top">
            <button className="btn icon-btn" onClick={showInOriginalSize} title="Original size">
              <Icon id="image-full"/>
            </button>
            <button className="btn icon-btn" onClick={mirrorImage} title="Mirror horizontally">
              <Icon id="flip-horizontal"/>
            </button>
            <button className="btn icon-btn" onClick={resetImage} title="Reset">
              <Icon id="reset"/>
            </button>
            <button className="btn icon-btn" onClick={hideImage} title="Close">
              <Icon id="close"/>
            </button>
          </div>
          <div className="end-session-expanded-image-container">
            <img src={image.url} className="end-session-expanded-image" onLoad={handeImageLoad} draggable="false" ref={imageRef}/>
          </div>
          <div className="images-view-bottom">
            <button className="btn icon-btn" onClick={prevImage} title="Previous">
              <Icon id="chevron-left"/>
            </button>
            <button className="btn icon-btn" onClick={nextImage} title="Next">
              <Icon id="chevron-right"/>
            </button>
          </div>
        </div>
      ) : null}
      <div className="end-session-image-view">
        <div className="container">
          <button className="btn icon-text-btn session-close-btn" onClick={close}>
            <Icon id="close"/>
            <span>Back to images</span>
          </button>
        </div>
        <ImageList images={images} viewImage={viewImage}/>
      </div>
    </>
  );
}
