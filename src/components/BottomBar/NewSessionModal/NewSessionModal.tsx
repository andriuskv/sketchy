import type { FormEvent } from "react";
import "./NewSessionModal.css";

type Props = {
  addSession: (event: FormEvent) => void,
  closeModal: () => void,
  ref: React.RefObject<HTMLDialogElement | null>
}

export default function NewSessionModal({ addSession, closeModal, ref }: Props) {
  return (
    <dialog className="session-form-modal" ref={ref}>
      <form className="session-form" onSubmit={addSession}>
        <h4 className="session-form-title">New session</h4>
        <input type="text" className="input" required name="title" autoComplete="off"/>
        <div className="session-form-bottom">
          <button type="reset" className="btn text-btn" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn">Confirm</button>
        </div>
      </form>
    </dialog>
  );
}
