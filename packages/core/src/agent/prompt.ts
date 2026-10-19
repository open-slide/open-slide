import { UNTITLED_SLIDE_ID_RE } from '../editing/placeholder-id.ts';
import type { AgentTurnContext } from './types.ts';

const PAGE_BY_PAGE =
  'Write a new deck page by page so the user can follow along on the canvas: first replace the file with the imports, meta, design and the cover page only, then add each remaining page with its own separate edit, keeping the file compiling after every write.';

const DECK_SLUG =
  "This deck's folder still has a placeholder name. Never rename or move the folder yourself: once the deck has content, end your final reply with a slug for it on a line of its own as <deck-slug>short-kebab-case-english-slug</deck-slug>, and open-slide renames the folder from it.";

export const SYSTEM_PROMPT_APPEND = [
  'You are running inside the open-slide dev server, driven from its in-app agent panel in the browser rather than a terminal.',
  'The workspace is an open-slide project: decks live under slides/<id>/index.tsx and the dev server hot-reloads every edit, so the user sees changes immediately.',
  'Use the project skills: create-slide to draft a new deck, apply-comments to resolve @slide-comment markers left by the inspector, create-theme for themes, and slide-authoring as the technical reference before writing a page.',
  PAGE_BY_PAGE,
  'Keep replies short and concrete: the panel is narrow. Prefer doing the work over describing it, and finish with a one-line summary of what changed.',
].join(' ');

export function buildTurnPrompt(text: string, context: AgentTurnContext | undefined): string {
  const lines = contextLines(context);
  if (lines.length === 0) return text;
  return `${text}\n\n<open-slide-context>\n${lines.join('\n')}\n</open-slide-context>`;
}

// Slide titles and selected text come from deck content, so they sit in their
// own tags with `<` escaped and can't close the context block.
const escapeTag = (s: string) => s.replace(/</g, '&lt;');

function contextLines(context: AgentTurnContext | undefined): string[] {
  if (!context?.slideId) return [];
  const file = `slides/${context.slideId}/index.tsx`;
  const lines: string[] = [];
  if (context.newDeck) {
    lines.push(
      `${file} is a blank deck created for this request. Draft the deck the user describes into it with the create-slide skill: replace the placeholder page, keep the slide id, and do not create another folder.`,
      'Ask the create-slide scoping questions in a single AskUserQuestion call only for what the request leaves unclear; skip any it already answers.',
      PAGE_BY_PAGE,
      DECK_SLUG,
    );
    return lines;
  }
  lines.push(`The user is viewing slide "${context.slideId}": ${file}.`);
  if (UNTITLED_SLIDE_ID_RE.test(context.slideId)) lines.push(DECK_SLUG);
  if (context.slideTitle) {
    lines.push(`<slide-title>${escapeTag(context.slideTitle)}</slide-title>`);
  }
  if (context.pageNumber && context.totalPages) {
    lines.push(
      `They are on page ${context.pageNumber} of ${context.totalPages} (0-based index ${context.pageNumber - 1} in the default export array).`,
    );
  }
  if (context.selection) {
    const { line, column, tagName, text } = context.selection;
    lines.push(
      `They have selected a <${escapeTag(tagName)}> element at ${file}:${line}:${column}.${text ? ' Its text is in <selected-text>.' : ''} "This element" refers to it.`,
    );
    if (text) lines.push(`<selected-text>${escapeTag(text)}</selected-text>`);
  }
  if (context.pendingComments) {
    lines.push(
      `There are ${context.pendingComments} pending @slide-comment markers in this slide's source.`,
    );
  }
  return lines;
}

const DECK_SLUG_RE = /\s*<deck-slug>\s*([^<]*?)\s*<\/deck-slug>\s*/gi;

export function extractDeckSlug(text: string): string | null {
  let slug: string | null = null;
  for (const match of text.matchAll(DECK_SLUG_RE)) slug = match[1] || slug;
  return slug;
}

// Also drops a tag that is still streaming in, so the marker never flashes
// in the transcript.
export function stripDeckSlug(text: string): string {
  return text
    .replace(DECK_SLUG_RE, '\n')
    .replace(/\s*<deck-slug>[^<]*$/i, '')
    .trimEnd();
}

export function applyCommentsPrompt(slideId: string): string {
  return `Use the apply-comments skill to apply every pending @slide-comment marker in slides/${slideId}/index.tsx, then remove the markers.`;
}
