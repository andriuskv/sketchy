import { useState, useRef, type ChangeEvent, type DragEvent, type SubmitEvent } from "react";
import { getRandomString, shuffleArray } from "@/utils";
import * as filesService from "services/files";
import Practice from "components/Practice/Practice";
import ImageList from "components/ImageList/ImageList";
import BottomBar from "components/BottomBar/BottomBar";
import Splash from "components/Splash/Splash";
import Icon from "components/Icon/Icon";
import ImageViewer from "./ImageViewer/ImageViewer";

// TODO: move pref validation to bottom bar
function getSessions(): FormSession[] {
  const sessions = localStorage.getItem("sessions");

  return sessions ? JSON.parse(sessions) : [getDefaultSession()];
}

function getPrograms(): Program[] {
  const programs = localStorage.getItem("programs");

  return programs ? JSON.parse(programs) : [];
}

function getDefaultSession(): FormSession {
  return {
    type: "session",
    title: "Default",
    id: getRandomString(4),
    count: 10,
    randomize: true,
    randomizeFlip: false,
    duration: 180,
    customDuration: false,
    grace: 5,
    active: false
  };
}

// TODO: temp for now, need to rewrite bottom bar and session form
function getActiveItem(): FormSession | Program {
  const sessions = getSessions();
  const programs = getPrograms();
  const session = sessions.find(session => session.active);

  if (session) {
    return session;
  }
  const program = programs.find(program => program.active);

  if (program) {
    return program;
  }
  return getDefaultSession();
}


