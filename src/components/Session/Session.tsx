import { useState, useEffect } from "react";
import * as fileService from "services/files";
import "./Session.css";
import EndSessionView from "./EndSessionView/EndSessionView";
import useWorker from "./useWorker";
import ImageViewer from "../ImageViewer/ImageViewer";
import * as pip from "../ImageViewer/picture-in-picture";

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

  function endSession(fromPip = false) {
    if (!fromPip) {
      pip.close();
    }
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
    pip.updateImage({
      index: state.index,
      url: fileService.preloadImage(session.images[state.index])
    }, session.images.length);
    pip.updateGraceView(manual ? PAUSE_DURATION : session.grace, manual ? "Skipping" : "Loading", false);
    pip.toggleGraceView(true);
    pip.updateProgressBar(0);
  }

  function pause() {
    if (state.loading) {
      return;
    }
    const paused = !state.paused;

    destroyWorkers();

    if (paused) {
      pip.handlePipPause(paused);
      setState({ ...state, paused, duration: state.duration, grace: session.grace  });
    }
    else {
      pip.updateGraceView(PAUSE_DURATION, "Continuing", false);
      pip.toggleGraceView(true);
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

  function skipWaiting() {
    destroyWorkers();
    setState({
      ...state,
      grace: -1,
      loading: false
    });
  }

  useEffect(() => {
    function handleKeydown({ key }: KeyboardEvent) {
      if (sessionEnded) {
        return;
      }

      if (key === "ArrowRight") {
        skip(true);
      }
      else if (key === "Escape" || key === " ") {
        pause();
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [state, sessionEnded]);

  useEffect(() => {
    pip.updateActions({
      skip: () => skip(true),
      pause: () => pause(),
      endSession: () => endSession(true),
      skipWaiting: () => skipWaiting()
    });
  }, [state]);

  function handleMessage(event: MessageEvent) {
    if (event.data.id === "grace") {
      if (event.data.duration < 0) {
        pip.handlePipPause(false);
        setState({
          ...state,
          paused: false,
          grace: event.data.duration,
        });
      }
      else {
        pip.updateGraceView(event.data.duration, state.stateText, state.grace < session.grace - PAUSE_DURATION);
        setState({ ...state, grace: event.data.duration });
      }
    }
    else if (event.data.id === "duration") {
      if (event.data.duration < 0) {
        skip();
      }
      else {
        setState({ ...state, duration: event.data.duration });
        pip.updateProgressBar(1 - (event.data.duration / session.duration));
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
            <button className="btn text-btn" onClick={() => endSession()}>Quit</button>
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
              {state.stateId === LOADING && session.grace >= 10 ? (
                <div className="session-grace-btns">
                  <button className={`btn text-btn${state.grace < session.grace - PAUSE_DURATION ? "" : " hidden"}`}
                    onClick={skipWaiting}>Skip Waiting</button>
                  <button className={`btn text-btn${state.grace < session.grace - PAUSE_DURATION ? "" : " hidden"}`}
                    onClick={() => endSession()}>Quit</button>
                </div>
              ) : null}
            </div>
          ) : (
            <ImageViewer images={session.images} index={state.index} inSession pause={pause} skip={skip} onImageReady={handleImageLoad} close={endSession}/>
          )}
        </>
      )}
    </div>
  );
}
