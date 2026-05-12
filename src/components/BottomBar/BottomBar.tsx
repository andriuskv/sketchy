import { useState, useEffect, type RefObject, type SubmitEvent, type ChangeEvent, useRef } from "react";
import { getRandomString } from "@/utils";
import Dropdown from "components/Dropdown/Dropdown";
import FileUploadButton from "components/FileUploadButton/FileUploadButton";
import FolderUploadButton from "components/FolderUploadButton/FolderUploadButton";
import "./bottom-bar.css";
import SessionSelection from "./SessionSelection/SessionSelection";
import NewSessionModal from "./NewSessionModal/NewSessionModal";
import ProgramModal from "./ProgramModal/ProgramModal";

type Props = {
  uploading: boolean,
  imageCount: number,
  selected: number,
  formRef: RefObject<HTMLFormElement | null>,
  handleFormSubmit: (event: SubmitEvent, item: FormSession | Program | null) => void,
  resetSelected: () => void,
  clearList: () => void,
  showFilePicker: () => void,
  showDirPicker: () => void,
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
};

function getDefaultSession(): FormSession {
  return {
    type: "session",
    title: "Default",
    id: getRandomString(4),
    count: 10,
    randomize: true,
    randomizeFlip: false,
    duration: 180,
    customDuration: false,
    grace: 5,
    active: false
  };
}

function getDefaultProgram(): Program {
  return {
    type: "program",
    title: "Default",
    id: getRandomString(4),
    active: false,
    items: []
  }
}

function findActiveItem(sessions: FormSession[], programs: Program[]): FormSession | Program {
  return (sessions.find(session => session.active) || programs.find(program => program.active))!;
}

