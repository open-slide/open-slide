const PRESENTING_KEY = 'open-slide:presenting';

// Per tab, so a reload resumes present mode instead of dropping back to the
// editor and stranding an open presenter window.
export function rememberPresenting(slideId: string | null): void {
  try {
    if (slideId) sessionStorage.setItem(PRESENTING_KEY, slideId);
    else sessionStorage.removeItem(PRESENTING_KEY);
  } catch {
    // sessionStorage can be unavailable (private browsing, quota); a reload
    // then simply returns to the editor.
  }
}

export function wasPresenting(slideId: string): boolean {
  try {
    return sessionStorage.getItem(PRESENTING_KEY) === slideId;
  } catch {
    return false;
  }
}
