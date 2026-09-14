import Link from "next/link";
import type { MarkdownHeading } from "./MarkdownBody";

type NavigationItem = {
  href: string;
  title: string;
};

export function ArticleContents({ className = "", headings }: { className?: string; headings: MarkdownHeading[] }) {
  return (
    <nav aria-label="On this page" className={`article-contents ${className}`}>
      <p className="article-contents-label">On this page</p>
      <ol>
        {headings.map((heading) => (
          <li data-level={heading.level} key={heading.id}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ArticlePagination({ next, previous }: { next?: NavigationItem; previous?: NavigationItem }) {
  if (!previous && !next) return null;

  return (
    <nav aria-label="Continue reading" className="article-pagination">
      {previous ? (
        <Link data-direction="previous" href={previous.href} rel="prev">
          <span aria-hidden="true">&larr; </span><span>Previous file</span>
          <strong>{previous.title}</strong>
        </Link>
      ) : null}
      {next ? (
        <Link data-direction="next" href={next.href} rel="next">
          <span>Next file</span><span aria-hidden="true"> &rarr;</span>
          <strong>{next.title}</strong>
        </Link>
      ) : null}
    </nav>
  );
}
