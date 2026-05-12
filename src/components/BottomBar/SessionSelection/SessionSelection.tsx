import Dropdown from "components/Dropdown/Dropdown";
import Icon from "components/Icon/Icon";
import "./SessionSelection.css";

type Props = {
  activeItem: FormSession | Program,
  sessions: FormSession[],
  programs: Program[],
  enableItemEdit: (id: string, type: "session" | "program") => void,
  selectItem: (id: string, sessions: FormSession[], programs: Program[]) => void,
  removeSession: () => void,
  removeProgram: () => void,
  showModal: (type: "session" | "program") => void
}

export default function SessionSelection({ activeItem, sessions, programs, enableItemEdit, selectItem, removeSession, removeProgram, showModal }: Props) {
  return (
    <Dropdown toggle={{ isIconTextBtn: true, iconId: "menu", title: activeItem.title }} body={{ className: "bottom-bar-dropdown" }}>
      <div className="dropdown-column">
        <div className="dropdown-group">
          <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => showModal("session")}>
            <Icon id="plus" />
            <span>New session</span>
          </button>
        </div>
        <div className="dropdown-group">
          {sessions.map(session => (
            <div className="dropdown-btn-container" key={session.id}>
              <button type="button" className={`btn text-btn dropdown-btn${activeItem.id === session.id ? " active" : ""}`}
                onClick={() => selectItem(session.id, sessions, programs)}>
                {session.title}
              </button>
              <button type="button" className="btn icon-btn"
                onClick={() => enableItemEdit(session.id, "session")} title="Edit" data-dropdown-btn>
                <Icon id="edit" />
              </button>
            </div>
          ))}
        </div>
        {sessions.length > 1 ? (
          <div className="dropdown-bottom">
            <button type="button" className="btn icon-text-btn dropdown-btn" onClick={removeSession}>
              <Icon id="trash" />
              <span>Remove session</span>
            </button>
          </div>
        ) : null}
      </div>
      <div className="dropdown-column">
        <div className="dropdown-group">
          <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => showModal("program")}>
            <Icon id="plus" />
            <span>New program</span>
          </button>
        </div>
        <div className="dropdown-group">
          {programs.map(program => (
            <div className="dropdown-btn-container" key={program.id}>
              <button type="button" className={`btn text-btn dropdown-btn${activeItem.id === program.id ? " active" : ""}`}
                onClick={() => selectItem(program.id, sessions, programs)}>
                {program.title}
              </button>
              <button type="button" className="btn icon-btn"
                onClick={() => enableItemEdit(program.id, "program")} title="Edit" data-dropdown-btn>
                <Icon id="edit" />
              </button>
            </div>
          ))}
        </div>
        {programs.length > 0 && activeItem.type === "program" ? (
          <div className="dropdown-bottom">
            <button type="button" className="btn icon-text-btn dropdown-btn" onClick={removeProgram}>
              <Icon id="trash" />
              <span>Remove program</span>
            </button>
          </div>
        ) : null}
      </div>
    </Dropdown>
  );
}
