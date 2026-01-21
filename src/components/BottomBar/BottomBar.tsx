import { useState, type FormEvent, type ChangeEvent, useRef } from "react";
import { getRandomString } from "@/utils";
import Dropdown from "components/Dropdown/Dropdown";
import FileUploadButton from "components/FileUploadButton/FileUploadButton";
import FolderUploadButton from "components/FolderUploadButton/FolderUploadButton";
import "./bottom-bar.css";
import SessionSelection from "./SessionSelection/SessionSelection";
import NewSessionModal from "./NewSessionModal/NewSessionModal";

type Props = {
  uploading: boolean,
  imageCount: number,
  selected: number,
  startSession: (event: FormEvent) => void,
  resetSelected: () => void,
  clearList: () => void,
  showFilePicker: () => void,
  showDirPicker: () => void,
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
};

function getDefaultSession(): FormSession {
  return {
    title: "Default",
    id: getRandomString(4),
    count: 10,
    randomize: true,
    randomizeFlip: false,
    duration: 180,
    grace: 5,
    active: false
  };
}

export default function BottomBar({ uploading, imageCount, selected, startSession, resetSelected, clearList, showFilePicker, showDirPicker, handleFileChange }: Props) {
  const [sessions, setSessions] = useState<FormSession[]>(() => {
    const sessions = localStorage.getItem("sessions");

    return sessions ? JSON.parse(sessions) : [getDefaultSession()];
  });
  const modalRef = useRef<HTMLDialogElement>(null);
  const activeSession = sessions.find(sessions => sessions.active) || sessions[0];
  const [modal, setModal] = useState<{ id: string } | null>(null);
  const [customDuration, setCustomDuration] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value.trim();
    const index = sessions.findIndex(session => session.id === activeSession.id);

    const newSessions = sessions.with(index, {
      ...sessions[index],
      [target.name]: value
    });

    setSessions(newSessions);
    saveSessions(newSessions);
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value.trim();
    const index = sessions.findIndex(session => session.id === activeSession.id);

    if (value !== "custom") {
      const newSessions = sessions.with(index, {
        ...sessions[index],
        duration: parseInt(value, 10)
      });
      setSessions(newSessions);
      saveSessions(newSessions);
    }
    setCustomDuration(value === "custom");
  }

  function enableSessionTitleEdit(id: string) {
    showModal();

    const inputElement = document.querySelector(".session-form .input") as HTMLInputElement | null;

    if (inputElement) {
      inputElement.value = sessions.find(session => session.id === id)!.title;
    }
    setModal({ id })
  }

  function selectTimerWithState(id: string) {
    if (activeSession.id === id) {
      return;
    }
    const newSessions = selectSession(sessions, id);

    setSessions(newSessions);
    saveSessions(newSessions);
  }

  function toggleSession(sessions: FormSession[], id: string, state: boolean) {
    const index = sessions.findIndex(session => session.id === id);

    return sessions.with(index, {
      ...sessions[index],
      active: state
    });
  }

  function selectSession(sessions: FormSession[], id: string) {
    const s1 = toggleSession(sessions, activeSession.id, false);
    const s2 = toggleSession(s1, id, true);

    return s2;
  }

  function removeSession() {
    const newSession = sessions.filter(session => session.id !== activeSession.id);

    setSessions(newSession);
    saveSessions(newSession);
  }

  function addSession(event: FormEvent) {
    event.preventDefault();

    interface FormElements extends HTMLFormControlsCollection {
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    const { title } = elements;
    const value = title.value.trim();
    const session = {
      ...getDefaultSession(),
      title: value
    };
    let newSessions = sessions.concat(session);
    newSessions = selectSession(newSessions, session.id);

    formElement.reset();
    setSessions(newSessions);
    saveSessions(newSessions);
    closeModal();
  }

  function editSesison(event: FormEvent) {
    event.preventDefault();

    interface FormElements extends HTMLFormControlsCollection {
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    const { title } = elements;
    const value = title.value.trim();
    const index = sessions.findIndex(session => session.id === modal!.id);

    const newSessions = sessions.with(index, {
      ...sessions[index],
      title: value
    });

    formElement.reset();
    setSessions(newSessions);
    saveSessions(newSessions);
    closeModal();
  }

  function saveSessions(sessions: FormSession[]) {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }

  function showModal() {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  }

  function closeModal() {
    if (modalRef.current) {
      modalRef.current.close();
    }
    setModal(null);
  }

  return (
    <>
      <form className="container bottom-bar" onSubmit={startSession}>
        <div className="bottom-bar-left">
          <div className="bottom-bar-left-header">
            <h3 className="bottom-bar-title">Preferences</h3>
            <SessionSelection
              activeSession={activeSession} sessions={sessions}
              enableSessionTitleEdit={enableSessionTitleEdit}
              selectTimerWithState={selectTimerWithState} removeSession={removeSession} showModal={showModal}>
            </SessionSelection>
          </div>
          <label className="bottom-bar-form-label">
            <span>Size</span>
            <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={activeSession.count} onChange={handleInputChange} name="count" />
          </label>
          <label className="checkbox-container bottom-bar-form-label">
            <span>Randomize</span>
            <input className="sr-only checkbox-input" type="checkbox" checked={activeSession.randomize} onChange={handleInputChange} name="randomize" />
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
          </label>
          <label className="bottom-bar-form-label">
            <span>Duration</span>
            <div className="select-container">
              <select className="input select bottom-bar-duration-input" onChange={handleSelectChange} value={customDuration ? "custom" : activeSession.duration} name="durationSelect">
                <option value="30">30 sec</option>
                <option value="60">1 min</option>
                <option value="120">2 min</option>
                <option value="180">3 min</option>
                <option value="300">5 min</option>
                <option value="600">10 min</option>
                <option value="900">15 min</option>
                <option value="1800">30 min</option>
                <option value="3600">1 hour</option>
                <option value="custom">Custom (sec)</option>
              </select>
            </div>
            {customDuration && (
              <input type="number" className="input bottom-bar-duration-input bottom-bar-duration-custom-input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={activeSession.duration} onChange={handleInputChange} name="duration" />
            )}
          </label>
          <label className="checkbox-container bottom-bar-form-label">
            <span>Randomize flip</span>
            <input className="sr-only checkbox-input" type="checkbox" checked={activeSession.randomizeFlip} onChange={handleInputChange} name="randomizeFlip" />
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
          </label>
          <label className="bottom-bar-form-label">
            <span>Grace period</span>
            <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={activeSession.grace} onChange={handleInputChange} name="grace" />
          </label>
        </div>
        <div className="bottom-bar-right">
          <span className="bottom-bar-image-count">{imageCount} image(s){selected === imageCount ? null : `, ${selected} selected`}</span>
          <div className="bottom-bar-right-buttons">
            <Dropdown>
              <button type="button" className="btn text-btn dropdown-btn" onClick={clearList}>Clear list</button>
              <FileUploadButton className="dropdown-btn" text="Upload files"
                showFilePicker={showFilePicker} handleFileChange={handleFileChange} disabled={uploading} />
              <FolderUploadButton className="dropdown-btn" text="Upload folder"
                showDirPicker={showDirPicker} handleFileChange={handleFileChange} disabled={uploading} />
            </Dropdown>
            <button type="submit" className="btn primary-btn" disabled={selected === 0}>Start</button>
          </div>
          {selected === imageCount ? null : <button type="button" className="btn text-btn" onClick={resetSelected}>Reset</button>}
        </div>
      </form>
      <NewSessionModal modal={modal} addSession={addSession} editSesison={editSesison} closeModal={closeModal} ref={modalRef} />
    </>
  );
}
