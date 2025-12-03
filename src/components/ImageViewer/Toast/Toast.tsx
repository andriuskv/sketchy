import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import Icon from "components/Icon/Icon";
import "./toast.css";

type Props = {
  message: string,
  duration?: number,
  position?: "top" | "bottom",
  offset?: string,
  dismissBtnVisible?: boolean
  dismiss: () => void,
}

export default function Toast({ message, duration = 0, position = "top", offset = "0", dismiss, dismissBtnVisible = false }: Props) {
  const dismissTimeoutId = useRef(0);
  const style ={ "--offset": offset } as CSSProperties;

  useEffect(() => {
    if (duration) {
      dismissTimeoutId.current = window.setTimeout(dismiss, duration);
    }
    return () => {
      clearTimeout(dismissTimeoutId.current);
    };
  }, [duration]);

  return (
    <div className={`viewer-bar toast ${position}`} style={style}>
      <p className="toast-message">{message}</p>
      {dismissBtnVisible ? (
        <button type="button" className="btn icon-btn" onClick={dismiss} title="Dismiss">
          <Icon id="close"/>
        </button>
      ) : null}
    </div>
  );
}
