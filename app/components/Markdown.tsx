/**
 * Minimal, dependency-free markdown renderer for the n8n `bundle_recommendation`
 * field (Good/Better/Best copy). Supports the small subset the engine emits:
 * headings (#..###), bold (**…**), unordered lists (-, *), and paragraphs.
 *
 * Renders only text nodes — no raw HTML is interpreted, so it's injection-safe.
 */

import { Fragment, type ReactNode } from "react";

/** Inline **bold** → <strong>. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {bold[1]}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="my-2 list-disc space-y-1 pl-5 text-sm text-muted"
      >
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const content = renderInline(heading[2]);
      const cls =
        level === 1
          ? "mt-3 text-lg font-bold text-ink"
          : level === 2
            ? "mt-3 text-base font-semibold text-ink"
            : "mt-2 text-sm font-semibold text-primary";
      blocks.push(
        <p key={`h-${blocks.length}`} className={cls}>
          {content}
        </p>
      );
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-2 text-sm text-muted">
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div className="leading-relaxed">{blocks}</div>;
}
