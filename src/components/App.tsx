import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { shuffleArray } from "@/utils";
import * as filesService from "services/files";
import Session from "components/Session/Session";
import ImageList from "components/ImageList/ImageList";
import BottomBar from "components/BottomBar/BottomBar";
import Splash from "components/Splash/Splash";
import Icon from "components/Icon/Icon";
import ImageViewer from "./ImageViewer/ImageViewer";

function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sortOptions, setSortOptions] = useState({ sortBy: "default", sortOrder: 1 });
  const seletedImageCount = images.filter(image => image.selected).length;
  const [uploading, setUploading] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ index: number } | null>(null);

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!event.dataTransfer) {
      return;
    }
    setUploading(true);
    event.dataTransfer.dropEffect = "copy";
    const newImages = await filesService.readItems(event.dataTransfer.items, images);

    setImages(images.concat(newImages));
    setUploading(false);
  }

  async function showFilePicker() {
    try {
      setUploading(true);
      const newImages = await filesService.showOpenFilePicker(images);
      setImages(images.concat(newImages));
    } catch (e) {
      console.log(e);
    } finally {
      setUploading(false);
    }
  }

  async function showDirPicker() {
    try {
      setUploading(true);
      const newImages = await filesService.showDirectoryPicker(images);
      setImages(images.concat(newImages));
    } catch (e) {
      console.log(e);
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange({ target }: ChangeEvent<HTMLInputElement>) {
    if (!target.files) {
      return;
    }
    const newImages = filesService.getUniqueImages(target.files as unknown as File[], images);
    setImages(images.concat(newImages));
    target.value = "";
  }

  function startSession(event: FormEvent) {
    event.preventDefault();

    interface FormElements extends HTMLFormControlsCollection {
      count: HTMLInputElement;
      randomize: HTMLInputElement;
      randomizeFlip: HTMLInputElement;
      duration: HTMLInputElement;
      durationSelect: HTMLSelectElement;
      grace: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const imageCache = JSON.parse(localStorage.getItem("imageCache")!) || {};

    const { count, randomize, randomizeFlip, duration, durationSelect, grace } = elements;
    const seletedImages = images.filter(image => image.selected);
    let sessionImages = randomize.checked ?
      shuffleArray(seletedImages).slice(0, parseInt(count.value, 10)) :
      seletedImages.slice(0, parseInt(count.value, 10));
    sessionImages = sessionImages.map(image => ({
      ...image,
      mirrored: randomizeFlip.checked ? Math.random() > 0.5 : false,
      count: imageCache[image.name] ? imageCache[image.name] + 1 : 1
    }));
    let durationValue = 0;

    if (durationSelect.value === "custom") {
      durationValue = parseInt(duration.value, 10);
    }
    else {
      durationValue = parseInt(durationSelect.value, 10);
    }

    if (!sessionImages.length) {
      return;
    }
    const preferences = {
      id: crypto.randomUUID(),
      count: parseInt(count.value, 10),
      randomize: randomize.checked,
      randomizeFlip: randomizeFlip.checked,
      duration: durationValue,
      grace: parseInt(grace.value, 10),
    };

    if (preferences.count < 1 || preferences.duration < 1 || preferences.grace < 1) {
      return;
    }
    setSession({
      ...preferences,
      images: sessionImages
    });

    let newImages = [...images];

    for (const sessionImage of sessionImages) {
      imageCache[sessionImage.name] = sessionImage.count;
      const index = newImages.findIndex(image => image.name === sessionImage.name);
      newImages = newImages.with(index, { ...newImages[index], count: sessionImage.count });
    }
    setImages(newImages);
    localStorage.setItem("imageCache", JSON.stringify(imageCache));
    localStorage.setItem("preferences", JSON.stringify(preferences));
  }

  function closeSession() {
    filesService.cleanupPreloadedImages();
    filesService.resetImageDimensions();
    setSession(null);
  }

  function resetSelected() {
    setImages(images.map(image => ({ ...image, selected: true })));
  }

  function clearList() {
    setImages([]);
    filesService.resetThumbs();
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>, name: string) {
    if (!event.target) {
      return;
    }
    const index = images.findIndex(image => image.name === name);
    const newImages = images.with(index, { ...images[index], selected: event.target.checked });
    setImages(newImages);

    if (session) {
      const sessionIndex = session.images.findIndex(image => image.name === name);
      const newSessionImages = session.images.with(sessionIndex, { ...session.images[sessionIndex], selected: event.target.checked });
      setSession({ ...session, images: newSessionImages });
    }
  }

  function toggleAllImages(sessionImages: Image[], toggle: boolean) {
    const newSessionImages: Image[] = [];
    let newImages: Image[] = [...images];

    for (const sessionImage of sessionImages) {
      const newImage = { ...sessionImage, selected: toggle };
      const index = newImages.findIndex(image => image.name === sessionImage.name);

      if (index !== -1) {
        newImages = newImages.with(index, newImage);
      }
      newSessionImages.push(newImage);
    }
    setImages(newImages);
    setSession({ ...session!, images: newSessionImages });
  }

  function sortImages(sortBy: string, sortOrder: number = 1) {
    if (sortBy === sortOptions.sortBy && sortOrder === sortOptions.sortOrder) {
      return;
    }
    const sortedFiles = filesService.sortFiles(images, { sortBy, sortOrder });

    setImages(sortedFiles);
    setSortOptions({ sortBy, sortOrder });
  }

  function hideImage() {
    setViewerImage(null);
  }

  function viewImage(index: number) {
    setViewerImage({ index });
  }

  function repeatSession(same: boolean) {
    if (!session) {
      return;
    }
    const id = crypto.randomUUID();

    if (same) {
      let images = session.images.filter(image => image.selected);

      if (session.randomize) {
        images = shuffleArray(images);
      }

      if (session.randomizeFlip) {
        images = images.map(image => ({ ...image, mirrored: Math.random() > 0.5 }));
      }
      setSession({ ...session, id, repeating: true, images });
    }
    else {
      const seletedImages = images.filter(image => image.selected);
      let sessionImages = session.randomize ?
        shuffleArray(seletedImages).slice(0, session.images.length) :
        seletedImages.slice(0, session.images.length);
      sessionImages = sessionImages.map(image => ({ ...image, mirrored: session.randomizeFlip ? Math.random() > 0.5 : false }));
      setSession({ ...session, id, repeating: true, images: sessionImages });
    }
  }

  function resetImageCache() {
    localStorage.removeItem("imageCache");
    setImages(images.map(image => ({ ...image, count: 0 })));
  }

  if (session) {
    return <Session session={session} toggleAllImages={toggleAllImages} close={closeSession} handleImageSelection={handleImageSelection} repeatSession={repeatSession} />;
  }
  return (
    <div className="images-view" onDrop={handleDrop}>
      {viewerImage ? <ImageViewer images={images} index={viewerImage.index} close={hideImage} /> : null}
      {uploading ? (
        <div className="upload-status-indicator">
          <Icon id="spinner" />
          <p>Uploading...</p>
        </div>
      ) : null}
      {images.length ?
        <ImageList images={images} handleImageSelection={handleImageSelection} sortOptions={sortOptions} sortImages={sortImages} viewImage={viewImage} resetImageCache={resetImageCache} /> :
        <Splash uploading={uploading} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} />
      }
      <BottomBar uploading={uploading} imageCount={images.length} selected={seletedImageCount} startSession={startSession} resetSelected={resetSelected} clearList={clearList} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} />
    </div>
  );
}

export default App;
