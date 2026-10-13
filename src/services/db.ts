import { set, values, createStore, clear, get } from "idb-keyval";

const store = createStore("sketchy", "dir");

async function clearStore() {
  try {
    await clear(store);
  } catch {
    // Ignore
  }
}

function addItem(item: { handle: FileSystemDirectoryEntry, date: number }) {
  try {
    set(item.handle.name, item, store);
  } catch {
    // Ignore
  }
}

async function updateAccessed(handle: FileSystemDirectoryEntry) {
  try {
    const item = await get(handle.name, store);

    set(handle.name, { ...item, date: Date.now() }, store);
  } catch {
    // Ignore
  }
}

async function getAll() {
  try {
    const items = await values(store);

    return items.toSorted((a, b) => b.date - a.date);
  } catch {
    return [];
  }
}

export {
  clearStore,
  addItem,
  updateAccessed,
  getAll
};
