import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { shuffleArray } from "@/utils";
import * as filesService from "services/files";
import Session from "components/Session/Session";
import ImageList from "components/ImageList/ImageList";
import BottomBar from "components/BottomBar/BottomBar";
import Splash from "components/Splash/Splash";
import Icon from "components/Icon/Icon";

function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sortOptions, setSortOptions] = useState({ sortBy: "default", sortOrder: 1 });
  const seletedImageCount = images.filter(image => image.selected).length;
  const [uploading, setUploading] = useState(false);

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
      duration: HTMLInputElement;
      grace: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    const { count, randomize, duration, grace } = elements;
    const seletedImages = images.filter(image => image.selected);
    const sessionImages =  randomize.checked ?
      shuffleArray(seletedImages).slice(0, parseInt(count.value, 10)) :
      seletedImages.slice(0, parseInt(count.value, 10));

    if (!sessionImages.length) {
      return;
    }
    const preferences = {
      count: parseInt(count.value, 10),
      randomize: randomize.checked,
      duration: parseInt(duration.value, 10),
      grace: parseInt(grace.value, 10),
    };

    if (preferences.count < 1 || preferences.duration < 1 || preferences.grace < 1) {
      return;
    }
    setSession({
      ...preferences,
      images: sessionImages
    });
    localStorage.setItem("preferences", JSON.stringify(preferences));
  }

  function closeSession() {
    filesService.cleanupPreloadedImages();
    setSession(null);
  }

  function resetSelected() {
    setImages(images.map(image => ({ ...image, selected: true })));
  }

  function clearList() {
    setImages([]);
    filesService.resetThumbs();
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>, index: number) {
    if (!event.target) {
      return;
    }
    const newImages = images.with(index, { ...images[index], selected: event.target.checked });
    setImages(newImages);
  }

  function sortImages(sortBy: string, sortOrder: number = 1) {
    if (sortBy === sortOptions.sortBy && sortOrder === sortOptions.sortOrder) {
      return;
    }
    const sortedFiles = filesService.sortFiles(images, { sortBy, sortOrder });

    setImages(sortedFiles);
    setSortOptions({ sortBy, sortOrder });
  }

  if (session) {
    return <Session session={session} close={closeSession}/>;
  }
  return (
    <div className="images-view" onDrop={handleDrop}>
      {uploading ? (
        <div className="upload-status-indicator">
          <Icon id="spinner"/>
          <p>Uploading...</p>
        </div>
      ) : null}
      {images.length ?
        <ImageList images={images} handleImageSelection={handleImageSelection} sortOptions={sortOptions} sortImages={sortImages}/> :
        <Splash uploading={uploading} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange}/>
      }
      <BottomBar uploading={uploading} imageCount={images.length} selected={seletedImageCount} startSession={startSession} resetSelected={resetSelected} clearList={clearList} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange}/>
    </div>
  );
}

export default App;
