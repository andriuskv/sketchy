type Image = {
  file: File,
  // thumb: string,
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

// export type { Image, Prefs, Session };
