import january1982 from "../data/1982/january.json";
import february1982 from "../data/1982/february.json";
import march1982 from "../data/1982/march.json";
import april1982 from "../data/1982/april.json";
import may1982 from "../data/1982/may.json";
import june1982 from "../data/1982/june.json";
import july1982 from "../data/1982/july.json";
import august1982 from "../data/1982/august.json";
import september1982 from "../data/1982/september.json";
import october1982 from "../data/1982/october.json";
import november1982 from "../data/1982/november.json";
import december1982 from "../data/1982/december.json";
import january1983 from "../data/1983/january.json";
import february1983 from "../data/1983/february.json";
import march1983 from "../data/1983/march.json";
import april1983 from "../data/1983/april.json";
import may1983 from "../data/1983/may.json";
import june1983 from "../data/1983/june.json";
import july1983 from "../data/1983/july.json";
import august1983 from "../data/1983/august.json";
import september1983 from "../data/1983/september.json";
import october1983 from "../data/1983/october.json";
import november1983 from "../data/1983/november.json";
import december1983 from "../data/1983/december.json";
import december1984 from "../data/1984/december.json";
import january1997 from "../data/1997/january.json";
import february1997 from "../data/1997/february.json";
import march1997 from "../data/1997/march.json";
import april1997 from "../data/1997/april.json";
import may1997 from "../data/1997/may.json";
import june1997 from "../data/1997/june.json";
import july1997 from "../data/1997/july.json";
import august1997 from "../data/1997/august.json";
import september1997 from "../data/1997/september.json";
import october1997 from "../data/1997/october.json";
import november1997 from "../data/1997/november.json";
import december1997 from "../data/1997/december.json";

export type ExhibitStatus = "ai-draft" | "human-edited" | "verified";

export type Exhibit = {
  status: ExhibitStatus;
  lastEdited: string;
  editorNotes: string[];
  museum: {
    name: string;
    period: string;
    accession: string;
    dek: string;
    curatorNote: string;
    statusChips: string[];
  };
  sections: {
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: {
      title: string;
      body: string;
      [key: string]: unknown;
    }[];
  }[];
  sources: {
    label: string;
    url: string;
  }[];
};

export type ExhibitManifest = Record<number, Partial<Record<string, Exhibit>>>;

/*
  Future archive additions for Vercel-safe builds:
  - Keep exhibit files in data/<year>/<month>.json, using lowercase month names.
  - Add one static import above, such as:
    import november1998 from "../data/1998/november.json";
  - Add that import to EXHIBIT_MANIFEST below:
    1998: { november: november1998 }

  This manifest replaces runtime filesystem scanning so serverless deployments do not
  attempt to read /var/task/data.
*/
export const EXHIBIT_MANIFEST = {
  1982: {
    january: january1982,
    february: february1982,
    march: march1982,
    april: april1982,
    may: may1982,
    june: june1982,
    july: july1982,
    august: august1982,
    september: september1982,
    october: october1982,
    november: november1982,
    december: december1982
  },
  1983: {
    january: january1983,
    february: february1983,
    march: march1983,
    april: april1983,
    may: may1983,
    june: june1983,
    july: july1983,
    august: august1983,
    september: september1983,
    october: october1983,
    november: november1983,
    december: december1983
  },
  1984: {
  december: december1984
},
  1997: {
    january: january1997,
    february: february1997,
    march: march1997,
    april: april1997,
    may: may1997,
    june: june1997,
    july: july1997,
    august: august1997,
    september: september1997,
    october: october1997,
    november: november1997,
    december: december1997
  }
} as unknown as ExhibitManifest;
