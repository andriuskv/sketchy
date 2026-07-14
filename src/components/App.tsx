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

  function pickImages(images: Image[], count: number, cache: Record<string, { seenCount: number, weight: number }>) {
    const shuffledImages = shuffleArray(images);

    if (shuffledImages.length === 0) {
      return [];
    }
    let weightSum = 1;

    for (const { weight } of Object.values(cache)) {
      weightSum += weight;
    }
    const pickedImages: Image[] = [];

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * weightSum;

      for (const image of shuffledImages.filter(image => !pickedImages.some(pickedImage => pickedImage.name === image.name))) {
        const weight = cache[image.name]?.weight || 0.01;

        if (weight < rand) {
          pickedImages.push(image);
          break;
        }
        else {
          rand += weight;
        }
      }
    }

    if (pickedImages.length < count) {
      const remaining = count - pickedImages.length;
      const remainingImages = shuffledImages.filter(image => !pickedImages.some(pickedImage => pickedImage.name === image.name)).slice(0, remaining);
      pickedImages.push(...remainingImages);
    }

    for (const image of pickedImages) {
      if (cache[image.name]) {
        cache[image.name].weight += 1 / (weightSum / cache[image.name].weight);
      }
      else {
        cache[image.name] = { seenCount: 0, weight: 0.01 };
      }
    }
    return pickedImages;
  }

  function buildSessionPractice(item: FormSession, images: Image[], cache: Record<string, { seenCount: number, weight: number }>): Practice | undefined {
    const seletedImages = images.filter(image => image.selected);
    let sessionImages = item.randomize ?
      pickImages(seletedImages, item.count, cache) :
      seletedImages.slice(0, item.count);

    if (!sessionImages.length) {
      throw new Error("Session must have at least one image");
    }
    sessionImages = sessionImages.map(image => ({
      ...image,
      mirrored: item.randomizeFlip ? Math.random() > 0.5 : false,
      seenCount: cache[image.name].seenCount + 1
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

  function buildProgramPractice(program: Program, images: Image[], cache: Record<string, { seenCount: number, weight: number }>): Practice | undefined {
    const seletedImages = images.filter(image => image.selected);
    const items = [];

    for (const item of program.items) {
      if (item.type === "session") {
        const session = sessions.find(session => session.id === item.id);

        if (!session) {
          throw new Error(`Session "${item.title}" not found`);
        }
        let sessionImages = session.randomize ?
          pickImages(seletedImages, session.count, cache) :
          seletedImages.slice(0, session.count);

        if (!sessionImages.length) {
          throw new Error(`Session "${session.title}" must have at least one image`);
        }
        sessionImages = sessionImages.map(image => ({
          ...image,
          mirrored: session.randomizeFlip ? Math.random() > 0.5 : false,
          seenCount: cache[image.name].seenCount + 1
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
    const cache = JSON.parse(localStorage.getItem("cache")!) || {};
    let practice: Practice | undefined;

    if (item.type === "session") {
      practice = buildSessionPractice(item, imageList, cache);

      if (!practice) {
        return;
      }
    } else {
      practice = buildProgramPractice(item, imageList, cache);

      if (!practice) {
        return;
      }
    }
    setPractice(practice);

    let newImages = imageList;

    for (const item of practice.items) {
      if (item.type === "session") {
        for (const sessionImage of item.images) {
          cache[sessionImage.name] = { ...cache[sessionImage.name], seenCount: sessionImage.seenCount };
          const index = newImages.findIndex(image => image.name === sessionImage.name);
          newImages = newImages.with(index, { ...newImages[index], seenCount: sessionImage.seenCount });
        }
      }
    }
    setImages(newImages);
    localStorage.setItem("cache", JSON.stringify(cache));
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
    const cache = JSON.parse(localStorage.getItem("cache")!) || {};
    const items = [];

    if (same) {
      for (const item of practice.items) {
        if (item.type === "session") {
          let images = item.images.filter(image => image.selected);

          if (item.randomize) {
            images = pickImages(images, item.count, cache);
          }
          images = images.map(image => ({
            ...image,
            mirrored: item.randomizeFlip ? Math.random() > 0.5 : false,
            seenCount: cache[image.name].seenCount + 1
          }));
          items.push({ ...item, images });
        }
        else {
          items.push(item);
        }
      }
    }
    else {
      const seletedImages = images.filter(image => image.selected);

      for (const item of practice.items) {
        if (item.type === "session") {
          let sessionImages = item.randomize ?
            pickImages(seletedImages, item.count, cache) :
            seletedImages.slice(0, item.count);

          sessionImages = sessionImages.map(image => ({
            ...image,
            mirrored: item.randomizeFlip ? Math.random() > 0.5 : false,
            seenCount: cache[image.name].seenCount + 1
          }));
          items.push({ ...item, images: sessionImages });
        }
        else {
          items.push(item);
        }
      }
    }
    setPractice({ ...practice, repeatId: id, repeating: true, items });

    let newImages = images;

    for (const item of items) {
      if (item.type === "session") {
        for (const sessionImage of item.images) {
          cache[sessionImage.name] = { ...cache[sessionImage.name], seenCount: sessionImage.seenCount };
          const index = newImages.findIndex(image => image.name === sessionImage.name);
          newImages = newImages.with(index, { ...newImages[index], seenCount: sessionImage.seenCount });
        }
      }
    }
    setImages(newImages);
    localStorage.setItem("cache", JSON.stringify(cache));
  }

  function resetCache() {
    localStorage.removeItem("cache");
    setImages(images.map(image => ({ ...image, seenCount: 0 })));
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
        <ImageList images={images} handleImageSelection={(event, name) => handleImageSelection(event, name)} sortOptions={sortOptions} sortImages={sortImages} viewImage={viewImage} resetCache={resetCache} /> :
        <Splash uploading={uploading} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} />
      }
      <BottomBar sessions={sessions} programs={programs} activeItem={activeItem} uploading={uploading} imageCount={images.length} selected={seletedImageCount} setSessions={setSessions} setPrograms={setPrograms} startPractice={startPractice} resetSelected={resetSelected} clearList={clearList} showFilePicker={showFilePicker} showDirPicker={showDirPicker} handleFileChange={handleFileChange} />
      <Tooltip />
    </div>
  );
}

export default App;
