import Link from "next/link";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((?:https?:\/\/|\/)[^)]+\)|<br\s*\/?>)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (/^<br\s*\/?>$/.test(part)) {
      return <br key={index} />;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)$/);

    if (linkMatch) {
      const [, label, href] = linkMatch;
      const external = href.startsWith("http");

      return (
        <Link href={href} key={index} rel={external ? "noreferrer" : undefined} target={external ? "_blank" : undefined}>
          {label}
          {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
        </Link>
      );
    }

    return part;
  });
}

type MarkdownBodyProps = {
  className?: string;
  content: string;
};

export function MarkdownBody({ className = "", content }: MarkdownBodyProps) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className={`prose-terminal max-w-none ${className}`}>
      {blocks.map((block) => {
        const tableLines = block.split("\n");
        const tableRows = tableLines.map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
        const isTable =
          tableRows.length >= 2 &&
          tableRows[0].length > 1 &&
          tableRows[1].length === tableRows[0].length &&
          tableRows[1].every((cell) => /^:?-{3,}:?$/.test(cell));

        if (isTable) {
          const [headers, , ...rows] = tableRows;

          return (
            <div className="portfolio-table-scroll" key={block}>
              <table>
                <thead>
                  <tr>{headers.map((header) => <th key={header} scope="col">{renderInline(header)}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={`${rowIndex}-${row.join("-")}`}>
                      {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{renderInline(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const backgroundSectionMatch = block.match(/^\[BACKGROUND SECTION:(\/[^|\]]+)\|([^\]]+)\]\n([\s\S]+)$/);

        if (backgroundSectionMatch) {
          const [, src, description, sectionCopy] = backgroundSectionMatch;
          const paragraphs = sectionCopy.split(/\n+/).filter(Boolean);

          return (
            <section
              className="portfolio-background-section"
              key={src}
              style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.9)), url("${src}")` }}
            >
              <span className="sr-only">Background image: {description}</span>
              {paragraphs.map((paragraph) => <p key={paragraph}>{renderInline(paragraph)}</p>)}
            </section>
          );
        }

        const imageMatch = block.match(/^!\[([^\]]*)\]\((\/[^)\s]+)(?:\s+"([^"]*)")?\)(?:\n\*(.*?)\*)?$/);

        if (imageMatch) {
          const [, alt, src, inlineCaption, followingCaption] = imageMatch;
          const caption = inlineCaption || followingCaption;

          return (
            <figure className="portfolio-media" key={`${src}-${caption || alt}`}>
              <img alt={alt} loading="lazy" src={src} />
              {caption ? <figcaption>{renderInline(caption)}</figcaption> : null}
            </figure>
          );
        }

        const youtubeMatch = block.match(/^\[YOUTUBE:(https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)(?:&[^\]|]+)?)\|([^\]]+)\]$/);

        if (youtubeMatch) {
          const [, videoUrl, videoId, title] = youtubeMatch;
          const timestamp = new URL(videoUrl).searchParams.get("t");
          const startAt = timestamp?.match(/^(\d+)s?$/)?.[1];
          const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}${startAt ? `?start=${startAt}` : ""}`;

          return (
            <figure className="portfolio-media portfolio-video" key={videoId}>
              <div className="portfolio-video-frame">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={embedUrl}
                  title={title}
                />
              </div>
              <figcaption>
                {title} // <a href={videoUrl} rel="noreferrer" target="_blank">Watch on YouTube</a>
              </figcaption>
            </figure>
          );
        }

        if (block.startsWith("## ")) {
          return <h2 key={block}>{block.replace("## ", "")}</h2>;
        }

        if (block.startsWith("### ")) {
          return <h3 key={block}>{block.replace("### ", "")}</h3>;
        }

        if (block.startsWith("> ")) {
          return <blockquote key={block}>{renderInline(block.replace(/^> /gm, ""))}</blockquote>;
        }

        if (block.startsWith("- ")) {
          const items = block.split(/\n/).map((item) => item.replace("- ", ""));

          return (
            <ul key={block}>
              {items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (/^\d+\. /.test(block)) {
          const items = block.split(/\n/).map((item) => item.replace(/^\d+\. /, ""));

          return (
            <ol key={block}>
              {items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return <p key={block}>{renderInline(block)}</p>;
      })}
    </div>
  );
}
