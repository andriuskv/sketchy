import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { shuffleArray } from "@/utils";
import * as filesService from "services/files";
import ImageViewer from "components/ImageViewer/ImageViewer";
import ImageList from "components/ImageList/ImageList";
import BottomBar from "components/BottomBar/BottomBar";
import Splash from "components/Splash/Splash";
import Icon from "components/Icon/Icon";

// TODO: SPA
// TODO: maybe some pattern for splash

function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const seletedImages = images.filter(image => image.selected);
  const [uploading, setUploading] = useState(false);

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!event.dataTransfer) {
      return;
    }
    setUploading(true);
    event.dataTransfer.dropEffect = "copy";

    const items = await filesService.readItems(event.dataTransfer.items, images);

    setImages(images.concat(items.map(item => ({ file: item, name: item.name, selected: true }))));
    setUploading(false);
  }

  async function showFilePicker() {
    try {
      setUploading(true);
      const files = await filesService.showOpenFilePicker();
      setImages(images.concat(filesService.removeDuplicates(files, images)));
    } catch (e) {
      console.log(e);
    } finally {
      setUploading(false);
    }
  }

  async function showDirPicker() {
    try {
      setUploading(true);
      const files = await filesService.showDirectoryPicker();
      setImages(images.concat(filesService.removeDuplicates(files, images)));
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
    const newFiles: Image[] = [];

    for (const file of target.files) {
      newFiles.push({ file, name: file.name, selected: true });
    }
    setImages(images.concat(filesService.removeDuplicates(newFiles, images)));
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

  if (session) {
    return <ImageViewer session={session} close={closeSession}/>;
  }
  return (
    <div className="images-view" onDrop={handleDrop} data-dropdown-parent>
      {uploading ? (
        <div className="upload-status-indicator">
          <Icon id="spinner"/>
          <p>Uploading...</p>
        </div>
      ) : null}
      {images.length ?
        <ImageList images={images} handleImageSelection={handleImageSelection}/> :
        <Splash uploading={uploading} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange}/>
      }
      <BottomBar uploading={uploading} imageCount={images.length} selected={seletedImages.length} startSession={startSession} resetSelected={resetSelected} clearList={clearList} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange}/>
    </div>
  );
}

export default App;
