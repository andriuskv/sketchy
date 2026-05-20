import { useEffect } from "react";
import "./Modal.css";

type Props = {
  close: () => void,
  children: React.ReactNode
  className?: string;
  ref: React.RefObject<HTMLDialogElement | null>;
}

export default function Modal({ children, className, ref, close }: Props) {
  useEffect(() => {

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [close]);

  return (
    <dialog className={className ? `modal ${className}` : "modal"} ref={ref}>
      {children}
    </dialog>
  );
}
