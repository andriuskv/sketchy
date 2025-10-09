import type { CSSProperties, MouseEvent as ReactMouseEvent, PropsWithChildren, ReactNode } from "react";
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import "./dropdown.css";
import ToggleBtn from "./ToggleBtn/ToggleBtn";

type Props = PropsWithChildren & {
  usePortal?: boolean,
  container?: {
    className: string
  },
  toggle?: {
    className?: string,
    isIconTextBtn?: boolean,
    isTextBtn?: boolean,
    iconId?: string,
    title?: string,
    body?: ReactNode
  },
  body?: {
    className: string
   }
}

type State = {
  id: string,
  visible: boolean,
  reveal?: boolean,
  hiding?: boolean,
  onTop?: boolean,
  data?: {
    top: number,
    bottom: number,
    height: number
  } | null;
}

export default function Dropdown({ container, toggle = {}, body, usePortal, children }: Props) {
  const [state, setState] = useState<State>({ id: getRandomString(), visible: false });
  const memoizedWindowClickHandler = useMemo(() => handleWindowClick, [state.id]);
  const isMounted = useRef(false);
  const drop = useRef<HTMLDivElement>(null);
  const toggleBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.removeEventListener("click", memoizedWindowClickHandler);
    };
  }, [memoizedWindowClickHandler]);

  useLayoutEffect(() => {
    if (state.reveal) {
      let onTop = false;

      if (state.data && drop.current) {
        const dropdownHeight = drop.current.getBoundingClientRect().height + 8;

        if (state.data.bottom + dropdownHeight > state.data.height && state.data.top > dropdownHeight) {
          onTop = true;
        }
      }
      setState({
        ...state,
        onTop,
        visible: true
      });
    }
  }, [state.reveal]);

  function getRandomString(length = 8) {
    return Math.random().toString(32).slice(2, 2 + length);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    if (state.visible) {
      hideDropdown();
      return;
    }
    let data: State["data"] = null;

    if (usePortal) {
      if (toggleBtn.current) {
        toggleBtn.current.style.setProperty("anchor-name", `--anchor-${state.id}`);
      }
      window.addEventListener("click", memoizedWindowClickHandler);
    }
    else {
      const currentTarget = event.currentTarget as HTMLElement;
      const container = currentTarget.parentElement!;
      const element = getParentElement(container);

      if (element) {
        element.style.position = "relative";

        data = {
          top: container.offsetTop,
          bottom: container.offsetTop + currentTarget.offsetHeight,
          height: element.scrollTop + element.clientHeight
        };

        element.style.position = "";
      }
      window.addEventListener("click", memoizedWindowClickHandler);
    }

    setState({
      id: state.id,
      visible: false,
      reveal: !state.visible,
      data,
      onTop: false
    });
  }

  function handleWindowClick({ target }: MouseEvent) {
    const element = target as HTMLElement;
    const closestContainer = element.closest(".dropdown-container");
    let shouldHide = true;

    if (closestContainer?.id === state.id) {
      if (element.closest("[data-dropdown-keep]")) {
        shouldHide = false;
      }
      else {
        shouldHide = !!(element.closest("a") || element.closest(".dropdown-btn") || element.closest("[data-dropdown-close]"));
      }
    }
    else if (usePortal) {
      shouldHide = !!(element.closest("a") || element.closest(".dropdown-btn")
        || element.closest("[data-dropdown-close]") || element.closest(".dropdown-container"));

      if (!shouldHide && !element.closest(".dropdown")) {
        shouldHide = true;
      }
    }

    if (shouldHide) {
      hideDropdown();
    }
  }

  function hideDropdown() {
    if (isMounted.current) {
      setState({ id: state.id, visible: false, reveal: false });
    }
    window.removeEventListener("click", memoizedWindowClickHandler);
  }

  function getParentElement(element: HTMLElement | null) {
    while (element && !element.hasAttribute("data-dropdown-parent")) {
      element = element.parentElement;
    }
    return element;
  }

  return (
    <div id={state.id} className={`dropdown-container${container ? ` ${container.className}` : ""}${state.visible ? " visible" : ""}`}>
      <ToggleBtn params={toggle} toggleDropdown={toggleDropdown} ref={toggleBtn} visible={state.visible}/>
      {usePortal && CSS.supports("anchor-name", "--test") ? (
        createPortal(
          <div role="menu" className={`container container-opaque dropdown portal${body? ` ${body.className}` : ""}${state.reveal? " reveal" : ""}${state.visible? " visible" : ""}${state.onTop? " top" : ""}${state.hiding? " hiding" : ""}`} style={{ "positionAnchor": `--anchor-${state.id}` } as CSSProperties } ref={drop}>{children}</div>,
          document.body
        )
      ) : (
        <div role="menu" className={`container container-opaque dropdown${body ? ` ${body.className}` : ""}${state.reveal ? " reveal" : ""}${state.visible ? " visible" : ""}${state.onTop ? " top" : ""}${state.hiding ? " hiding" : ""}`} ref={drop}>{children}</div>
      )}
    </div>
  );
}
