function changeTheme(theme: string) {
  const html = document.documentElement;
  const meta = document.querySelector("meta[name=theme-color]");

  html.classList.remove("dark", "light");

  if (theme === "auto") {
    localStorage.removeItem("theme");

    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      meta!.setAttribute("content", "#f2f0ff");
    }
    else {
      meta!.setAttribute("content", "#2c2c30");
    }
    return;
  }
  html.classList.add(theme);
  meta!.setAttribute("content", theme === "dark" ? "#2c2c30" : "#f2f0ff");
  localStorage.setItem("theme", theme);
}

export {
  changeTheme
}
