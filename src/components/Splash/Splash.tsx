import { type ChangeEvent, useState, useEffect, useRef } from "react";
import * as dbService from "@/services/db";
import FileUploadButton from "components/FileUploadButton/FileUploadButton";
import FolderUploadButton from "components/FolderUploadButton/FolderUploadButton";
import ThemeSelector from "components/ThemeSelector/ThemeSelector";
import "./Splash.css";

type Props = {
  uploading: boolean,
  showFilePicker: () => void,
  showDirPicker: () => void,
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
  loadImagesFromHandle: (handle: FileSystemDirectoryEntry) => void
};

export default function Splash({ uploading, showFilePicker, showDirPicker, handleFileChange, loadImagesFromHandle }: Props) {
  const [startImmediately, setStartImmediately] = useState(() => {
    const startImmediately = localStorage.getItem("startImmediately");

    return !!startImmediately;
  });
  const first = useRef(true);
  const [lastUsed, setLastUsed] = useState<{ handle: FileSystemDirectoryEntry, date: number }[]>([]);

  useEffect(() => {
    if (first.current) {
      (async () => {
        setLastUsed((await dbService.getAll()).slice(0, 5));
        first.current = false;
      })();
    }
  }, []);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.checked ? "1" : "";

    setStartImmediately(event.target.checked);
    localStorage.setItem("startImmediately", value);
  }

  async function verifyPermission(handle: FileSystemDirectory) {
    const options = { mode: "read" };

    // Check if permission was already granted. If so, return true.
    if ((await handle.queryPermission(options)) === "granted") {
      return true;
    }
    // Request permission. If the user grants permission, return true.
    if ((await handle.requestPermission(options)) === "granted") {
      return true;
    }
    // The user didn't grant permission, so return false.
    return false;
  }

  async function loadLastDir({ handle }: { handle: FileSystemDirectoryEntry, date: number }) {
    const permission = await verifyPermission(handle);

    if (permission) {
      loadImagesFromHandle(handle);
    }
  }

  function clearLastUsed() {
    dbService.clearStore();
    setLastUsed([]);
  }

  return (
    <main className="splash">
      <div className="splash-title-container">
        <h1 className="splash-title">Sketchy</h1>
        <h2 className="splash-subtitle">Timed Drawing Practice</h2>
      </div>
      <p className="splash-description">Click to upload or drop your images here</p>
      <div className="splash-btns">
        <FileUploadButton className="splash-btn" text="Files"
          showFilePicker={showFilePicker} handleFileChange={handleFileChange} disabled={uploading} />
        <FolderUploadButton className="splash-btn" text="Folder"
          showDirPicker={showDirPicker} handleFileChange={handleFileChange} disabled={uploading} />
      </div>
      {lastUsed.length > 0 && (
        <div className="splash-last-used">
          <div className="splash-last-used-header">
            <p className="splash-last-used-head-title">Last used folders:</p>
            <button className="btn text-btn" onClick={clearLastUsed}>Clear</button>
          </div>
          <div className="splash-last-used-items">
            {lastUsed.map((item, index) => (
              <button key={index} className="btn" onClick={() => loadLastDir(item)}>{item.handle.name}</button>
            ))}
          </div>
        </div>
      )}
      <div className="splash-settings">
        <label className="checkbox-container">
          <input className="sr-only checkbox-input" type="checkbox" checked={startImmediately} onChange={handleInputChange} name="startImmediately" />
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span className="label-right">Start immediately</span>
        </label>
      </div>
      <ThemeSelector />
    </main>
  );
}
