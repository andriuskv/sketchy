import { getRandomString } from "@/utils";

function getDefaultSession(): FormSession {
  return {
    type: "session",
    title: "Default",
    id: getRandomString(4),
    count: 10,
    randomize: true,
    randomizeFlip: false,
    duration: 180,
    customDuration: false,
    grace: 5,
    active: false
  };
}

function getDefaultProgram(): Program {
  return {
    type: "program",
    title: "Default",
    id: getRandomString(4),
    active: false,
    items: []
  }
}

export {
  getDefaultSession,
  getDefaultProgram
}
