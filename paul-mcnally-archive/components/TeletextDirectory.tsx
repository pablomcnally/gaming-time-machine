import Link from "next/link";

type DirectoryEntry = {
  number: string;
  href: string;
  title: string;
};

type TeletextDirectoryProps = {
  id: string;
  indexCode: string;
  label: string;
  entries: DirectoryEntry[];
};

export function TeletextDirectory({ id, indexCode, label, entries }: TeletextDirectoryProps) {
  return (
    <section className="teletext-directory" aria-labelledby={id}>
      <div className="teletext-directory-header">
        <h2 id={id}>Pablonet {label} Directory</h2>
        <span aria-label={`Index page ${indexCode}`}>P{indexCode}</span>
      </div>
      <ol className="teletext-directory-list">
        {entries.map(({ number, href, title }) => (
          <li key={href}>
            <Link href={href} aria-label={`Page ${number}: ${title}`}>
              <span className="teletext-directory-title">{title}</span>
              <span className="teletext-directory-code" aria-hidden="true">{number}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="teletext-directory-hint">Select a story or enter its three-digit page number</p>
    </section>
  );
}
