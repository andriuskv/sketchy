import { useState, useEffect, type ChangeEvent } from "react";
import * as fileService from "services/files";
import "./Practice.css";
import EndPracticeView from "./EndPracticeView/EndPracticeView";
import useWorker from "./useWorker";
import ImageViewer from "../ImageViewer/ImageViewer";
import * as pip from "../ImageViewer/picture-in-picture";
import { formatDuration } from "@/utils";
import Icon from "../Icon/Icon";

type Props = {
  practice: Practice,
  toggleAllImages: (practice: Practice, toggle: boolean) => void,
  handleImageSelection: (event: ChangeEvent<HTMLInputElement>, name: string, itemIndex: number) => void,
  close: () => void,
  repeatPractice: (same: boolean) => void
}

type StateText = "Starting" | "Continuing" | "Skipping" | "Loading";

type State = {
  grace: number,
  stateText: StateText,
  stateId: number
  paused: boolean,
  duration: number,
  imageIndex: number,
  itemIndex: number,
  afterBreak?: boolean
}

const PAUSE_DURATION = 5 * 1000;
const SKIP_DURATION = 3 * 1000;
const STARTING = 0;
const CONTINUING = 1;
const SKIPPING = 2;
const LOADING = 3;

function StartingInfo({ item }: { item: PracticeSession }) {
  return (
    <div className="practice-starting-splash">
      <h2 className="practice-starting-title">{item.title}</h2>
      <div className="practice-starting-info">
        <div className="practice-starting-info-item">
          <Icon id="image" title="Images" size="16px"></Icon>
          <div className="practice-form-program-session-size">{item.count}</div>
        </div>
        {item.randomize ? (
          <Icon id="shuffle" className="practice-starting-info-item" title="Randomize" size="16px"></Icon>
        ) : null}
        <div className="practice-starting-info-item">
          <Icon id="clock" title="Duration" size="16px"></Icon>
          <div className="practice-form-program-session-time">{formatDuration(Math.round(item.duration / 1000))}</div>
        </div>
        {item.randomizeFlip ? (
          <Icon id="mirror" className="practice-starting-info-item" title="Randomize flip" size="16px"></Icon>
        ) : null}
        <div className="practice-starting-info-item">
          <Icon id="sleep" title="Grace period" size="16px"></Icon>
          <div className="practice-form-program-session-cycles">{formatDuration(Math.round(item.grace / 1000))}</div>
        </div>
      </div>
    </div>
  );
}

function GraceView({ item, state, skipWaiting, endPractice }: { item: PracticeSession, state: State, skipWaiting: () => void, endPractice: () => void }) {
  const graceWhole = Math.round(state.grace / 1000);
  let gracePretty = graceWhole.toString();

  if (state.stateId === LOADING && item.grace >= 60000) {
    gracePretty = formatDuration(graceWhole);
  }
  return (
    <div className="practice-grace">
      <div className="practice-grace-text">{state.stateText}</div>
      <div className="practice-grace-value">{gracePretty}</div>
      {state.stateId === STARTING || state.afterBreak ? <StartingInfo item={item} /> : null}
      {state.stateId === LOADING && item.grace >= 10 ? (
        <div className="practice-grace-btns">
          <button className={`btn text-btn${state.grace < item.grace - PAUSE_DURATION ? "" : " hidden"}`}
            onClick={skipWaiting}>Skip Waiting</button>
          <button className={`btn text-btn${state.grace < item.grace - PAUSE_DURATION ? "" : " hidden"}`}
            onClick={() => endPractice()}>Quit</button>
        </div>
      ) : null}
    </div>
  )
}

