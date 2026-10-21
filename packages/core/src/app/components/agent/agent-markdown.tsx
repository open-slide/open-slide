import { useMemo } from 'react';
import { NoteMarkdown } from '@/components/note-markdown';

type Segment = { type: 'text'; text: string } | { type: 'code'; code: string };

const FENCE = /^```[^\n]*\n([\s\S]*?)\n?```\s*$/m;

function splitFences(text: string): Segment[] {
  const segments: Segment[] = [];
  let rest = text;
  while (rest) {
    const m = FENCE.exec(rest);
    if (!m) {
      segments.push({ type: 'text', text: rest });
      break;
    }
    const before = rest.slice(0, m.index);
    if (before.trim()) segments.push({ type: 'text', text: before });
    segments.push({ type: 'code', code: m[1] });
    rest = rest.slice(m.index + m[0].length);
  }
  return segments;
}

export function AgentMarkdown({ text }: { text: string }) {
  const segments = useMemo(() => splitFences(text), [text]);
  return (
    <div className="space-y-2 text-[12.5px] leading-[1.55] [&_ol]:my-1 [&_ul]:my-1">
      {segments.map((segment, i) =>
        segment.type === 'code' ? (
          <pre
            // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
            key={i}
            className="overflow-x-auto rounded-[6px] border border-hairline bg-muted/60 px-2.5 py-2 font-mono text-[11px] leading-relaxed"
          >
            <code>{segment.code}</code>
          </pre>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <NoteMarkdown key={i} text={segment.text} />
        ),
      )}
    </div>
  );
}
