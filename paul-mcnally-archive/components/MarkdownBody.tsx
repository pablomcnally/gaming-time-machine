function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function MarkdownBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="prose-terminal max-w-none">
      {blocks.map((block) => {
        if (block.startsWith("## ")) {
          return <h2 key={block}>{block.replace("## ", "")}</h2>;
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

        return <p key={block}>{renderInline(block)}</p>;
      })}
    </div>
  );
}
