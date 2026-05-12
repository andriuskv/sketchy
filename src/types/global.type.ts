type Image = {
  id: string,
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
  customDuration?: boolean,
  grace: number
};

type FormSession = Prefs & {
  type: "session";
  active: boolean,
  title: string
};

type SelectedSession = FormSession & { listId: string };

type Break = {
  type: "break";
  id: string;
  duration: number;
  customDuration?: boolean;
}

type Session = {
  type: "session";
  id: string;
  title: string;
}

type Program = {
  type: "program";
  title: string;
  id: string;
  active: boolean;
  items: (Session | Break)[];
}

type PracticeSession = Prefs & {
  type: "session";
  title: string;
  images: Image[];
}

type Practice = {
  readonly id: string;
  items: (PracticeSession | Break)[];
  repeatId?: string;
  repeating?: boolean;
};
