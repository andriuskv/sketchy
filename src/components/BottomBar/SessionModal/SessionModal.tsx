import type { RefObject, SubmitEvent, ChangeEvent } from "react";
import { useState } from "react";
import { getDefaultSession } from "@/helpers";
import Icon from "@/components/Icon/Icon";
import Modal from "@/components/Modal/Modal";
import CustomDurationSelect from "@/components/CustomDurationSelect/CustomDurationSelect";
import "./SessionModal.css";

type Props = {
  modal: { type: "session" | "program", session?: FormSession },
  addSession: (session: FormSession) => void,
  editSession: (session: FormSession) => void,
  close: () => void,
  ref: RefObject<HTMLDialogElement | null>
}

export default function SessionModal({ modal, addSession, editSession, close, ref }: Props) {
  const [state, setState] = useState<FormSession>(() => modal.session ?? getDefaultSession());
  const [message, setMessage] = useState<string | undefined>();

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (state.count < 1 || state.duration < 1 || state.grace < 1) {
      setMessage("Session must have a count, duration and grace period of at least 1 second");
      return;
    }

    if (modal.session) {
      editSession(state);
    } else {
      addSession(state);
    }
    close();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value.trim();

    setState({
      ...state,
      [target.name]: value
    });
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value.trim();

    if (value == "custom") {
      setState({
        ...state,
        customDuration: true
      });
    }
    else {
      setState({
        ...state,
        duration: parseInt(value, 10),
        customDuration: false
      });
    }
  }

  return (
    <Modal ref={ref} close={close}>
      <form className="session-form" onSubmit={handleSubmit}>
        <h4 className="modal-title">Session</h4>
        <input type="text" className="input" required name="title" autoComplete="off" value={state.title} placeholder="Enter title..." onChange={handleInputChange} />
        <div className="session-form-inputs">
          <label className="session-form-label-wrapper">
            <div className="session-form-label">
              <Icon id="image" size="16px"></Icon>
              <span>Size</span>
            </div>
            <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={state.count} onChange={handleInputChange} name="count" />
          </label>
          <label className="checkbox-container session-form-label-wrapper">
            <div className="session-form-label">
              <Icon id="shuffle" size="16px"></Icon>
              <span>Randomize</span>
            </div>
            <input className="sr-only checkbox-input" type="checkbox" checked={state.randomize} onChange={handleInputChange} name="randomize" />
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
          </label>
          <label className="session-form-label-wrapper">
            <div className="session-form-label">
              <Icon id="clock" size="16px"></Icon>
              <span>Duration</span>
            </div>
            <CustomDurationSelect value={state.duration} custom={state.customDuration} handleSelectChange={handleSelectChange} handleInputChange={handleInputChange} />
          </label>
          <label className="checkbox-container session-form-label-wrapper">
            <div className="session-form-label">
              <Icon id="mirror" size="16px"></Icon>
              <span>Randomize flip</span>
            </div>
            <input className="sr-only checkbox-input" type="checkbox" checked={state.randomizeFlip} onChange={handleInputChange} name="randomizeFlip" />
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
          </label>
          <label className="session-form-label-wrapper">
            <div className="session-form-label">
              <Icon id="sleep" size="16px"></Icon>
              <span>Grace period</span>
            </div>
            <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={state.grace} onChange={handleInputChange} name="grace" />
          </label>
        </div>
        {message && (
          <p className="modal-error">{message}</p>
        )}
        <div className="modal-bottom">
          <button type="reset" className="btn text-btn" onClick={close}>Cancel</button>
          <button type="submit" className="btn">Confirm</button>
        </div>
      </form>
    </Modal>
  );
}
