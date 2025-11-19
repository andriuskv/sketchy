import Dropdown from "components/Dropdown/Dropdown";
import Icon from "components/Icon/Icon";
import "./SessionSelection.css";

type Props = {
  activeSession: FormSession,
  sessions: FormSession[],
  enableSessionTitleEdit: (id: string) => void,
  selectTimerWithState: (id: string) => void,
  removeSession: () => void,
  showModal: () => void
}

export default function SessionSelection({ activeSession, sessions, enableSessionTitleEdit, selectTimerWithState, removeSession, showModal }: Props) {
  return (
  <Dropdown toggle={{ isIconTextBtn: true, iconId: "menu", title: activeSession.title }}>
    <div className="dropdown-group">
      <button type="button" className="btn icon-text-btn dropdown-btn" onClick={showModal}>
        <Icon id="plus"/>
        <span>New session</span>
      </button>
    </div>
    <div className="dropdown-group">
      {sessions.map(session => (
        <div className="dropdown-btn-container" key={session.id}>
          <button type="button" className={`btn text-btn dropdown-btn${activeSession.id === session.id ? " active" : ""}`}
            onClick={() => selectTimerWithState(session.id)}>
            {session.title}
          </button>
          <button type="button" className="btn icon-btn"
            onClick={() => enableSessionTitleEdit(session.id)} title="Edit" data-dropdown-btn>
            <Icon id="edit"/>
          </button>
        </div>
      ))}
    </div>
    {sessions.length > 1 ? (
      <button type="button" className="btn icon-text-btn dropdown-btn" onClick={removeSession}>
        <Icon id="trash"/>
        <span>Remove session</span>
      </button>
    ) : null}
  </Dropdown>
  );
}
