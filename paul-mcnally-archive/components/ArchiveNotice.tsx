type ArchiveNoticeProps = {
  publication: string;
  date: string;
  updatedDate?: string;
  sourceUrl?: string;
  pro?: boolean;
};

function archiveDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return value && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(date)
    : "[original publication date]";
}

export function ArchiveNotice({ publication, date, updatedDate, sourceUrl, pro = false }: ArchiveNoticeProps) {
  return <div className={`archive-notice${pro ? " archive-notice-pro" : ""}`}>
    <p className="archive-notice-title">Permanent archive copy</p>
    <p className="archive-notice-copy">Originally published by {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">{publication || "[publication]"}</a> : publication || "[publication]"} on {archiveDate(date)}{updatedDate ? ` and updated on ${archiveDate(updatedDate)}` : ""}. Preserved here by the author for long-term access.</p>
  </div>;
}
