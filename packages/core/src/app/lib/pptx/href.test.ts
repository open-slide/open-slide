import { describe, expect, it } from 'vitest';
import { isExportableHyperlink } from './measure';

describe('isExportableHyperlink', () => {
  it('allows http, https, and mailto', () => {
    expect(isExportableHyperlink('https://redmine.acpay.com.tw/issues/4840')).toBe(true);
    expect(isExportableHyperlink('http://example.com/path')).toBe(true);
    expect(isExportableHyperlink('mailto:someone@example.com')).toBe(true);
  });

  it('rejects javascript, data, file, and other schemes', () => {
    expect(isExportableHyperlink('javascript:alert(1)')).toBe(false);
    expect(isExportableHyperlink('data:text/plain,hi')).toBe(false);
    expect(isExportableHyperlink('file:///tmp/secret')).toBe(false);
    expect(isExportableHyperlink('vbscript:MsgBox(1)')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isExportableHyperlink('')).toBe(false);
    expect(isExportableHyperlink('not a url')).toBe(false);
  });
});