export default function Practice({ practice, toggleAllImages, handleImageSelection, close, repeatPractice }: Props) {
  const [state, setState] = useState<State>({
    grace: PAUSE_DURATION,
    stateText: "Starting",
    stateId: STARTING,
    paused: false,
    duration: -1,
    imageIndex: 0,
    itemIndex: 0
  });
  const [practiceEnded, setPracticeEnded] = useState(false);
  const { initWorker, destroyWorkers } = useWorker(handleMessage, [state.imageIndex, state.paused, state.grace === -1]);
  const currentItem = practice.items[state.itemIndex];
  const interval = currentItem.duration < 10000 ? 100 : currentItem.duration < 60000 ? 250 : 1000;

  useEffect(() => {
    if (practice.repeating) {
      setState({
        grace: PAUSE_DURATION,
        stateText: "Starting",
        stateId: STARTING,
        paused: false,
        duration: -1,
        imageIndex: 0,
        itemIndex: 0
      });
      setPracticeEnded(false);
    }
    initWorker({ id: "grace", action: "start", duration: PAUSE_DURATION, interval });

    return () => {
      destroyWorkers();
    };
  }, [practice.repeatId]);

  function endPractice(fromPip = false) {
    if (!fromPip) {
      pip.close();
    }
    destroyWorkers();
    setPracticeEnded(true);
  }

  function skip(manual = false) {
    if (state.grace > -1 || state.paused) {
      return;
    }
    let nextIndex = state.imageIndex + 1;

    if (currentItem.type === "session" && nextIndex === currentItem.images.length && state.itemIndex === practice.items.length - 1) {
      endPractice();
      return;
    }
    let itemIndex = state.itemIndex;
    let afterBreak = false;

    if (currentItem.type === "break" || nextIndex === currentItem.images.length) {
      itemIndex += 1;
      nextIndex = 0;
      afterBreak = true;
    }
    const nextItem = practice.items[itemIndex];
    let graceDuration;

    if (nextItem.type === "break") {
      graceDuration = -1;
    }
    else {
      graceDuration = manual ? SKIP_DURATION : nextItem.grace;
    }
    destroyWorkers();
    setState({
      ...state,
      grace: graceDuration,
      stateText: manual ? "Skipping" : "Loading",
      stateId: manual ? SKIPPING : LOADING,
      duration: nextItem.duration,
      imageIndex: nextIndex,
      itemIndex,
      afterBreak
    });

    if (nextItem.type === "session") {
      initWorker({ id: "grace", action: "start", duration: graceDuration, interval });
      pip.updateImage({
        index: nextIndex,
        url: fileService.preloadImage(nextItem.images[nextIndex])
      }, nextItem.images.length);
      pip.updateGraceView(manual ? SKIP_DURATION : nextItem.grace, manual ? "Skipping" : "Loading", false);
      pip.toggleGraceView(true);
    }
    else {
      pip.updateBreakView(nextItem.duration);
      pip.toggleBreakView(true);
      initWorker({ id: "duration", action: "start", duration: nextItem.duration, interval });
    }
    pip.updateProgressBar(0);
  }

  function pause() {
    if (state.grace > -1 && !state.paused) {
      return;
    }
    const paused = !state.paused;

    destroyWorkers();

    if (paused) {
      pip.handlePipPause(paused);
      setState({ ...state, paused, grace: PAUSE_DURATION });
    }
    else {
      pip.updateGraceView(PAUSE_DURATION, "Continuing", false);
      pip.toggleGraceView(true);
      setState({
        ...state,
        paused,
        stateText: "Continuing",
        stateId: CONTINUING
      });
      initWorker({ id: "grace", action: "start", duration: PAUSE_DURATION, interval });
    }
  }

  function skipWaiting() {
    destroyWorkers();
    setState({
      ...state,
      grace: -1
    });
    initWorker({ id: "duration", action: "start", duration: currentItem.duration });
  }

  useEffect(() => {
    pip.updateActions({
      skip: () => skip(true),
      pause: () => pause(),
      endPractice: () => endPractice(true),
      skipWaiting: () => skipWaiting()
    });
  }, [state]);

  function handleMessage(event: MessageEvent) {
    if (event.data.id === "grace") {
      if (event.data.duration < 0) {
        const duration = state.duration === -1 ? currentItem.duration : state.duration;
        pip.handlePipPause(false);
        setState({
          ...state,
          paused: false,
          grace: -1,
          duration
        });
        initWorker({ id: "duration", action: "start", duration, interval });
      }
      else {
        pip.updateGraceView(event.data.duration, state.stateText, state.grace < (currentItem as PracticeSession).grace - PAUSE_DURATION);
        setState({ ...state, grace: event.data.duration });
      }
    }
    else if (event.data.id === "duration") {
      if (event.data.duration < 0) {
        skip();
      }
      else {
        setState({ ...state, grace: -1, duration: event.data.duration });
        pip.updateProgressBar(1 - (event.data.duration / currentItem.duration));

        if (currentItem.type === "break") {
          pip.updateBreakView(event.data.duration);
        }
      }
    }
  }

  if (practiceEnded) {
    return <EndPracticeView practice={practice} toggleAllImages={toggleAllImages} handleImageSelection={handleImageSelection} repeatPractice={repeatPractice} close={close} />;
  }

  return (
    <div className="practice">
      {state.paused ? (
        <div className="practice-paused">
          <h2 className="practice-paused-title">Paused</h2>
          <div className="practice-paused-buttons">
            <button className="btn primary-btn" onClick={pause}>Resume</button>
            <button className="btn text-btn" onClick={() => endPractice()}>Quit</button>
          </div>
        </div>
      ) : state.grace > -1 ? (
        <GraceView item={currentItem as PracticeSession} state={state} skipWaiting={skipWaiting} endPractice={endPractice} />
      ) : currentItem.type === "break" ? (
        <div className="practice-grace">
          <h2>Break</h2>
          <div className="practice-grace-value">{formatDuration(Math.round(state.duration / 1000))}</div>
          <div className="practice-grace-btns">
            <button className="btn text-btn" onClick={() => skip(true)}>Continue</button>
            <button className="btn text-btn" onClick={() => endPractice()}>Quit</button>
          </div>
        </div>
      ) : null}
      {state.duration === -1 ? null : (
        <div className="practice-bar-progress-container">
          <div className="practice-bar-progress-bar" style={{ scale: `${1 - (state.duration / currentItem.duration)} 1` }}></div>
        </div>
      )}
      {currentItem.type === "session" ? <ImageViewer images={currentItem.images} index={state.imageIndex} paused={state.paused} inSession pause={pause} skip={skip} close={endPractice} hideControls={state.paused || state.grace > -1} /> : null}
    </div>
  );
}
