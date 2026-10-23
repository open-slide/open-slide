import { createHash } from 'node:crypto';
import path from 'node:path';

export function projectKey(root: string): string {
  return createHash('sha256').update(path.resolve(root)).digest('hex').slice(0, 12);
}
