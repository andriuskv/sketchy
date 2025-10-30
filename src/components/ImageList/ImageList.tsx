import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { getThumb, generateThumb } from "services/files";
import "./image-list.css";

type ListProps = {
  images: {
    name: string,
    file: File,
    selected: boolean
  }[],
  handleImageSelection?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
  viewImage?: (index: number, file: File) => void
}

type ItemProps = {
  image: {
    name: string,
    file: File,
    selected: boolean
  },
  index: number,
  handleImageSelection?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
  viewImage?: (index: number, file: File) => void
}

function Item({ image, index, handleImageSelection, viewImage }: ItemProps) {
  const { inView, ref } = useInView({ root: document.querySelector(".image-list-container"), rootMargin: "200px 0px 512px 0px" });
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

export default function ImageList({ images, handleImageSelection, viewImage }: ListProps) {
  return (
    <div className="image-list-container">
      <ul className="container image-list">
        {images.map((image, index) => (
          <Item image={image} index={index} key={image.name}
            handleImageSelection={handleImageSelection} viewImage={viewImage}/>
        ))}
      </ul>
    </div>
  );
}
