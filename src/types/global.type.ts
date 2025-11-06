type Image = {
  index: number,
  file: File,
  name: string,
  size: number,
  date: number,
  selected: boolean
};

type Prefs = {
  count: number,
  randomize: boolean,
  duration: number,
  grace: number
};

type Session = Prefs & { images: Image[] };
