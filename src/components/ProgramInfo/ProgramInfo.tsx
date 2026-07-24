import type { CSSProperties } from "react";
import { formatDuration } from "@/utils";
import Icon from "components/Icon/Icon";
import "./ProgramInfo.css";
import SessionInfo from "components/SessionInfo/SessionInfo";

function SessionItemWrapper({ id, getSessionById }: { id: string, getSessionById: (id: string) => FormSession }) {
  const session = getSessionById(id);

  return (
    <div className="program-info-item-wrapper" style={{ "anchorName": `--anchor-${id}` } as CSSProperties} data-tooltip={id} >
      <div className="program-info-item" >{session.title}</div>
      <div className="program-info-item-tooltip-wrapper" data-tooltip-content={id}>
        <SessionInfo item={session} timeInMs={false} className="program-info-item-tooltip" key={id} />
      </div>
    </div>
  );
}

export default function ProgramInfo({ program, getSessionById }: { program: Program, getSessionById: (id: string) => FormSession }) {
  return (
    <div className="program-info">
      {program.items.map((item, index) => (
        item.type === "session" ?
          <SessionItemWrapper id={item.id} getSessionById={getSessionById} key={`${item.id}-${index}`} />
          : <div className="program-info-item-wrapper program-info-item" key={item.id}>
            <Icon id="sleep" title="Break" size="16px"></Icon>
            {formatDuration(item.duration)}
          </div>
      ))}
    </div>
  );
}
