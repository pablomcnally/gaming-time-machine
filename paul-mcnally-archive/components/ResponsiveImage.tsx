import "server-only";

import Image from "next/image";
import fs from "node:fs";
import path from "node:path";

type Dimensions = { width: number; height: number };

type ResponsiveImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

const dimensionsCache = new Map<string, Dimensions | null>();

function readJpegDimensions(buffer: Buffer): Dimensions | null {
  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }

    if (length < 2) return null;
    offset += length + 2;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer): Dimensions | null {
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X" && dataOffset + 10 <= buffer.length) {
      return {
        width: 1 + buffer.readUIntLE(dataOffset + 4, 3),
        height: 1 + buffer.readUIntLE(dataOffset + 7, 3)
      };
    }

    if (chunkType === "VP8 " && dataOffset + 10 <= buffer.length) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff
      };
    }

    if (chunkType === "VP8L" && dataOffset + 5 <= buffer.length) {
      const b1 = buffer[dataOffset + 1];
      const b2 = buffer[dataOffset + 2];
      const b3 = buffer[dataOffset + 3];
      const b4 = buffer[dataOffset + 4];

      return {
        width: 1 + b1 + ((b2 & 0x3f) << 8),
        height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10)
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

function readDimensions(src: string): Dimensions | null {
  const cached = dimensionsCache.get(src);

  if (cached !== undefined) return cached;

  try {
    const publicRoot = path.resolve(process.cwd(), "public");
    const filePath = path.resolve(publicRoot, src.replace(/^\/+/, ""));

    if (!filePath.startsWith(`${publicRoot}${path.sep}`)) return null;

    const buffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    let dimensions: Dimensions | null = null;

    if (extension === ".png" && buffer.length >= 24) {
      dimensions = { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    } else if ((extension === ".jpg" || extension === ".jpeg") && buffer.length >= 12) {
      dimensions = readJpegDimensions(buffer);
    } else if (extension === ".webp" && buffer.length >= 30) {
      dimensions = readWebpDimensions(buffer);
    } else if (extension === ".gif" && buffer.length >= 10) {
      dimensions = { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }

    dimensionsCache.set(src, dimensions);
    return dimensions;
  } catch {
    dimensionsCache.set(src, null);
    return null;
  }
}

export function ResponsiveImage({ src, alt, sizes, className, priority = false }: ResponsiveImageProps) {
  const dimensions = readDimensions(src);

  if (!dimensions || src.toLowerCase().endsWith(".gif")) {
    return <img alt={alt} className={className} decoding="async" loading={priority ? "eager" : "lazy"} sizes={sizes} src={src} />;
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={dimensions.height}
      priority={priority}
      sizes={sizes}
      src={src}
      width={dimensions.width}
    />
  );
}
