import { UNTITLED_SLIDE_ID_RE } from '../editing/placeholder-id.ts';
import { parseQuestions } from './provider.ts';
import type { AgentQuestion, AgentTurnContext } from './types.ts';

const PAGE_BY_PAGE =
  'Write a new deck page by page so the user can follow along on the canvas: first replace the file with the imports, meta (keeping its existing createdAt), design and the cover page only, then add each remaining page with its own separate edit, keeping the file compiling after every write.';

const DECK_SLUG =
  "This deck's folder still has a placeholder name. Never rename or move the folder yourself: once the deck has content, end your final reply with a slug for it on a line of its own as <deck-slug>short-kebab-case-english-slug</deck-slug>, and open-slide renames the folder from it.";

export function systemPromptAppend(askInstruction: string): string {
  return [
    'You are running inside the open-slide dev server, driven from its in-app agent panel in the browser rather than a terminal.',
    'The workspace is an open-slide project: decks live under slides/<id>/index.tsx and the dev server hot-reloads every edit, so the user sees changes immediately.',
    'Use the project skills: create-slide to draft a new deck, apply-comments to resolve @slide-comment markers left by the inspector, create-theme for themes, and slide-authoring as the technical reference before writing a page.',
    PAGE_BY_PAGE,
    'Keep replies short and concrete: the panel is narrow. Prefer doing the work over describing it, and finish with a one-line summary of what changed.',
    askInstruction,
  ].join(' ');
}

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
      'Ask the create-slide scoping questions in a single round, only for what the request leaves unclear; skip any it already answers.',
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

const QUESTIONS_RE = /<open-slide-questions>([\s\S]*?)<\/open-slide-questions>/i;

export const TEXT_QUESTIONS_INSTRUCTION =
  'You cannot ask the user anything interactively here, and nothing you print in the middle of a turn can be answered. When you need answers before continuing, stop working and end your turn with a final message holding only an <open-slide-questions> block: a JSON array of at most 4 questions shaped like [{"header":"Pages","question":"How many pages?","multiSelect":false,"options":[{"label":"6-10 (Recommended)","description":"Standard length"}]}], each with 2 to 4 options, written in the user\'s language. The panel shows them as a form and sends the answers back as your next message. Write nothing after the block and do not continue the task in the same turn.';

// Splits a reply written under TEXT_QUESTIONS_INSTRUCTION into its prose and
// questions. Returns null when the reply holds no usable block.
export function extractQuestionBlock(
  text: string,
): { text: string; questions: AgentQuestion[] } | null {
  const match = QUESTIONS_RE.exec(text);
  if (!match) return null;
  const body = match[1]
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return null;
  }
  const questions = parseQuestions({
    questions: Array.isArray(raw) ? raw : (raw as { questions?: unknown } | null)?.questions,
  });
  if (questions.length === 0) return null;
  return { text: text.replace(QUESTIONS_RE, '').trim(), questions };
}

export function answersPrompt(
  questions: AgentQuestion[],
  answers: Record<string, string> | null,
): string {
  if (!answers) {
    return 'I skipped your questions. Continue the task with your best judgement and sensible defaults.';
  }
  const lines = questions.map((q) => `- ${q.question} ${answers[q.question] || '(no answer)'}`);
  return `My answers:\n${lines.join('\n')}\n\nContinue the task with these answers.`;
}

// For agents whose history can't be rewound: the edited message goes on top
// of the old conversation, so the agent is told to set that part aside.
export function editedPrompt(original: string, text: string): string {
  return `I went back and edited an earlier message of mine. Treat everything after it in this conversation, including your replies, as discarded, and respond to the edited version instead. Files keep whatever changes were already made.\n\n<original-message>\n${escapeTag(original)}\n</original-message>\n\n${text}`;
}

// For agents rewound to before the edited message: their history forgets the
// later turns, but the files on disk still hold what those turns wrote.
export function rewoundPrompt(text: string): string {
  return `${text}\n\n<open-slide-note>I went back and edited this message. Files keep the changes made after it in the discarded part of this conversation, so read the current files before editing them.</open-slide-note>`;
}
