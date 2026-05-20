import { useState, type RefObject, type SubmitEvent } from "react";
import "./ProgramModal.css";
import Icon from "@/components/Icon/Icon";
import { getRandomString } from "@/utils";
import SessionInfo from "@/components/SessionInfo/SessionInfo";
import Modal from "@/components/Modal/Modal";
import CustomDurationSelect from "@/components/CustomDurationSelect/CustomDurationSelect";

type Props = {
  sessions: FormSession[],
  modal: { type: "session" | "program" } & Record<string, unknown>,
  addProgram: (event: SubmitEvent, selectedSessions: (FormSession | Break)[]) => void,
  editProgram: (event: SubmitEvent, selectedSessions: (FormSession | Break)[], id: string) => void,
  close: () => void,
  ref: RefObject<HTMLDialogElement | null>
}

function cleanSelectedSession(s: SelectedSession | Break) {
  if (s.type === "break") {
    return s;
  }

  const { listId, ...session } = s;
  return session;
}

type BreakItemProps = {
  item: Break | SelectedSession,
  index: number,
  insertBreak: (index: number) => void,
  removeBreak: (id: string) => void,
  handleSelectChange: (id: string, value: string) => void,
  handleInputChange: (id: string, duration: number) => void
}

function BreakItem({ item, index, insertBreak, removeBreak, handleSelectChange, handleInputChange }: BreakItemProps) {
  if (index === 0) {
    return null;
  }

  if (item.type === "session") {
    return (
      <button type="button" className="btn icon-btn add-break-btn" title="Add break" onClick={() => insertBreak(index)}>
        <Icon id="plus" />
      </button>
    )
  }

  if (item.type === "break") {
    return (
      <div className="program-modal-selected-session-break">
        <CustomDurationSelect value={item.duration} custom={item.customDuration} handleSelectChange={(event) => handleSelectChange(item.id, event.target.value)} handleInputChange={(event) => handleInputChange(item.id, Number(event.target.value))} />
        <button type="button" className="btn icon-btn" title="Remove break" onClick={() => removeBreak(item.id)}>
          <Icon id="minus" />
        </button>
      </div>
    )
  }
}

export default function ProgramModal({ modal, sessions, addProgram, editProgram, close, ref }: Props) {
  const [selectedSessions, setSelectedSessions] = useState<(SelectedSession | Break)[]>(() => {
    if (modal.items) {
      return (modal.items as (SelectedSession | Break)[]).map(item => {
        if (item.type === "break") {
          return item;
        }
        return {
          ...item,
          listId: getRandomString(4)
        }
      });
    }
    return [];
  });

  function localAddProgram(event: SubmitEvent) {
    event.preventDefault();
    addProgram(event, selectedSessions.map(cleanSelectedSession));
  }

  function localEditProgram(event: SubmitEvent) {
    event.preventDefault();
    editProgram(event, selectedSessions.map(cleanSelectedSession), modal.id as string);
  }

  function addSessionToProgram(id: string) {
    const session = sessions.find(session => session.id === id);

    if (session) {
      setSelectedSessions(prev => [...prev, { ...session, listId: getRandomString(4), type: "session" }]);
    }
  }

  function removeSessionFromProgram(listId: string) {
    const index = selectedSessions.findIndex(session => (session as SelectedSession).listId === listId);
    let newSelectedSessions = [...selectedSessions];

    if (index > 0 && selectedSessions[index - 1]?.type === "break") {
      newSelectedSessions = newSelectedSessions.toSpliced(index - 1, 2);
    } else if (index === 0 && selectedSessions[index + 1]?.type === "break") {
      newSelectedSessions = newSelectedSessions.toSpliced(index, 2);
    } else {
      newSelectedSessions = newSelectedSessions.toSpliced(index, 1);
    }
    setSelectedSessions(newSelectedSessions);
  }

  function changeOrder(order: 1 | -1, id: string) {
    const index = selectedSessions.findIndex(session => (session as SelectedSession).listId === id);

    if (order === -1 && index <= 0 || order === 1 && index >= selectedSessions.length - 1) {
      return;
    }

    if (selectedSessions[index + order].type === "break") {
      order *= 2;
    }
    ([selectedSessions[index], selectedSessions[index + order]] = [selectedSessions[index + order], selectedSessions[index]]);

    setSelectedSessions([...selectedSessions]);
  }

  function insertBreak(index: number) {
    setSelectedSessions(prev => [...prev.slice(0, index), { duration: 60, id: getRandomString(4), type: "break" }, ...prev.slice(index)]);
  }

  function removeBreak(id: string) {
    setSelectedSessions(selectedSessions.filter(session => session.id !== id));
  }

  function handleBreakDurationChange(id: string, value: string) {
    if (value === "custom") {
      setSelectedSessions(selectedSessions.map(session => session.id === id ? { ...session, duration: 60, customDuration: true } : session));
    } else {
      setSelectedSessions(selectedSessions.map(session => session.id === id ? { ...session, duration: Number(value), customDuration: false } : session));
    }
  }

  function handleBreakCustomDurationChange(id: string, duration: number) {
    setSelectedSessions(selectedSessions.map(session => session.id === id ? { ...session, duration } : session));
  }

  return (
    <Modal className="program-modal" ref={ref} close={close}>
      <form className="session-form" onSubmit={modal.id ? localEditProgram : localAddProgram}>
        <h4 className="modal-title">Program</h4>
        <input type="text" className="input" required name="title" autoComplete="off" defaultValue={modal.title as string | undefined} placeholder="Enter title..." />
        <div>
          <h5>Selected sessions</h5>
          <ul className="program-modal-selected-sessions">
            {selectedSessions.map((session, index) => (
              session.type === "session" ? (
                <li className="program-modal-selected-session" key={session.listId}>
                  <BreakItem item={selectedSessions[index - 1]} index={index} insertBreak={insertBreak} removeBreak={removeBreak} handleSelectChange={handleBreakDurationChange} handleInputChange={handleBreakCustomDurationChange} />
                  <div>
                    <button type="button" className="btn icon-btn" title="Move up" onClick={() => changeOrder(-1, session.listId)} disabled={index === 0}>
                      <Icon id="chevron-up" />
                    </button>
                    <button type="button" className="btn icon-btn" title="Move down" onClick={() => changeOrder(1, session.listId)} disabled={index === selectedSessions.length - 1}>
                      <Icon id="chevron-down" />
                    </button>
                  </div>
                  <div className="session-form-program-session-title">{session.title}</div>
                  <button type="button" className="btn icon-btn" title="Remove" onClick={() => removeSessionFromProgram(session.listId)}>
                    <Icon id="minus" />
                  </button>
                </li>
              ) : null
            ))}
          </ul>
        </div>
        <div>
          <h5>Available sessions</h5>
          <ul className="program-modal-available-sessions">
            {sessions.map(session => (
              <li className="program-modal-available-session" key={session.id}>
                <div className="program-modal-available-session-header">
                  <h5 className="program-modal-available-session-title">{session.title}</h5>
                  <button type="button" className="btn icon-btn" title="Add" onClick={() => addSessionToProgram(session.id)}>
                    <Icon id="plus" />
                  </button>
                </div>
                <SessionInfo item={session} />
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-bottom">
          <button type="reset" className="btn text-btn" onClick={close}>Cancel</button>
          <button type="submit" className="btn">Confirm</button>
        </div>
      </form>
    </Modal>
  );
}