function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [sortOptions, setSortOptions] = useState({ sortBy: "default", sortOrder: 1 });
  const seletedImageCount = images.filter(image => image.selected).length;
  const [uploading, setUploading] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ index: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
      const updatedImages = images.concat(newImages);
      setImages(updatedImages);

      const startImmediately = localStorage.getItem("startImmediately");

      if (startImmediately) {
        startPractice(formRef.current!, getActiveItem(), updatedImages);
      }
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
      const updatedImages = images.concat(newImages);
      setImages(updatedImages);

      const startImmediately = localStorage.getItem("startImmediately");

      if (startImmediately) {
        startPractice(formRef.current!, getActiveItem(), updatedImages);
      }
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
    const updatedImages = images.concat(newImages);
    setImages(updatedImages);
    target.value = "";

    const startImmediately = localStorage.getItem("startImmediately");

    if (startImmediately) {
      startPractice(formRef.current!, getActiveItem(), updatedImages);
    }
  }

  function buildSessionPractice(formElement: HTMLFormElement, images: Image[], imageCache: Record<string, number>, item: FormSession | null): Practice | undefined {
    interface FormElements extends HTMLFormControlsCollection {
      count: HTMLInputElement;
      randomize: HTMLInputElement;
      randomizeFlip: HTMLInputElement;
      duration: HTMLInputElement;
      durationSelect: HTMLSelectElement;
      grace: HTMLInputElement;
    }

    const elements = formElement.elements as FormElements;
    const { count, randomize, randomizeFlip, duration, durationSelect, grace } = elements;
    const seletedImages = images.filter(image => image.selected);
    let sessionImages = randomize.checked ?
      shuffleArray(seletedImages).slice(0, parseInt(count.value, 10)) :
      seletedImages.slice(0, parseInt(count.value, 10));

    if (!sessionImages.length) {
      throw new Error("Session must have at least one image");
    }
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

    const preferences = {
      id: crypto.randomUUID(),
      count: parseInt(count.value, 10),
      randomize: randomize.checked,
      randomizeFlip: randomizeFlip.checked,
      duration: durationValue * 1000,
      grace: parseInt(grace.value, 10) * 1000,
    };

    if (preferences.count < 1 || preferences.duration < 1 || preferences.grace < 1) {
      throw new Error("Session must have a duration and grace period of at least 1 second");
    }

    localStorage.setItem("preferences", JSON.stringify(preferences));

    return {
      id: crypto.randomUUID(),
      items: [{
        ...preferences,
        type: "session",
        title: item?.title,
        images: sessionImages
      } as PracticeSession]
    };
  }

  function buildProgramPractice(program: Program, images: Image[], imageCache: Record<string, number>): Practice | undefined {
    const seletedImages = images.filter(image => image.selected);
    const items = [];
    const sessions = getSessions();

    for (const item of program.items) {
      if (item.type === "session") {
        const session = sessions.find(session => session.id === item.id);

        if (!session) {
          throw new Error(`Session "${item.title}" not found`);
        }
        let sessionImages = session.randomize ?
          shuffleArray(seletedImages).slice(0, session.count) :
          seletedImages.slice(0, session.count);

        if (!sessionImages.length) {
          throw new Error(`Session "${session.title}" must have at least one image`);
        }

        if (session.count < 1 || session.duration < 1 || session.grace < 1) {
          throw new Error(`Session "${session.title}" must have a duration and grace period of at least 1 second`);
        }
        sessionImages = sessionImages.map(image => ({
          ...image,
          mirrored: session.randomizeFlip ? Math.random() > 0.5 : false,
          count: imageCache[image.name] ? imageCache[image.name] + 1 : 1
        }));

        items.push({
          ...session,
          ...item,
          duration: session.duration * 1000,
          grace: session.grace * 1000,
          images: sessionImages
        })
      }
      else {
        items.push({
          ...item,
          duration: item.duration * 1000
        });
      }
    }

    return {
      id: crypto.randomUUID(),
      items
    };
  }


  function startPractice(formElement: HTMLFormElement, item: FormSession | Program | null, images: Image[]) {
    const imageCache = JSON.parse(localStorage.getItem("imageCache")!) || {};
    let practice: Practice | undefined;

    if (!item || item.type === "session") {
      practice = buildSessionPractice(formElement, images, imageCache, item);

      if (!practice) {
        return;
      }
    } else {
      practice = buildProgramPractice(item, images, imageCache);

      if (!practice) {
        return;
      }
    }

    setPractice(practice);

    let newImages = images;

    for (const item of practice.items) {
      if (item.type === "session") {
        for (const sessionImage of item.images) {
          imageCache[sessionImage.name] = sessionImage.count;
          const index = newImages.findIndex(image => image.name === sessionImage.name);
          newImages = newImages.with(index, { ...newImages[index], count: sessionImage.count });
        }
      }
    }
    setImages(newImages);
    localStorage.setItem("imageCache", JSON.stringify(imageCache));
  }

  function handleFormSubmit(event: SubmitEvent, item: FormSession | Program | null) {
    event.preventDefault();
    startPractice(event.target as HTMLFormElement, item, images);
  }

  function quitPractice() {
    filesService.cleanupPreloadedImages();
    filesService.resetImageDimensions();
    setPractice(null);
  }

  function resetSelected() {
    setImages(images.map(image => ({ ...image, selected: true })));
  }

  function clearList() {
    setImages([]);
    filesService.resetThumbs();
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>, name: string, itemIndex?: number) {
    if (!event.target) {
      return;
    }
    const index = images.findIndex(image => image.name === name);
    const newImages = images.with(index, { ...images[index], selected: event.target.checked });
    setImages(newImages);

    if (practice && itemIndex !== undefined) {
      const newItems = [];

      for (const item of practice.items) {
        if (item.type === "session") {
          const imageIndex = item.images.findIndex(image => image.name === name);

          if (imageIndex > -1) {
            const newSessionImages = item.images.with(imageIndex, {
              ...item.images[imageIndex],
              selected: event.target.checked
            });
            newItems.push({ ...item, images: newSessionImages });
          } else {
            newItems.push(item);
          }
        }
        else {
          newItems.push(item);
        }
      }
      setPractice({ ...practice, items: newItems });
    }
  }

  function toggleAllImages(practice: Practice, toggle: boolean) {
    let newImages: Image[] = [...images];
    const newItems = [];

    for (const item of practice.items) {
      if (item.type === "session") {
        const newSessionImages: Image[] = [];

        for (const [imageIndex, image] of Object.entries(item.images)) {
          const newImage = { ...image, selected: toggle };
          const globalIndex = newImages.findIndex(({ name }) => name === image.name);
          newImages = newImages.with(globalIndex, newImage);

          newSessionImages.push({
            ...item.images[parseInt(imageIndex, 10)],
            selected: toggle
          });
        }
        newItems.push({ ...item, images: newSessionImages });
      }
      else {
        newItems.push(item);
      }
    }
    setImages(newImages);
    setPractice({ ...practice, items: newItems });
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

  function repeatPractice(same: boolean) {
    if (!practice) {
      return;
    }
    const id = crypto.randomUUID();

    if (same) {
      const items = [];

      for (const item of practice.items) {
        if (item.type === "session") {
          let images = item.images.filter(image => image.selected);

          if (item.randomize) {
            images = shuffleArray(images);
          }

          if (item.randomizeFlip) {
            images = images.map(image => ({ ...image, mirrored: Math.random() > 0.5 }));
          }
          items.push({ ...item, images });
        }
        else {
          items.push(item);
        }
      }
      setPractice({ ...practice, repeatId: id, repeating: true, items });
    }
    else {
      const items = [];

      for (const item of practice.items) {
        if (item.type === "session") {
          const seletedImages = images.filter(image => image.selected);
          let sessionImages = item.randomize ?
            shuffleArray(seletedImages).slice(0, item.images.length) :
            seletedImages.slice(0, item.images.length);

          if (item.randomizeFlip) {
            sessionImages = sessionImages.map(image => ({ ...image, mirrored: Math.random() > 0.5 }));
          }
          items.push({ ...item, images: sessionImages });
        }
        else {
          items.push(item);
        }
      }
      setPractice({ ...practice, repeatId: id, repeating: true, items });
    }
  }

  function resetImageCache() {
    localStorage.removeItem("imageCache");
    setImages(images.map(image => ({ ...image, count: 0 })));
  }

  if (practice) {
    return <Practice practice={practice} toggleAllImages={toggleAllImages} close={quitPractice} handleImageSelection={handleImageSelection} repeatPractice={repeatPractice} />;
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
        <ImageList images={images} handleImageSelection={(event, name) => handleImageSelection(event, name)} sortOptions={sortOptions} sortImages={sortImages} viewImage={viewImage} resetImageCache={resetImageCache} /> :
        <Splash uploading={uploading} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} />
      }
      <BottomBar uploading={uploading} imageCount={images.length} selected={seletedImageCount} handleFormSubmit={handleFormSubmit} resetSelected={resetSelected} clearList={clearList} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} formRef={formRef} />
    </div>
  );
}

export default App;
