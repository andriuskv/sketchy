import { useState, useEffect } from "react";
import "./Session.css";
import EndSessionView from "./EndSessionView/EndSessionView";
import useWorker from "./useWorker";
import ImageViewer from "../ImageViewer/ImageViewer";

type Props = {
  session: Session,
  close: () => void
}

type StateText = "Starting" | "Continuing" | "Skipping" | "Loading";

type State = {
  loading: boolean,
  grace: number,
  stateText: StateText,
  stateId: number
  paused: boolean,
  duration: number,
  index: number
}

const PAUSE_DURATION = 3;
const STARTING = 0;
const CONTINUING = 1;
const SKIPPING = 2;
const LOADING = 3;

export default function Session({ session, close }: Props) {
  const [state, setState] = useState<State>({
    loading: true,
    grace: PAUSE_DURATION,
    stateText: "Starting",
    stateId: STARTING,
    paused: false,
    duration: session.duration,
    index: 0
  });
  const [sessionEnded, setSessionEnded] = useState(false);
  const { initWorker, destroyWorkers } = useWorker(handleMessage, [state.index, state.loading, state.paused]);

  useEffect(() => {
    initWorker({ id: "grace", action: "start", duration: PAUSE_DURATION });

    return () => {
      destroyWorkers();
    };
  }, []);

  function endSession() {
    destroyWorkers();
    setSessionEnded(true);
  }

  function skip(manual = false) {
    if (state.loading || state.paused) {
      return;
    }
    const nextIndex = state.index + 1;

    if (nextIndex === session.images.length) {
      endSession();
      return;
    }
    destroyWorkers();
    setState({
      ...state,
      grace: manual ? PAUSE_DURATION : session.grace,
      loading: true,
      stateText: manual ? "Skipping" : "Loading",
      stateId: manual ? SKIPPING : LOADING,
      duration: session.duration,
      index: nextIndex
    });
    initWorker({ id: "grace", action: "start", duration: manual ? PAUSE_DURATION : session.grace });
  }

  function pause() {
    if (state.loading) {
      return;
    }
    const paused = !state.paused;

    destroyWorkers();

    if (paused) {
      setState({ ...state, paused, duration: state.duration, grace: session.grace  });
    }
    else {
      setState({
        ...state,
        paused,
        loading: true,
        duration: state.duration,
        grace: PAUSE_DURATION,
        stateText: "Continuing",
        stateId: CONTINUING
      });
      initWorker({ id: "grace", action: "start", duration: PAUSE_DURATION });
    }
  }

  useEffect(() => {
    function handleKeydown({ key }: KeyboardEvent) {
      if (sessionEnded) {
        return;
      }

      if (key === "ArrowRight") {
        skip(true);
      }
      else if (key === "Escape" ) {
        pause();
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [state, sessionEnded]);

  function handleMessage(event: MessageEvent) {
    if (event.data.id === "grace") {
      if (event.data.duration < 0) {
        setState({
          ...state,
          paused: false,
          grace: event.data.duration,
        });
      }
      else if (document.visibilityState === "visible" && document.startViewTransition) {
        document.startViewTransition(() => {
          setState({ ...state, grace: event.data.duration });
        });
      }
      else {
        setState({ ...state, grace: event.data.duration });
      }
    }
    else if (event.data.id === "duration") {
      if (event.data.duration < 0) {
        skip();
      }
      else {
        setState({ ...state, duration: event.data.duration });
      }
    }
  }

  function handleImageLoad() {
    setState({ ...state, loading: false });
    initWorker({ id: "duration", action: "start", duration: state.duration });
  }

  if (sessionEnded) {
    return <EndSessionView images={session.images} close={close}/>;
  }
  return (
    <div className="session">
      {state.paused ? (
        <div className="session-paused">
          <h2 className="session-paused-title">Paused</h2>
          <div className="session-paused-buttons">
            <button className="btn primary-btn" onClick={pause}>Continue</button>
            <button className="btn text-btn" onClick={endSession}>Quit</button>
          </div>
        </div>
      ) : (
        <>
          {state.loading ? null : (
            <div className="session-bar-progress-container">
              <div className="session-bar-progress-bar" style={{ scale: `${1 - (state.duration / session.duration)} 1` }}></div>
            </div>
          )}
          {state.grace > -1 ? (
            <div className="session-grace">
              <div className="session-grace-text">{state.stateText}</div>
              <div className="session-grace-value">{state.grace}</div>
              {state.stateId === LOADING && session.grace >= 10 ? <button className={`btn text-btn${state.grace < session.grace - PAUSE_DURATION ? "" : " hidden"}`} onClick={endSession}>Quit</button> : null}
            </div>
          ) : (
            <ImageViewer images={session.images} index={state.index} inSession pause={pause} skip={skip} onImageReady={handleImageLoad} close={endSession}/>
          )}
        </>
      )}
    </div>
  );
}
