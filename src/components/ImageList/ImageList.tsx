import { useEffect, useState, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { getThumb, generateThumb } from "services/files";
import "./image-list.css";
import ToTop from "./ToTop/ToTop";
import Sort from "./Sort/Sort";

type ListProps = {
  images: Image[],
  sortOptions?: {
    sortBy: string,
    sortOrder: number
  },
  handleImageSelection?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
  viewImage?: (index: number, file: File) => void,
  sortImages?: (sortBy: string, sortOrder?: number) => void
}

type ItemProps = {
  image: Image,
  index: number,
  container: React.RefObject<HTMLDivElement | null> ,
  handleImageSelection?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
  viewImage?: (index: number, file: File) => void
}

function Item({ image, index, container, handleImageSelection, viewImage }: ItemProps) {
  const { inView, ref } = useInView({ root: container.current, rootMargin: "200px 0px 512px 0px" });
  const [thumb, setThumb] = useState(() => getThumb(image.name));

  useEffect(() => {
    async function loadThumb() {
      const thumb = await generateThumb(image);

      if (thumb?.blob) {
        setThumb(thumb);
      }
    }

    if (inView && !thumb) {
      loadThumb();
    }
  }, [inView]);

  if (inView && thumb) {
    return (
      <li className={`image-list-item${image.selected ? " selected" : ""}`} ref={ref}>
        {handleImageSelection ? (
          <label>
            <img src={thumb.url} className="image-list-item-image" loading="lazy" draggable="false" alt=""/>
            <div className="image-list-item-checkbox">
              <input className="sr-only checkbox-input" type="checkbox" checked={image.selected} onChange={event => handleImageSelection(event, index)}/>
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
            </div>
          </label>
        ) : viewImage ? (
          <button className="btn image-list-view-btn" onClick={() => viewImage(index, image.file)}>
            <div className="image-list-item-name">{image.name}</div>
            <img src={thumb.url} className="image-list-item-image" loading="lazy" draggable="false" alt=""/>
          </button>
        ) : (
          <img src={thumb.url} className="image-list-item-image" loading="lazy" draggable="false" alt=""/>
        )}
      </li>
    );
  }
  return <li className="image-list-item" ref={ref}></li>;
}

export default function ImageList({ images, handleImageSelection, viewImage, sortOptions, sortImages }: ListProps) {
  const container = useRef<HTMLDivElement>(null);
  return (
    <div className="image-list-view">
      {sortOptions && sortImages ? <div className="container image-list-header">
        <Sort sortOptions={sortOptions} sortImages={sortImages}/>
      </div> : null}
      <div className="image-list-container" ref={container}>
        <ul className="container image-list">
          {images.map((image, index) => (
            <Item image={image} index={index} key={image.name} container={container}
              handleImageSelection={handleImageSelection} viewImage={viewImage}/>
          ))}
        </ul>
      </div>
      {handleImageSelection ? <ToTop offset="200px"/> : <ToTop/> }
    </div>
  );
}
