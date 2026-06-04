import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const imageExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const imageRoots = {
  artifacts: "artifacts",
  "magazine-covers": "magazine-covers"
} as const;

type ImageRoot = keyof typeof imageRoots;

type CuratorImage = {
  directory: string;
  filename: string;
  kind: ImageRoot;
  label: string;
  src: string;
};

function isImageRoot(value: string | null): value is ImageRoot {
  return value === "artifacts" || value === "magazine-covers";
}

async function findImages(rootDirectory: string, publicPathPrefix: string, kind: ImageRoot) {
  const images: CuratorImage[] = [];

  async function walk(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();

      if (!imageExtensions.has(extension)) {
        continue;
      }

      const relativePath = path.relative(rootDirectory, absolutePath).split(path.sep).join("/");
      const directoryName = path.dirname(relativePath).replace(".", "");

      images.push({
        directory: directoryName,
        filename: entry.name,
        kind,
        label: relativePath,
        src: `${publicPathPrefix}/${relativePath}`
      });
    }
  }

  await walk(rootDirectory);

  return images.sort((left, right) => left.label.localeCompare(right.label));
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        ok: false,
        message: "Image browsing is only available in local development."
      },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const requestedKind = url.searchParams.get("kind");
  const kinds = isImageRoot(requestedKind) ? [requestedKind] : (Object.keys(imageRoots) as ImageRoot[]);
  const publicDirectory = path.join(process.cwd(), "public");
  const images = (
    await Promise.all(
      kinds.map(async (kind) => {
        const folder = imageRoots[kind];
        const rootDirectory = path.join(publicDirectory, folder);
        const resolvedRoot = path.resolve(rootDirectory);
        const resolvedPublic = path.resolve(publicDirectory);

        if (!resolvedRoot.startsWith(`${resolvedPublic}${path.sep}`)) {
          return [];
        }

        return findImages(resolvedRoot, `/${folder}`, kind);
      })
    )
  ).flat();

  return NextResponse.json({
    ok: true,
    images
  });
}
