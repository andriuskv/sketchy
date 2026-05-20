import { useState, type ChangeEvent, type DragEvent } from "react";
import { shuffleArray } from "@/utils";
import * as filesService from "services/files";
import Practice from "components/Practice/Practice";
import ImageList from "components/ImageList/ImageList";
import BottomBar from "components/BottomBar/BottomBar";
import Splash from "components/Splash/Splash";
import Icon from "components/Icon/Icon";
import ImageViewer from "./ImageViewer/ImageViewer";
import { getDefaultSession } from "@/helpers";
import Tooltip from "./Tooltip";

function findActiveItem(sessions: FormSession[], programs: Program[]): FormSession | Program {
  return (sessions.find(session => session.active) || programs.find(program => program.active))!;
}

function App() {
  const [sessions, setSessions] = useState<FormSession[]>(() => {
    const sessions = localStorage.getItem("sessions");

    return sessions ? JSON.parse(sessions).map((session: FormSession) => ({
      ...session,
      type: "session"
    })) : [getDefaultSession()];
  });
  const [programs, setPrograms] = useState<Program[]>(() => {
    const programs = localStorage.getItem("programs");

    return programs ? JSON.parse(programs) : [];
  });
  const activeItem = findActiveItem(sessions, programs) || sessions[0];
  const [images, setImages] = useState<Image[]>([]);
  const [practice, setPractice] = useState<Practice | null>(null);
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
      const updatedImages = images.concat(newImages);
      setImages(updatedImages);

      const startImmediately = localStorage.getItem("startImmediately");

      if (startImmediately) {
        startPractice(activeItem, updatedImages);
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
        startPractice(activeItem, updatedImages);
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
      startPractice(activeItem, updatedImages);
    }
  }

  function buildSessionPractice(item: FormSession, images: Image[], imageCache: Record<string, number>): Practice | undefined {
    const seletedImages = images.filter(image => image.selected);
    let sessionImages = item.randomize ?
      shuffleArray(seletedImages).slice(0, item.count) :
      seletedImages.slice(0, item.count);

    if (!sessionImages.length) {
      throw new Error("Session must have at least one image");
    }
    sessionImages = sessionImages.map(image => ({
      ...image,
      mirrored: item.randomizeFlip ? Math.random() > 0.5 : false,
      count: imageCache[image.name] ? imageCache[image.name] + 1 : 1
    }));

    return {
      id: crypto.randomUUID(),
      items: [{
        ...item,
        type: "session",
        duration: item.duration * 1000,
        grace: item.grace * 1000,
        images: sessionImages
      } as PracticeSession]
    };
  }

  function buildProgramPractice(program: Program, images: Image[], imageCache: Record<string, number>): Practice | undefined {
    const seletedImages = images.filter(image => image.selected);
    const items = [];

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

  function startPractice(item: FormSession | Program, imageList: Image[] = images) {
    const imageCache = JSON.parse(localStorage.getItem("imageCache")!) || {};
    let practice: Practice | undefined;

    if (item.type === "session") {
      practice = buildSessionPractice(item, imageList, imageCache);

      if (!practice) {
        return;
      }
    } else {
      practice = buildProgramPractice(item, imageList, imageCache);

      if (!practice) {
        return;
      }
    }

    setPractice(practice);

    let newImages = imageList;

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
      <BottomBar sessions={sessions} programs={programs} activeItem={activeItem} uploading={uploading} imageCount={images.length} selected={seletedImageCount} setSessions={setSessions} setPrograms={setPrograms} startPractice={startPractice} resetSelected={resetSelected} clearList={clearList} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} />
      <Tooltip />
    </div>
  );
}

export default App;
