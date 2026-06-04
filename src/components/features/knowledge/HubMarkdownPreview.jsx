import { cn } from "@/lib/utils";

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*.*?\*\*|_.*?_)/g).map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={j}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
  return parts;
}

function renderMarkdownTableRow(line, key, isHeader = false) {
  const cells = line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

  if (isHeader) {
    return (
      <tr key={key}>
        {cells.map((cell, i) => (
          <th
            key={i}
            className="border border-border bg-muted/50 px-2 py-1.5 text-left text-xs font-semibold"
          >
            {renderInlineMarkdown(cell)}
          </th>
        ))}
      </tr>
    );
  }

  return (
    <tr key={key}>
      {cells.map((cell, i) => (
        <td key={i} className="border border-border px-2 py-1.5 text-xs">
          {renderInlineMarkdown(cell)}
        </td>
      ))}
    </tr>
  );
}

/**
 * Lightweight markdown renderer for extracted hub document previews.
 */
export function HubMarkdownPreview({ content, className }) {
  const lines = (content ?? "").split("\n");
  const nodes = [];
  let tableLines = [];
  let i = 0;

  const flushTable = () => {
    if (tableLines.length < 2) {
      tableLines.forEach((line, idx) => {
        nodes.push(
          <p key={`table-fallback-${i}-${idx}`} className="text-sm leading-relaxed text-foreground">
            {renderInlineMarkdown(line)}
          </p>,
        );
      });
    } else {
      const [headerLine, , ...bodyLines] = tableLines;
      nodes.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-sm">
            <thead>{renderMarkdownTableRow(headerLine, "head", true)}</thead>
            <tbody>
              {bodyLines.map((line, idx) => renderMarkdownTableRow(line, idx))}
            </tbody>
          </table>
        </div>,
      );
    }
    tableLines = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("|")) {
      if (/^\|\s*[-:]+/.test(line.trim())) {
        tableLines.push(line);
        continue;
      }
      tableLines.push(line);
      continue;
    }

    if (tableLines.length > 0) {
      flushTable();
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="mt-3 text-sm font-semibold text-foreground">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={i} className="mt-4 text-base font-semibold text-foreground">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={i} className="mt-2 text-lg font-semibold text-foreground">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={i}
          className="my-2 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground"
        >
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <li key={i} className="ml-4 list-disc text-sm leading-relaxed text-foreground">
          {renderInlineMarkdown(line.slice(2))}
        </li>,
      );
    } else if (!line.trim()) {
      nodes.push(<div key={i} className="h-2" aria-hidden />);
    } else {
      nodes.push(
        <p key={i} className="text-sm leading-relaxed text-foreground">
          {renderInlineMarkdown(line)}
        </p>,
      );
    }
    i += 1;
  }

  if (tableLines.length > 0) {
    flushTable();
  }

  return (
    <article className={cn("mx-auto max-w-3xl space-y-1", className)}>
      {nodes}
    </article>
  );
}
