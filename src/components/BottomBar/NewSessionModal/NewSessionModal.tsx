import type { RefObject, SubmitEvent } from "react";
import "./NewSessionModal.css";

type Props = {
  modal: { type: "session" | "program", id?: string, title?: string } | null,
  editSesison: (event: SubmitEvent) => void,
  addSession: (event: SubmitEvent) => void,
  close: () => void,
  ref: RefObject<HTMLDialogElement | null>
}

export default function NewSessionModal({ modal, addSession, editSesison, close, ref }: Props) {
  return (
    <dialog className="session-form-modal" ref={ref}>
      <form className="session-form" onSubmit={modal?.id ? editSesison : addSession}>
        <h4 className="session-form-title">{modal?.id ? "Edit" : "New"} session</h4>
        <input type="text" className="input" required name="title" autoComplete="off" defaultValue={modal?.title} />
        <div className="session-form-bottom">
          <button type="reset" className="btn text-btn" onClick={close}>Cancel</button>
          <button type="submit" className="btn">Confirm</button>
        </div>
      </form>
    </dialog>
  );
}
