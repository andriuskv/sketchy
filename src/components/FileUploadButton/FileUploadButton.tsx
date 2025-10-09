import { type CSSProperties } from "react";
import Icon from "components/Icon/Icon";

type Props = {
  className?: string,
  text?: string,
  style?: CSSProperties,
  disabled?: boolean,
  showFilePicker?: () => void,
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FileUploadButton({ className, text, style = {}, disabled, showFilePicker, handleFileChange }: Props) {
  if ((window as any).showOpenFilePicker) {
    return (
      <button className={`btn icon-text-btn${className ? ` ${className}` : ""}`} style={{ ... style }}
        onClick={showFilePicker} disabled={disabled}>
        <Icon id="file"/>
        <span>{text}</span>
      </button>
    );
  }
  return (
    <label className={`btn icon-text-btn${className ? ` ${className}` : ""}`}
      style={{ ... style }}>
      <Icon id="file"/>
      <span>{text}</span>
      <input type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} disabled={disabled}/>
    </label>
  );
}
