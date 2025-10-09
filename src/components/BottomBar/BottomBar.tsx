import { useState, type FormEvent, type ChangeEvent } from "react";
import Dropdown from "components/Dropdown/Dropdown";
import FileUploadButton from "components/FileUploadButton/FileUploadButton";
import FolderUploadButton from "components/FolderUploadButton/FolderUploadButton";
import "./bottom-bar.css";

type Props = {
  uploading: boolean,
  imageCount: number,
  selected: number,
  startSession: (event: FormEvent) => void,
  resetSelected: () => void,
  clearList: () => void,
  showFilePicker: () => void,
  showDirPicker: () => void,
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
};

export default function BottomBar({ uploading, imageCount, selected, startSession, resetSelected, clearList, showFilePicker, showDirPicker, handleFileChange }: Props) {
  const [state, setState] = useState<Prefs>(() => {
    const preferences = localStorage.getItem("preferences");

    return {
      count: 20,
      randomize: true,
      duration: 120,
      grace: 5,
      ...(preferences ? JSON.parse(preferences) : null)
    };
  });

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;

    setState({
      ...state,
      [target.name]: value
    });
  }

  return (
    <form className="container bottom-bar" onSubmit={startSession}>
      <div className="bottom-bar-left">
        <h4 className="bottom-bar-title">Preferences</h4>
        <label className="bottom-bar-form-label">
          <span className="label-left">Size</span>
          <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={state.count} onChange={handleInputChange} name="count"/>
        </label>
        <label className="checkbox-container bottom-bar-form-label">
          <span className="label-left">Randomize</span>
          <input className="sr-only checkbox-input" type="checkbox" checked={state.randomize} onChange={handleInputChange} name="randomize"/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className="bottom-bar-form-label">
          <span className="label-left">Duration</span>
          <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={state.duration} onChange={handleInputChange}  name="duration"/>
        </label>
        <label className="bottom-bar-form-label">
          <span className="label-left">Grace period</span>
          <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={state.grace} onChange={handleInputChange}  name="grace"/>
        </label>
      </div>
      <div className="bottom-bar-right">
        <span className="bottom-bar-image-count">{imageCount} image(s){selected === imageCount ? null : `, ${selected} selected`}</span>
        <div className="bottom-bar-right-buttons">
          <Dropdown>
            <button type="button" className="btn text-btn dropdown-btn" onClick={clearList}>Clear list</button>
            <FileUploadButton className="dropdown-btn" text="Upload files"
              showFilePicker={showFilePicker} handleFileChange={handleFileChange} disabled={uploading}/>
            <FolderUploadButton className="dropdown-btn" text="Upload folder"
              showDirPicker={showDirPicker} handleFileChange={handleFileChange} disabled={uploading}/>
          </Dropdown>
          <button type="submit" className="btn primary-btn" disabled={selected === 0}>Start</button>
        </div>
        {selected === imageCount ? null : <button type="button" className="btn text-btn" onClick={resetSelected}>Reset</button>}
      </div>
    </form>
  );
}
