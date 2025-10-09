import { useState } from "react";
import * as themeService from "services/theme";
import Icon from "components/Icon/Icon";
import "./ThemeSelector.css";


export default function ThemeSelector() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "auto");

  function changeTheme(theme: string) {
    setTheme(theme);
    themeService.changeTheme(theme);
  }

  return (
    <div className="theme-btns">
      <button className={`btn icon-btn theme-btn${theme === "auto" ? " active" : ""}`}
        onClick={() => changeTheme("auto")} title="Theme auto">
        <Icon id="theme-light-dark"/>
      </button>
      <button className={`btn icon-btn theme-btn${theme === "light" ? " active" : ""}`}
        onClick={() => changeTheme("light")} title="Theme light">
        <Icon id="theme-light"/>
      </button>
      <button className={`btn icon-btn theme-btn${theme === "dark" ? " active" : ""}`}
        onClick={() => changeTheme("dark")} title="Theme dark">
        <Icon id="theme-dark"/>
      </button>
    </div>
  );
}
