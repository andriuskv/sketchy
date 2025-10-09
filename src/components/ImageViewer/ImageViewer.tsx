import { useState, useEffect, useRef } from "react";
import Icon from "components/Icon/Icon";
import "./image-viewer.css";
import EndSessionView from "./EndSessionView/EndSessionView";
import useWorker from "./useWorker";


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
  current: string | null,
  paused: boolean,
  duration: number,
  index: number
}

const PAUSE_DURATION = 3;
const STARTING = 0;
const CONTINUING = 1;
const SKIPPING = 2;
const LOADING = 3;

export default function ImageViewer({ session, close }: Props) {
  const [state, setState] = useState<State>({
    loading: true,
    grace: PAUSE_DURATION,
    stateText: "Starting",
    stateId: STARTING,
    current: null,
    paused: false,
    duration: session.duration,
    index: 0
  });
  const [sessionEnded, setSessionEnded] = useState(false);
  const preloaded = useRef<{ [key: string]: string }>({});
  const { initWorker, destroyWorkers } = useWorker(handleMessage, [state.index, state.loading, state.paused]);

  useEffect(() => {
    initWorker({ id: "grace", action: "start", duration: PAUSE_DURATION });
    preloadImage(0, session.images[0].name);

    return () => {
      destroyWorkers();
    };
  }, []);

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
          current: preloaded.current[session.images[state.index].name]
        });
      }
      else {
        if (document.startViewTransition) {
          document.startViewTransition(() => {
            setState({ ...state, grace: event.data.duration });
          });
        }
        else {
          setState({ ...state, grace: event.data.duration });
        }
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

  function preloadImage(index: number, name: string) {
    if (preloaded.current[name]) {
      return;
    }
    const url = URL.createObjectURL(session.images[index].file);
    preloaded.current[name] = url;

    const img = new Image();
    img.src = url;
  }

  function handleImageLoad() {
    setState({ ...state, loading: false });
    initWorker({ id: "duration", action: "start", duration: state.duration });
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

    if (state.current) {
      URL.revokeObjectURL(state.current);
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
    preloadImage(nextIndex, session.images[nextIndex].name);
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

  function endSession() {
    if (state.current) {
      URL.revokeObjectURL(state.current);
    }
    destroyWorkers();
    setSessionEnded(true);
  }

  if (sessionEnded) {
    return <EndSessionView images={session.images} close={close}/>;
  }
  return (
    <div className="viewer">
      {state.paused ? (
        <div className="viewer-paused">
          <h2 className="viewer-paused-title">Paused</h2>
          <div className="viewer-paused-buttons">
            <button className="btn primary-btn" onClick={pause}>Continue</button>
            <button className="btn text-btn" onClick={endSession}>Quit</button>
          </div>
        </div>
      ) : (
        <>
          {state.loading ? null : (
            <>
              <div className="viewer-bar viewer-top-bar">
                <div className="viewer-bar-progress-container">
                  <div className="viewer-bar-progress-bar" style={{ scale: `${1 - (state.duration / session.duration)} 1` }}></div>
                </div>
                <button className="btn icon-btn viewer-close-btn" onClick={pause} title="pause">
                  <Icon id="pause"/>
                </button>
              </div>
              <div className="viewer-bar viewer-bottom-bar">
                <span className="viewer-bar-item-info">{state.index + 1} / {session.images.length}</span>
                <button className="btn text-btn" onClick={() => skip(true)}>Skip</button>
              </div>
            </>
          )}
          {state.grace > -1 ? (
            <div className="viewer-grace">
              <div className="viewer-grace-text">{state.stateText}</div>
              <div className="viewer-grace-value">{state.grace}</div>
              {state.stateId === LOADING && session.grace >= 10 ? <button className={`btn text-btn${state.grace < session.grace - PAUSE_DURATION ? "" : " hidden"}`} onClick={endSession}>Quit</button> : null}
            </div>
          ) : (
            <img src={state.current!} onLoad={handleImageLoad} className={`viewer-image`}/>
          )}
        </>
      )}
    </div>
  );
}
