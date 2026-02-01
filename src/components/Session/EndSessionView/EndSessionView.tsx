import { useState, type ChangeEvent } from "react";
import Icon from "components/Icon/Icon";
import ImageList from "components/ImageList/ImageList";
import "./EndSessionView.css";
import ImageViewer from "@/components/ImageViewer/ImageViewer";
import Dropdown from "@/components/Dropdown/Dropdown";

type Props = {
  images: Image[],
  toggleAllImages: (images: Image[], toggle: boolean) => void,
  handleImageSelection: (event: ChangeEvent<HTMLInputElement>, name: string) => void,
  repeatSession: (same: boolean) => void,
  close: () => void
}

export default function EndSessionView({ images, toggleAllImages, handleImageSelection, repeatSession, close }: Props) {
  const [image, setImage] = useState<{ index: number } | null>(null);
  const [selected, setSelected] = useState(true);

  function hideImage() {
    setImage(null);
  }

  function viewImage(index: number) {
    setImage({ index });
  }

  function toggleSelected() {
    const nextSelected = !selected;
    setSelected(nextSelected);
    toggleAllImages(images, nextSelected);
  }

  return (
    <>
      {image ? <ImageViewer images={images} index={image.index} close={hideImage} /> : null}
      <div className="end-session-image-view">
        <div className="container end-session-header">
          <button className="btn icon-text-btn session-close-btn" onClick={close}>
            <Icon id="close" />
            <span>End session</span>
          </button>
          <Dropdown>
            <button className="btn dropdown-btn text-btn" onClick={toggleSelected}>{selected ? "Deselect" : "Select"} all images</button>
            <button className="btn dropdown-btn text-btn" onClick={() => repeatSession(false)}>Repeat session (new)</button>
            <button className="btn dropdown-btn text-btn" onClick={() => repeatSession(true)}>Repeat session (same)</button>
          </Dropdown>
        </div>
        <ImageList images={images} viewImage={viewImage} handleImageSelection={handleImageSelection} />
      </div>
    </>
  );
}
