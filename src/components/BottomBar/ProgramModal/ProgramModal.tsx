import { useState, type RefObject, type SubmitEvent } from "react";
import "./ProgramModal.css";
import Icon from "@/components/Icon/Icon";
import { formatDuration, getRandomString } from "@/utils";

type Props = {
  sessions: FormSession[],
  modal: { type: "session" | "program" } & Record<string, unknown> | null,
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

export default function ProgramModal({ modal, sessions, addProgram, editProgram, close, ref }: Props) {
  const [selectedSessions, setSelectedSessions] = useState<(SelectedSession | Break)[]>(() => {
    if (modal?.items) {
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
    editProgram(event, selectedSessions.map(cleanSelectedSession), modal?.id as string);
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

  function renderBreakSelect(breakData: Break) {
    return (
      <div className="program-modal-break-duration-container">
        <div className={`select-container ${breakData.customDuration ? "custom-duration" : ""}`}>
          {breakData.customDuration && (
            <button type="button" className="btn icon-btn">
              <Icon id="menu" />
            </button>
          )}
          <select className="input select program-modal-break-duration-select" onChange={(event) => handleBreakDurationChange(breakData.id, event.target.value)} value={breakData.customDuration ? "custom" : breakData.duration} name="durationSelect">
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
        {
          breakData.customDuration && (
            <input type="number" className="input" inputMode="numeric" pattern="\d*" min="1" autoComplete="off" required value={breakData.duration} onChange={(event) => handleBreakCustomDurationChange(breakData.id, Number(event.target.value))} name="duration" />
          )
        }
      </div>
    )
  }

  return (
    <dialog className="modal program-modal" ref={ref}>
      <form className="session-form" onSubmit={modal?.id ? localEditProgram : localAddProgram}>
        <h4 className="modal-title">Program</h4>
        <input type="text" className="input" required name="title" autoComplete="off" defaultValue={modal?.title as string | undefined} placeholder="Enter title..." />
        <div className="session-form-session-select">
          <h5>Selected sessions</h5>
          <ul className="program-modal-selected-sessions">
            {selectedSessions.map((session, index) => (
              session.type === "session" ? (
                <li className="program-modal-selected-session" key={session.listId}>
                  {index > 0 && selectedSessions[index - 1].type === "session" ? (
                    <button type="button" className="btn icon-btn add-break-btn" title="Add break" onClick={() => insertBreak(index)}>
                      <Icon id="plus" />
                    </button>
                  ) : index > 0 && selectedSessions[index - 1].type === "break" ? (
                    <div className="program-modal-selected-session-break">
                      {renderBreakSelect(selectedSessions[index - 1] as Break)}
                      <button type="button" className="btn icon-btn" title="Remove break" onClick={() => removeBreak(selectedSessions[index - 1].id)}>
                        <Icon id="minus" />
                      </button>
                    </div>
                  ) : null}
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
        <div className="session-form-session-select">
          <h5>Available sessions</h5>
          <ul className="session-form-select">
            {sessions.map(session => (
              <li className="program-modal-available-session" key={session.id}>
                <div className="program-modal-available-session-header">
                  <h5 className="program-modal-available-session-title">{session.title}</h5>
                  <button type="button" className="btn icon-btn" title="Add" onClick={() => addSessionToProgram(session.id)}>
                    <Icon id="plus" />
                  </button>
                </div>
                <div className="program-modal-available-session-info">
                  <div className="program-modal-available-session-info-item">
                    <Icon id="image" title="Images" size="16px"></Icon>
                    <div className="session-form-program-session-size">{session.count}</div>
                  </div>
                  {session.randomize ? (
                    <Icon id="shuffle" className="program-modal-available-session-info-item" title="Randomize" size="16px"></Icon>
                  ) : null}
                  <div className="program-modal-available-session-info-item">
                    <Icon id="clock" title="Duration" size="16px"></Icon>
                    <div className="session-form-program-session-time">{formatDuration(session.duration)}</div>
                  </div>
                  {session.randomizeFlip ? (
                    <Icon id="mirror" className="program-modal-available-session-info-item" title="Randomize flip" size="16px"></Icon>
                  ) : null}
                  <div className="program-modal-available-session-info-item">
                    <Icon id="sleep" title="Grace period" size="16px"></Icon>
                    <div className="session-form-program-session-cycles">{formatDuration(session.grace)}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-bottom">
          <button type="reset" className="btn text-btn" onClick={close}>Cancel</button>
          <button type="submit" className="btn">Confirm</button>
        </div>
      </form>
    </dialog>
  );
}
