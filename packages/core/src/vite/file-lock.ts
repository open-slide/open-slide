const tails = new Map<string, Promise<unknown>>();

// Runs read/modify/write tasks on one file one at a time, so parallel requests
// can't each read the same source and overwrite each other's edit.
export function withFileLock<T>(file: string, task: () => Promise<T>): Promise<T> {
  const result = (tails.get(file) ?? Promise.resolve()).then(task);
  const tail = result.catch(() => {});
  tails.set(file, tail);
  void tail.then(() => {
    if (tails.get(file) === tail) tails.delete(file);
  });
  return result;
}
