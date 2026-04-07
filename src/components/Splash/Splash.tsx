import { type ChangeEvent, useState } from "react";
import FileUploadButton from "components/FileUploadButton/FileUploadButton";
import FolderUploadButton from "components/FolderUploadButton/FolderUploadButton";
import ThemeSelector from "components/ThemeSelector/ThemeSelector";
import "./Splash.css";

type Props = {
  uploading: boolean,
  showFilePicker: () => void,
  showDirPicker: () => void,
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
};

export default function Splash({ uploading, showFilePicker, showDirPicker, handleFileChange }: Props) {
  const [startImmediately, setStartImmediately] = useState(() => {
    const startImmediately = localStorage.getItem("startImmediately");

    return !!startImmediately;
  });

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.checked ? "1" : "";

    setStartImmediately(event.target.checked);
    localStorage.setItem("startImmediately", value);
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
