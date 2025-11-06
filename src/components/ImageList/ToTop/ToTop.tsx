import type { MouseEvent } from "react";
import { useState, useLayoutEffect, useRef } from "react";
import Icon from "components/Icon/Icon";
import "./ToTop.css";

export default function ToTop({ offset } : {offset?: string }) {
  const [state, setState] = useState<{visible: boolean, hiding?: boolean}>({ visible: false });
  const ref = useRef<HTMLButtonElement>(null);
  const scrolling = useRef(false);

  useLayoutEffect(() => {
    function handleScroll({ target }: Event) {
      if (scrolling.current) {
        return;
      }
      scrolling.current = true;

      requestAnimationFrame(() => {
        scrolling.current = false;

        if (!target) {
          return;
        }

        if ((target as HTMLElement).scrollTop > 0) {
          setState({ visible: true });
        }
        else {
          setState({ ...state, hiding: true });
          setTimeout(() => {
            setState({ visible: false });
          }, 200);
        }
      });
    }
    const element = ref.current!;
    const sibling = element.previousElementSibling!;

    if (element) {
      sibling.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (element) {
        sibling.removeEventListener("scroll", handleScroll);
      }
    };
  }, [state]);

  function handleClick({ currentTarget }: MouseEvent<HTMLButtonElement>) {
    if (currentTarget.previousElementSibling) {
      currentTarget.previousElementSibling.scrollTop = 0;
    }
  }

  return (
    <button className={`btn icon-btn to-top-button${state.visible ? " visible" : ""}${state.hiding ? " hiding" : ""}`}
      style={offset ? { bottom: offset } : {}} onClick={handleClick} ref={ref} title="To top">
      <Icon id="chevron-up"/>
    </button>
  );
}
