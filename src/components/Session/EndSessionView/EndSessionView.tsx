import { useState, type ChangeEvent } from "react";
import Icon from "components/Icon/Icon";
import ImageList from "components/ImageList/ImageList";
import "./EndSessionView.css";
import ImageViewer from "@/components/ImageViewer/ImageViewer";

type Props = {
  images: Image[],
  handleImageSelection: (event: ChangeEvent<HTMLInputElement>, name: string) => void,
  close: () => void
}

export default function EndSessionView({ images, handleImageSelection, close }: Props) {
  const [image, setImage] = useState<{ index: number } | null>(null);

  function hideImage() {
    setImage(null);
  }

  function viewImage(index: number) {
    setImage({ index });
  }

  return (
    <>
      {image ? <ImageViewer images={images} index={image.index} close={hideImage} /> : null}
      <div className="end-session-image-view">
        <div className="container">
          <button className="btn icon-text-btn session-close-btn" onClick={close}>
            <Icon id="close" />
            <span>Back to images</span>
          </button>
        </div>
        <ImageList images={images} viewImage={viewImage} handleImageSelection={handleImageSelection} />
      </div>
    </>
  );
}
