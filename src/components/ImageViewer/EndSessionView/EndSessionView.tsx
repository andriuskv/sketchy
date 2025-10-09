import { useEffect, useState } from "react";
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

  useEffect(() => {
    function handleKeydown({ key }: KeyboardEvent) {
      if (key === "ArrowLeft") {
        prevImage();
      }
      if (key === "ArrowRight") {
        nextImage();
      }
      else if (key === "Escape" ) {
        hideImage();
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [image]);

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

  function viewImage(index: number, file: File) {
    setImage({
      index,
      url: URL.createObjectURL(file)
    });
  }

  function hideImage() {
    if (!image) {
      return;
    }
    URL.revokeObjectURL(image.url);
    setImage(null);
  }

  return (
    <>
      {image ? (
        <div className="images-view-mask">
          <button className="btn icon-btn" onClick={hideImage}>
            <Icon id="close"/>
          </button>
          <img src={image.url} className="end-session-expanded-image"/>
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
