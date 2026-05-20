
import type { ChangeEvent } from "react";
import Icon from "@/components/Icon/Icon";
import "./CustomDurationSelect.css";

type Props = {
  value: number;
  custom?: boolean;
  handleSelectChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function CustomDurationSelect({ value, custom = false, handleSelectChange, handleInputChange }: Props) {
  return (
    <div className={`select-container${custom ? " custom" : ""}`}>
      {custom && <Icon id="menu" />}
      <select className="input select custom-duration-select" onChange={handleSelectChange} value={custom ? "custom" : value} name="durationSelect">
        <option value="30">30 sec</option>
        <option value="60">1 min</option>
        <option value="120">2 min</option>
        <option value="180">3 min</option>
        <option value="300">5 min</option>
        <option value="600">10 min</option>
        <option value="900">15 min</option>
        <option value="1800">30 min</option>
        <option value="3600">1 hour</option>
        <option value="custom">Custom (sec)</option>
      </select>
      {custom && (
        <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={value} onChange={handleInputChange} name="duration" />
      )}
    </div>
  )
}
