type Image = {
  file: File,
  name: string,
  selected: boolean
};

type Prefs = {
  count: number,
  randomize: boolean,
  duration: number,
  grace: number
};

type Session = Prefs & { images: Image[] };
