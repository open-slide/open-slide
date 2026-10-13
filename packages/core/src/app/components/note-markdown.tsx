import { Fragment, type ReactNode, useMemo } from 'react';
import { type NoteBlock, type NoteInline, parseNoteMarkdown } from '@/lib/note-markdown';
import { cn } from '@/lib/utils';

export function renderInline(nodes: NoteInline[]): ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
        return <Fragment key={i}>{node.text}</Fragment>;
      case 'strong':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <strong key={i}>{renderInline(node.children)}</strong>
        );
      case 'em':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <em key={i}>{renderInline(node.children)}</em>
        );
      case 'code':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <code key={i}>{node.text}</code>
        );
      default:
        return node satisfies never;
    }
  });
}

function renderBlocks(blocks: NoteBlock[]): ReactNode {
  return blocks.map(renderBlock);
}

function renderBlock(block: NoteBlock, key: number): ReactNode {
  switch (block.type) {
    case 'heading': {
      // h4–h6 so note headings stay below the app's own UI headings in the
      // presenter window's document outline.
      const Tag = `h${block.level + 3}` as 'h4' | 'h5' | 'h6';
      return <Tag key={key}>{renderInline(block.children)}</Tag>;
    }
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={key} start={block.ordered && block.start !== 1 ? block.start : undefined}>
          {block.items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
            <li key={i}>
              {renderInline(item.content)}
              {renderBlocks(item.children)}
            </li>
          ))}
        </Tag>
      );
    }
    case 'rule':
      return <hr key={key} />;
    case 'paragraph':
      return (
        <p key={key}>
          {block.lines.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
            <Fragment key={i}>
              {i > 0 && <br />}
              {renderInline(line)}
            </Fragment>
          ))}
        </p>
      );
    default:
      return block satisfies never;
  }
}

export function NoteMarkdown({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => parseNoteMarkdown(text), [text]);
  return <div className={cn('md', className)}>{renderBlocks(blocks)}</div>;
}
