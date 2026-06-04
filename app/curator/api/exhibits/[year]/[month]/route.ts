import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Exhibit, ExhibitStatus } from "../../../../../../data/archive";

type SaveParams = Promise<{
  year: string;
  month: string;
}>;

const statuses = new Set<ExhibitStatus>(["ai-draft", "human-edited", "verified"]);
const months = new Set([
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateExhibit(value: unknown) {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ["Request body must be an exhibit object."];
  }

  if (!statuses.has(value.status as ExhibitStatus)) {
    errors.push("Status must be ai-draft, human-edited, or verified.");
  }

  if (!isString(value.lastEdited) || !/^\d{4}-\d{2}-\d{2}$/.test(value.lastEdited)) {
    errors.push("lastEdited must use YYYY-MM-DD format.");
  }

  if (!Array.isArray(value.editorNotes) || !value.editorNotes.every((note) => typeof note === "string")) {
    errors.push("editorNotes must be a list of text notes.");
  }

  if (!isRecord(value.museum)) {
    errors.push("museum is required.");
  } else {
    for (const field of ["name", "period", "accession", "dek", "curatorNote"]) {
      if (!isString(value.museum[field])) {
        errors.push(`museum.${field} is required.`);
      }
    }

    if (!Array.isArray(value.museum.statusChips) || !value.museum.statusChips.every((chip) => typeof chip === "string")) {
      errors.push("museum.statusChips must be a list of text chips.");
    }
  }

  if (!Array.isArray(value.sections) || value.sections.length === 0) {
    errors.push("sections must include at least one section.");
  } else {
    value.sections.forEach((section, sectionIndex) => {
      if (!isRecord(section)) {
        errors.push(`Section ${sectionIndex + 1} must be an object.`);
        return;
      }

      for (const field of ["id", "eyebrow", "title", "subtitle"]) {
        if (!isString(section[field])) {
          errors.push(`Section ${sectionIndex + 1} needs ${field}.`);
        }
      }

      if (!Array.isArray(section.items)) {
        errors.push(`Section ${sectionIndex + 1} needs items.`);
        return;
      }

      section.items.forEach((item, itemIndex) => {
        if (!isRecord(item)) {
          errors.push(`Section ${sectionIndex + 1} item ${itemIndex + 1} must be an object.`);
          return;
        }

        if (!isString(item.title)) {
          errors.push(`Section ${sectionIndex + 1} item ${itemIndex + 1} needs a title.`);
        }

        if (!isString(item.body)) {
          errors.push(`Section ${sectionIndex + 1} item ${itemIndex + 1} needs body text.`);
        }
      });
    });
  }

  if (!Array.isArray(value.sources)) {
    errors.push("sources must be a list.");
  } else {
    value.sources.forEach((source, sourceIndex) => {
      if (!isRecord(source)) {
        errors.push(`Source ${sourceIndex + 1} must be an object.`);
        return;
      }

      if (!isString(source.label)) {
        errors.push(`Source ${sourceIndex + 1} needs a label.`);
      }

      if (!isString(source.url)) {
        errors.push(`Source ${sourceIndex + 1} needs a URL.`);
      } else {
        try {
          new URL(source.url);
        } catch {
          errors.push(`Source ${sourceIndex + 1} has an invalid URL.`);
        }
      }
    });
  }

  return errors;
}

export async function POST(request: Request, { params }: { params: SaveParams }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        ok: false,
        message: "Saving exhibit JSON is only available in local development."
      },
      { status: 403 }
    );
  }

  const { year, month } = await params;

  if (!/^\d{4}$/.test(year) || !months.has(month)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid exhibit path."
      },
      { status: 400 }
    );
  }

  const body = (await request.json()) as unknown;
  const errors = validateExhibit(body);

  if (errors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: errors[0],
        errors
      },
      { status: 400 }
    );
  }

  const dataRoot = path.join(process.cwd(), "data");
  const yearDirectory = path.join(dataRoot, year);
  const targetPath = path.join(yearDirectory, `${month}.json`);
  const resolvedTarget = path.resolve(targetPath);
  const resolvedDataRoot = path.resolve(dataRoot);

  if (!resolvedTarget.startsWith(`${resolvedDataRoot}${path.sep}`)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Refusing to write outside the data directory."
      },
      { status: 400 }
    );
  }

  const exhibit = body as Exhibit;

  await mkdir(yearDirectory, { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(exhibit, null, 2)}\n`, "utf8");

  return NextResponse.json({
    ok: true,
    message: `Saved data/${year}/${month}.json`
  });
}
