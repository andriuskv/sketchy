import Dropdown from "components/Dropdown/Dropdown";
import Icon from "components/Icon/Icon";
import "./SessionSelection.css";

type Props = {
  activeItem: FormSession | Program,
  sessions: FormSession[],
  programs: Program[],
  enableItemEdit: (id: string, type: "session" | "program") => void,
  selectItem: (id: string, sessions: FormSession[], programs: Program[]) => void,
  removeSession: (id: string) => void,
  removeProgram: (id: string) => void,
  showModal: (type: "session" | "program") => void
}

function SessionRemoveButton({ sessions, programs, session, removeSession }: { sessions: FormSession[], programs: Program[], session: FormSession, removeSession: (id: string) => void }) {
  const programWithSession = programs.find(program => program.items.some(item => item.id === session.id));

  if (sessions.length === 1 && !programWithSession) {
    return null;
  }

  return (
    <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => removeSession(session.id)} disabled={!!programWithSession} title={programWithSession ? `Session is used in "${programWithSession.title}"` : ""}>
      <Icon id="trash" />
      <span>Remove</span>
    </button>
  )
}

export default function SessionSelection({ activeItem, sessions, programs, enableItemEdit, selectItem, removeSession, removeProgram, showModal }: Props) {
  return (
    <Dropdown toggle={{ isIconTextBtn: true, iconId: "menu", title: activeItem.title }} body={{ className: "bottom-bar-dropdown" }} hasNested>
      <div className="dropdown-column">
        <div className="dropdown-group">
          <div className="sessions-dropdown-header">
            <span>Sessions</span>
            <button type="button" className="btn icon-btn dropdown-btn" onClick={() => showModal("session")} title="Add Session">
              <Icon id="plus" />
            </button>
          </div>
        </div>
        <div className="dropdown-group">
          {sessions.map(session => (
            <div className="dropdown-btn-container" key={session.id}>
              <button type="button" className={`btn text-btn dropdown-btn${activeItem.id === session.id ? " active" : ""}`}
                onClick={() => selectItem(session.id, sessions, programs)}>
                {session.title}
              </button>
              <Dropdown toggle={{ iconId: "vertical-dots" }}>
                <button type="button" className="btn icon-text-btn dropdown-btn"
                  onClick={() => enableItemEdit(session.id, "session")}>
                  <Icon id="edit" />
                  <span>Edit</span>
                </button>
                <SessionRemoveButton sessions={sessions} programs={programs} session={session} removeSession={removeSession} />
              </Dropdown>
            </div>
          ))}
        </div>
      </div>
      <div className="dropdown-column">
        <div className="dropdown-group">
          <div className="sessions-dropdown-header">
            <span>Programs</span>
            <button type="button" className="btn icon-btn dropdown-btn" onClick={() => showModal("program")} title="Add Program">
              <Icon id="plus" />
            </button>
          </div>
        </div>
        <div className="dropdown-group">
          {programs.map(program => (
            <div className="dropdown-btn-container" key={program.id}>
              <button type="button" className={`btn text-btn dropdown-btn${activeItem.id === program.id ? " active" : ""}`}
                onClick={() => selectItem(program.id, sessions, programs)}>
                {program.title}
              </button>
              <Dropdown toggle={{ iconId: "vertical-dots" }}>
                <button type="button" className="btn icon-text-btn dropdown-btn"
                  onClick={() => enableItemEdit(program.id, "program")} title="Edit">
                  <Icon id="edit" />
                  <span>Edit</span>
                </button>
                {programs.length > 0 ? (
                  <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => removeProgram(program.id)}>
                    <Icon id="trash" />
                    <span>Remove</span>
                  </button>
                ) : null}
              </Dropdown>
            </div>
          ))}
        </div>
      </div>
    </Dropdown>
  );
}
