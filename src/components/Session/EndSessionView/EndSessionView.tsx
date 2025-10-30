import { useState } from "react";
import Icon from "components/Icon/Icon";
import ImageList from "components/ImageList/ImageList";
import "./EndSessionView.css";
import ImageViewer from "@/components/ImageViewer/ImageViewer";

type Props = {
  images: Image[],
  close: () => void
}

type StateImage = {
  index: number
}

export default function EndSessionView({ images, close }: Props) {
  const [image, setImage] = useState<StateImage | null>(null);

  function hideImage() {
    setImage(null);
  }

  function viewImage(index: number) {
    setImage({ index });
  }

  return (
    <>
      {image ? <ImageViewer images={images} index={image.index} overlay close={hideImage}/> : null}
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
