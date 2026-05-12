import { useState, type ChangeEvent } from "react";
import Icon from "components/Icon/Icon";
import ImageList from "components/ImageList/ImageList";
import "./EndPracticeView.css";
import ImageViewer from "@/components/ImageViewer/ImageViewer";
import Dropdown from "@/components/Dropdown/Dropdown";
import { formatDuration } from "@/utils";
import ToTop from "@/components/ImageList/ToTop/ToTop";

type Props = {
  practice: Practice,
  toggleAllImages: (practice: Practice, toggle: boolean) => void,
  handleImageSelection: (event: ChangeEvent<HTMLInputElement>, name: string, itemIndex: number) => void,
  repeatPractice: (same: boolean) => void,
  close: () => void
}

export default function EndPracticeView({ practice, toggleAllImages, handleImageSelection, repeatPractice, close }: Props) {
  const images = practice.items.flatMap(item => item.type === "session" ? item.images : []);
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
    toggleAllImages(practice, nextSelected);
  }

  function viewItemImage(imageIndex: number, itemIndex: number) {
    let imageOffset = 0;
    for (let i = 0; i < itemIndex; i++) {
      if (practice.items[i].type === "session") {
        imageOffset += (practice.items[i] as PracticeSession).images.length;
      }
    }
    viewImage(imageOffset + imageIndex);
  }

  return (
    <>
      {image ? <ImageViewer images={images} index={image.index} close={hideImage} /> : null}
      <div className="end-practice-view">
        <div className="container end-practice-view-header">
          <button className="btn icon-text-btn end-practice-view-close-btn" onClick={close}>
            <Icon id="close" />
            <span>End practice</span>
          </button>
          <Dropdown>
            <button className="btn dropdown-btn text-btn" onClick={toggleSelected}>{selected ? "Deselect" : "Select"} all images</button>
            <button className="btn dropdown-btn text-btn" onClick={() => repeatPractice(false)}>Repeat practice (new)</button>
            <button className="btn dropdown-btn text-btn" onClick={() => repeatPractice(true)}>Repeat practice (same)</button>
          </Dropdown>
        </div>
        {practice.items.length > 1 ? (
          <>
            <div className="end-practice-image-lists">
              {practice.items.map((item, index) => {
                if (item.type === "session") {
                  return (
                    <div key={`${item.id}-${index}`} className="end-practice-image-list">
                      <div className="container end-practice-image-list-header">
                        <h3>{item.title}</h3>
                        <div className="end-practice-image-list-header-info">
                          <div className="end-practice-image-list-header-info-item">
                            <Icon id="image" title="Images" size="16px"></Icon>
                            <div>{item.count}/{item.images.filter(image => image.selected).length}</div>
                          </div>
                          {item.randomize ? (
                            <Icon id="shuffle" className="end-practice-image-list-header-info-item" title="Randomize" size="16px"></Icon>
                          ) : null}
                          <div className="end-practice-image-list-header-info-item">
                            <Icon id="clock" title="Duration" size="16px"></Icon>
                            <div>{formatDuration(item.duration / 1000)}</div>
                          </div>
                          {item.randomizeFlip ? (
                            <Icon id="mirror" className="end-practice-image-list-header-info-item" title="Randomize flip" size="16px"></Icon>
                          ) : null}
                          <div className="end-practice-image-list-header-info-item">
                            <Icon id="sleep" title="Grace period" size="16px"></Icon>
                            <div>{formatDuration(item.grace / 1000)}</div>
                          </div>
                        </div>
                      </div>
                      <ImageList
                        images={item.images}
                        viewImage={imageIndex => viewItemImage(imageIndex, index)}
                        handleImageSelection={(event, name) => handleImageSelection(event, name, index)}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
            <ToTop />
          </>
        ) : <ImageList images={images} viewImage={viewImage} handleImageSelection={(event, name) => handleImageSelection(event, name, 0)} />}
      </div>
    </>
  );
}
