import type { AgentTurnContext } from './types.ts';

export const SYSTEM_PROMPT_APPEND = [
  'You are running inside the open-slide dev server, driven from its in-app agent panel in the browser rather than a terminal.',
  'The workspace is an open-slide project: decks live under slides/<id>/index.tsx and the dev server hot-reloads every edit, so the user sees changes immediately.',
  'Use the project skills: create-slide to draft a new deck, apply-comments to resolve @slide-comment markers left by the inspector, create-theme for themes, and slide-authoring as the technical reference before writing a page.',
  'Keep replies short and concrete: the panel is narrow. Prefer doing the work over describing it, and finish with a one-line summary of what changed.',
].join(' ');

export function buildTurnPrompt(text: string, context: AgentTurnContext | undefined): string {
  const lines = contextLines(context);
  if (lines.length === 0) return text;
  return `${text}\n\n<open-slide-context>\n${lines.join('\n')}\n</open-slide-context>`;
}

function contextLines(context: AgentTurnContext | undefined): string[] {
  if (!context?.slideId) return [];
  const lines: string[] = [];
  const title = context.slideTitle ? ` ("${context.slideTitle}")` : '';
  lines.push(
    `The user is viewing slide "${context.slideId}"${title}: slides/${context.slideId}/index.tsx.`,
  );
  if (context.pageNumber && context.totalPages) {
    lines.push(
      `They are on page ${context.pageNumber} of ${context.totalPages} (0-based index ${context.pageNumber - 1} in the default export array).`,
    );
  }
  if (context.selection) {
    const { line, column, tagName, text } = context.selection;
    const snippet = text ? ` with text "${text}"` : '';
    lines.push(
      `They have selected a <${tagName}> element at slides/${context.slideId}/index.tsx:${line}:${column}${snippet}. "This element" refers to it.`,
    );
  }
  if (context.pendingComments) {
    lines.push(
      `There are ${context.pendingComments} pending @slide-comment markers in this slide's source.`,
    );
  }
  return lines;
}

export function createSlidePrompt(brief: string): string {
  const trimmed = brief.trim();
  return trimmed
    ? `Use the create-slide skill to draft a new deck. ${trimmed}`
    : 'Use the create-slide skill to draft a new deck. Ask me the scoping questions first.';
}

export function applyCommentsPrompt(slideId: string): string {
  return `Use the apply-comments skill to apply every pending @slide-comment marker in slides/${slideId}/index.tsx, then remove the markers.`;
}
