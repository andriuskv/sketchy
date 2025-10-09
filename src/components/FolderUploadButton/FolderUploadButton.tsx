import { type CSSProperties } from "react";
import Icon from "components/Icon/Icon";

type Props = {
  className?: string,
  text?: string,
  style?: CSSProperties,
  disabled?: boolean,
  showDirPicker?: () => void,
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FolderUploadButton({ className, text, style = {}, disabled, showDirPicker, handleFileChange }: Props) {
  if ((window as any).showOpenFilePicker) {
    return (
      <button className={`btn icon-text-btn${className ? ` ${className}` : ""}`} style={{ ... style }}
        onClick={showDirPicker} disabled={disabled}>
        <Icon id="folder"/>
        <span>{text}</span>
      </button>
    );
  }
  return (
    <label className={`btn icon-text-btn${className ? ` ${className}` : ""}`}
      style={{ ... style }}>
      <Icon id="folder"/>
      <span>{text}</span>
      {/* @ts-ignore-error */}
      <input type="file" className="sr-only" webkitdirectory="true" directory="true" allowdirs="true"
        onChange={handleFileChange} disabled={disabled}/>
    </label>
  );
}