export default function BottomBar({ uploading, imageCount, selected, formRef, handleFormSubmit, resetSelected, clearList, showFilePicker, showDirPicker, handleFileChange }: Props) {
  const [sessions, setSessions] = useState<FormSession[]>(() => {
    const sessions = localStorage.getItem("sessions");

    return sessions ? JSON.parse(sessions) : [getDefaultSession()];
  });
  const [programs, setPrograms] = useState<Program[]>(() => {
    const programs = localStorage.getItem("programs");

    return programs ? JSON.parse(programs) : [];
  });
  const sessionModalRef = useRef<HTMLDialogElement>(null);
  const programModalRef = useRef<HTMLDialogElement>(null);
  const activeItem = findActiveItem(sessions, programs) || sessions[0];
  const [modal, setModal] = useState<{ type: "session" | "program", id?: string } | null>(null);
  const [preferencesHidden, setPreferencesHidden] = useState(() => localStorage.getItem("preferencesHidden") === "1");

  useEffect(() => {
    let maxSize = 216;

    if (activeItem?.type === "program") {
      setPreferencesHidden(true);
    }
    else if (activeItem?.type === "session" && activeItem.customDuration) {
      maxSize = 250;
    }
    document.documentElement.style.setProperty("--preferences-size", preferencesHidden ? "54px" : `${maxSize}px`);

    return () => {
      document.documentElement.style.setProperty("--preferences-size", "");
    }
  }, [preferencesHidden, activeItem]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value.trim();
    const index = sessions.findIndex(session => session.id === (activeItem as FormSession).id);

    const newSessions = sessions.with(index, {
      ...sessions[index],
      [target.name]: value
    });

    setSessions(newSessions);
    saveSessions(newSessions);
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value.trim();
    const index = sessions.findIndex(session => session.id === (activeItem as FormSession).id);

    let newSessions: FormSession[];

    if (value == "custom") {
      newSessions = sessions.with(index, {
        ...sessions[index],
        customDuration: true
      });
    }
    else {
      newSessions = sessions.with(index, {
        ...sessions[index],
        duration: parseInt(value, 10),
        customDuration: false
      });
    }
    setSessions(newSessions);
    saveSessions(newSessions);
  }

  function enableItemEdit(id: string, type: "session" | "program") {
    let params: Record<string, unknown>;

    if (type === "session") {
      params = { id, title: sessions.find(session => session.id === id)!.title };
    } else {
      const program = programs.find(program => program.id === id)!;
      params = { id, title: program.title, items: program.items };
    }
    showModal(type, params);
  }

  function selectItem(id: string, sessions: FormSession[], programs: Program[]) {
    if (activeItem.id === id) {
      return;
    }

    const newSessions = activateItem(sessions, id) as FormSession[];
    const newPrograms = activateItem(programs, id) as Program[];

    setSessions(newSessions);
    setPrograms(newPrograms);

    saveSessions(newSessions);
    savePrograms(newPrograms);
  }

  function toggleItem(items: (FormSession | Program)[], id: string, state: boolean) {
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      return items;
    }
    return items.with(index, {
      ...items[index],
      active: state
    });
  }

  function activateItem(items: (FormSession | Program)[], id: string) {
    const s1 = toggleItem(items, activeItem.id, false);
    const s2 = toggleItem(s1, id, true);

    return s2;
  }

  function removeSession() {
    const newSession = sessions.filter(session => session.id !== activeItem.id);

    for (const program of programs) {
      const index = program.items.findIndex(item => item.id === activeItem.id);

      if (index > -1) {
        // TODO: show message that session is used in a program.
        console.log("Session is used in a program");
        return;
      }
    }
    setSessions(newSession);
    saveSessions(newSession);
  }

  function removeProgram() {
    const newPrograms = programs.filter(program => program.id !== activeItem.id);

    setPrograms(newPrograms);
    savePrograms(newPrograms);
  }

  function addSession(event: SubmitEvent) {
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
    const newSessions = sessions.concat(session);

    formElement.reset();
    selectItem(session.id, newSessions, programs);
    closeModal();
  }

  function editSesison(event: SubmitEvent) {
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

  function addProgram(event: SubmitEvent, items: (FormSession | Break)[]) {
    event.preventDefault();

    interface FormElements extends HTMLFormControlsCollection {
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    const { title } = elements;
    const value = title.value.trim();
    const program = {
      ...getDefaultProgram(),
      title: value,
      items: items.map((item) => {
        if (item.type === "session") {
          return { type: item.type, id: item.id, title: item.title };
        }
        return item;
      })
    };

    const newPrograms = programs.concat(program);

    formElement.reset();
    selectItem(program.id, sessions, newPrograms);
    closeModal();
  }

  function editProgram(event: SubmitEvent, items: (FormSession | Break)[], id: string) {
    event.preventDefault();

    interface FormElements extends HTMLFormControlsCollection {
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    const { title } = elements;
    const value = title.value.trim();
    const index = programs.findIndex(program => program.id === id);

    const newPrograms = programs.with(index, {
      ...programs[index],
      title: value,
      items: items.map((item) => {
        if (item.type === "session") {
          return { type: item.type, id: item.id, title: item.title };
        }
        return item;
      })
    });

    formElement.reset();
    setPrograms(newPrograms);
    savePrograms(newPrograms);
    closeModal();
  }

  function savePrograms(programs: Program[]) {
    localStorage.setItem("programs", JSON.stringify(programs));
  }

  function saveSessions(sessions: FormSession[]) {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }

  function showModal(type: "session" | "program", props?: Record<string, unknown>) {
    setModal({ type, ...props });

    requestAnimationFrame(() => {
      if (type === "session" && sessionModalRef.current) {
        sessionModalRef.current.showModal();
      }
      else if (type === "program" && programModalRef.current) {
        programModalRef.current.showModal();
      }
    });
  }

  function closeModal() {
    setModal(null);
  }

  function togglePreferences() {
    if (activeItem?.type === "program") {
      return;
    }
    const newState = !preferencesHidden;
    setPreferencesHidden(newState);
    localStorage.setItem("preferencesHidden", newState ? "1" : "0");
  }

  return (
    <>
      <form className={`container bottom-bar ${preferencesHidden ? "hidden" : ""}`} onSubmit={event => { handleFormSubmit(event, activeItem); }} ref={formRef}>
        <div className="bottom-bar-left">
          <div className="bottom-bar-left-header">
            <h3 className="bottom-bar-title">
              <button type="button" className="btn text-btn text-btn-alt bottom-bar-title-btn" onClick={togglePreferences} disabled={activeItem?.type === "program"}>Preferences</button>
            </h3>
            <SessionSelection
              activeItem={activeItem} sessions={sessions} programs={programs}
              enableItemEdit={enableItemEdit}
              selectItem={selectItem} removeSession={removeSession} removeProgram={removeProgram} showModal={showModal}>
            </SessionSelection>
          </div>
          {activeItem?.type === "session" && <div className="bottom-bar-left-content">
            <label className="bottom-bar-form-label">
              <span>Size</span>
              <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={(activeItem as FormSession).count} onChange={handleInputChange} name="count" />
            </label>
            <label className="checkbox-container bottom-bar-form-label">
              <span>Randomize</span>
              <input className="sr-only checkbox-input" type="checkbox" checked={(activeItem as FormSession).randomize} onChange={handleInputChange} name="randomize" />
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
            </label>
            <label className="bottom-bar-form-label">
              <span>Duration</span>
              <div className="select-container">
                <select className="input select bottom-bar-duration-input" onChange={handleSelectChange} value={(activeItem as FormSession).customDuration ? "custom" : (activeItem as FormSession).duration} name="durationSelect">
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
              {(activeItem as FormSession).customDuration && (
                <input type="number" className="input bottom-bar-duration-input bottom-bar-duration-custom-input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={(activeItem as FormSession).duration} onChange={handleInputChange} name="duration" />
              )}
            </label>
            <label className="checkbox-container bottom-bar-form-label">
              <span>Randomize flip</span>
              <input className="sr-only checkbox-input" type="checkbox" checked={(activeItem as FormSession).randomizeFlip} onChange={handleInputChange} name="randomizeFlip" />
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
            </label>
            <label className="bottom-bar-form-label">
              <span>Grace period</span>
              <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={(activeItem as FormSession).grace} onChange={handleInputChange} name="grace" />
            </label>
          </div>}
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
      {modal?.type === "session" && <NewSessionModal modal={modal} addSession={addSession} editSesison={editSesison} close={closeModal} ref={sessionModalRef} />}
      {modal?.type === "program" && <ProgramModal modal={modal} sessions={sessions} addProgram={addProgram} editProgram={editProgram} close={closeModal} ref={programModalRef} />}
    </>
  );
}
