import type { FormEvent } from "react";
import "./NewSessionModal.css";

type Props = {
  modal: { id: string } | null,
  editSesison: (event: FormEvent) => void,
  addSession: (event: FormEvent) => void,
  closeModal: () => void,
  ref: React.RefObject<HTMLDialogElement | null>
}

export default function NewSessionModal({ modal, addSession, editSesison, closeModal, ref }: Props) {
  return (
    <dialog className="session-form-modal" ref={ref}>
      <form className="session-form" onSubmit={modal ? editSesison : addSession}>
        <h4 className="session-form-title">{modal ? "Edit" : "New"} session</h4>
        <input type="text" className="input" required name="title" autoComplete="off"/>
        <div className="session-form-bottom">
          <button type="reset" className="btn text-btn" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn">Confirm</button>
        </div>
      </form>
    </dialog>
  );
}
