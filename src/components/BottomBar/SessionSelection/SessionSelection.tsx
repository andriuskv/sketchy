import Dropdown from "components/Dropdown/Dropdown";
import Icon from "components/Icon/Icon";

type Props = {
  activeSession: FormSession,
  sessions: FormSession[],
  selectTimerWithState: (id: string) => void,
  removeSession: () => void,
  showModal: () => void
}

export default function SessionSelection({ activeSession, sessions, selectTimerWithState, removeSession, showModal }: Props) {
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
        <button type="button" className={`btn text-btn dropdown-btn${activeSession.id === session.id ? " active" : ""}`}
          key={session.id} onClick={() => selectTimerWithState(session.id)}>
          {session.title}
        </button>
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
