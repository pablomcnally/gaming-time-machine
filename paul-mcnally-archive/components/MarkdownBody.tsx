import { MarkdownBody as Content, type MarkdownBodyProps } from "./MarkdownContent";
import { ResponsiveImage } from "./ResponsiveImage";
export { getMarkdownHeadings } from "./MarkdownContent";
export type { MarkdownHeading } from "./MarkdownContent";
export function MarkdownBody(props: MarkdownBodyProps) {
  return <Content {...props} renderImage={(src, alt) => <ResponsiveImage alt={alt} sizes="(min-width: 1024px) 750px, 100vw" src={src} />} />;
}
