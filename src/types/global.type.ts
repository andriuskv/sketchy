type Image = {
  index: number,
  file: File,
  name: string,
  size: number,
  date: number,
  count: number,
  selected: boolean,
  mirrored?: boolean
};

type Prefs = {
  id: string,
  count: number,
  randomize: boolean,
  randomizeFlip: boolean,
  duration: number,
  customDuration: boolean,
  grace: number
};

type Session = Prefs & { images: Image[], repeating?: boolean };

type FormSession = Prefs & {
  active: boolean,
  title: string
};
