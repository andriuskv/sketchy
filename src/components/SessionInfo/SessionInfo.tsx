import type { CSSProperties } from "react";
import { formatDuration } from "@/utils";
import Icon from "components/Icon/Icon";
import "./SessionInfo.css";

export default function SessionInfo({ item, timeInMs = false, style, className, ...props }: { item: Prefs, timeInMs?: boolean, style?: CSSProperties, className?: string }) {
  return (
    <div className={`session-info ${className ?? ""}`} style={style} {...props}>
      <div className="session-info-item">
        <Icon id="image" title="Images" size="16px"></Icon>
        <div className="session-info-item-count">{item.count}</div>
      </div>
      {item.randomize ? (
        <Icon id="shuffle" className="session-info-item" title="Randomize" size="16px"></Icon>
      ) : null}
      <div className="session-info-item">
        <Icon id="clock" title="Duration" size="16px"></Icon>
        <div className="session-info-item-duration">{formatDuration(timeInMs ? Math.round(item.duration / 1000) : item.duration)}</div>
      </div>
      {item.randomizeFlip ? (
        <Icon id="mirror" className="session-info-item" title="Randomize flip" size="16px"></Icon>
      ) : null}
      <div className="session-info-item">
        <Icon id="sleep" title="Grace period" size="16px"></Icon>
        <div className="session-info-item-grace">{formatDuration(timeInMs ? Math.round(item.grace / 1000) : item.grace)}</div>
      </div>
    </div>
  );
}
