import { useState, type SubmitEvent, type ChangeEvent, useRef } from "react";
import { getDefaultProgram } from "@/helpers";
import Dropdown from "components/Dropdown/Dropdown";
import FileUploadButton from "components/FileUploadButton/FileUploadButton";
import FolderUploadButton from "components/FolderUploadButton/FolderUploadButton";
import SessionInfo from "components/SessionInfo/SessionInfo";
import ProgramInfo from "components/ProgramInfo/ProgramInfo";
import "./bottom-bar.css";
import SessionSelection from "./SessionSelection/SessionSelection";
import SessionModal from "./SessionModal/SessionModal";
import ProgramModal from "./ProgramModal/ProgramModal";

type Props = {
  sessions: FormSession[],
  programs: Program[],
  activeItem: FormSession | Program,
  uploading: boolean,
  imageCount: number,
  selected: number,
  setSessions: (sessions: FormSession[]) => void,
  setPrograms: (programs: Program[]) => void,
  startPractice: (item: FormSession | Program) => void,
  resetSelected: () => void,
  clearList: () => void,
  showFilePicker: () => void,
  showDirPicker: () => void,
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
};
export default function BottomBar({ sessions, programs, activeItem, uploading, imageCount, selected, setSessions, setPrograms, startPractice, resetSelected, clearList, showFilePicker, showDirPicker, handleFileChange }: Props) {
  const sessionModalRef = useRef<HTMLDialogElement>(null);
  const programModalRef = useRef<HTMLDialogElement>(null);
  const [modal, setModal] = useState<{ type: "session" | "program", id?: string } | null>(null);

  function getSessionById(id: string): FormSession {
    return sessions.find((session: FormSession) => session.id === id)!;
  }

  function enableItemEdit(id: string, type: "session" | "program") {
    let params: Record<string, unknown>;

    if (type === "session") {
      params = { id, session: sessions.find((session: FormSession) => session.id === id) };
    } else {
      const program = programs.find((program: Program) => program.id === id)!;
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

  function removeSession(id: string) {
    const newSession = sessions.filter(session => session.id !== id);

    for (const program of programs) {
      const index = program.items.findIndex(item => item.id === id);

      if (index > -1) {
        return;
      }
    }
    setSessions(newSession);
    saveSessions(newSession);
  }

  function removeProgram(id: string) {
    const newPrograms = programs.filter(program => program.id !== id);

    setPrograms(newPrograms);
    savePrograms(newPrograms);
  }

  function addSession(session: FormSession) {
    const newSessions = sessions.concat(session);
    selectItem(session.id, newSessions, programs);
  }

  function editSession(session: FormSession) {
    const index = sessions.findIndex(s => s.id === session.id);

    if (index === -1) {
      return;
    }
    const newSessions = sessions.with(index, session);
    setSessions(newSessions);
    saveSessions(newSessions);
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

  return (
    <>
      <div className={`container bottom-bar`}>
        <div className="bottom-bar-left">
          {activeItem.type === "session" ?
            <SessionInfo item={activeItem} />
            : <ProgramInfo program={activeItem} getSessionById={getSessionById} />}
          <SessionSelection
            activeItem={activeItem} sessions={sessions} programs={programs}
            enableItemEdit={enableItemEdit}
            selectItem={selectItem} removeSession={removeSession} removeProgram={removeProgram} showModal={showModal}>
          </SessionSelection>
        </div>
        <div className="bottom-bar-right">
          <span className="bottom-bar-image-count">{imageCount} image(s){selected === imageCount ? null : `, ${selected} selected`}</span>
          <div className="bottom-bar-right-buttons">
            <Dropdown>
              <button className="btn text-btn dropdown-btn" onClick={clearList}>Clear list</button>
              <FileUploadButton className="dropdown-btn" text="Upload files"
                showFilePicker={showFilePicker} handleFileChange={handleFileChange} disabled={uploading} />
              <FolderUploadButton className="dropdown-btn" text="Upload folder"
                showDirPicker={showDirPicker} handleFileChange={handleFileChange} disabled={uploading} />
            </Dropdown>
            <button className="btn primary-btn" onClick={() => startPractice(activeItem)} disabled={selected === 0}>Start</button>
          </div>
          {selected === imageCount ? null : <button className="btn text-btn" onClick={resetSelected}>Reset</button>}
        </div>
      </div>
      {modal?.type === "session" ? <SessionModal modal={modal} close={closeModal} ref={sessionModalRef} addSession={addSession} editSession={editSession} /> : null}
      {modal?.type === "program" ? <ProgramModal modal={modal} sessions={sessions} addProgram={addProgram} editProgram={editProgram} close={closeModal} ref={programModalRef} /> : null}
    </>
  );
}
