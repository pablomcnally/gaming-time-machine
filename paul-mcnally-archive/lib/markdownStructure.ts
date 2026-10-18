// Keep headings separate from the following copy, including older saved drafts.
// Fenced examples must retain their original spacing and heading-like text.
export function normalizeMarkdownStructure(content: string) {
  const lines: string[] = [];
  let fence: { character: string; length: number } | undefined;
  let afterHeading = false;
  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (afterHeading && line.trim()) lines.push("");
    afterHeading = false;
    if (fence) {
      lines.push(line);
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker) {
      fence = { character: marker[1][0], length: marker[1].length };
      lines.push(line);
      continue;
    }
    const heading = line.match(/^ {0,3}(#{2,3})[\t ]+(.+?)[\t ]*$/);
    if (heading) {
      if (lines.length && lines[lines.length - 1].trim()) lines.push("");
      lines.push(`${heading[1]} ${heading[2]}`);
      afterHeading = true;
    } else {
      lines.push(line);
    }
  }
  return lines.join("\n");
}
