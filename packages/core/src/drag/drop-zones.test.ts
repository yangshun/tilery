import { describe, expect, it } from 'vite-plus/test';
import { tabBarDropAt, zoneAt, zoneToSplitInset } from './drop-zones';

const rect = { left: 0, top: 0, width: 100, height: 100 };

describe('zoneAt', () => {
  it('returns null when the cursor is outside the rect', () => {
    expect(zoneAt(rect, -1, 10)).toBeNull();
    expect(zoneAt(rect, 101, 10)).toBeNull();
    expect(zoneAt(rect, 10, -1)).toBeNull();
    expect(zoneAt(rect, 10, 101)).toBeNull();
  });
  it('returns center for the middle of the rect', () => {
    expect(zoneAt(rect, 50, 50)).toBe('center');
  });
  it('returns the side zones for cursor on each edge mid-line', () => {
    expect(zoneAt(rect, 10, 50)).toBe('left');
    expect(zoneAt(rect, 90, 50)).toBe('right');
    expect(zoneAt(rect, 50, 10)).toBe('top');
    expect(zoneAt(rect, 50, 90)).toBe('bottom');
  });
  it('returns top when in the left-edge zone but near the top corner', () => {
    expect(zoneAt(rect, 5, 1)).toBe('top');
  });
  it('returns bottom when in the left-edge zone but near the bottom corner', () => {
    expect(zoneAt(rect, 5, 99)).toBe('bottom');
  });
  it('returns top when in the right-edge zone but near the top corner', () => {
    expect(zoneAt(rect, 95, 1)).toBe('top');
  });
  it('returns bottom when in the right-edge zone but near the bottom corner', () => {
    expect(zoneAt(rect, 95, 99)).toBe('bottom');
  });
  it('honors a custom edgeFraction', () => {
    // With edgeFraction = 0.1, the center band is wider
    expect(zoneAt(rect, 5, 50, 0.1)).toBe('left');
    expect(zoneAt(rect, 30, 50, 0.1)).toBe('center');
    expect(zoneAt(rect, 70, 50, 0.1)).toBe('center');
    expect(zoneAt(rect, 95, 50, 0.1)).toBe('right');
  });
});

describe('tabBarDropAt', () => {
  it('returns append for an empty tab bar', () => {
    expect(tabBarDropAt([], 50)).toEqual({ kind: 'append' });
  });
  it('returns before when cursor is in the left half of a tab', () => {
    const rects = [{ tabId: 'a', left: 0, right: 100 }];
    expect(tabBarDropAt(rects, 25)).toEqual({ kind: 'before', tabId: 'a' });
  });
  it('returns after when cursor is in the right half of a tab', () => {
    const rects = [{ tabId: 'a', left: 0, right: 100 }];
    expect(tabBarDropAt(rects, 75)).toEqual({ kind: 'after', tabId: 'a' });
  });
  it('returns append when cursor is past the last tab', () => {
    const rects = [{ tabId: 'a', left: 0, right: 100 }];
    expect(tabBarDropAt(rects, 200)).toEqual({ kind: 'append' });
  });
  it('skips tabs before the cursor when computing hit', () => {
    const rects = [
      { tabId: 'a', left: 0, right: 50 },
      { tabId: 'b', left: 50, right: 100 },
    ];
    expect(tabBarDropAt(rects, 60)).toEqual({ kind: 'before', tabId: 'b' });
    expect(tabBarDropAt(rects, 80)).toEqual({ kind: 'after', tabId: 'b' });
  });
  it('continues past gaps before the cursor reaches a tab', () => {
    const rects = [
      { tabId: 'a', left: 0, right: 50 },
      { tabId: 'b', left: 80, right: 120 },
    ];
    expect(tabBarDropAt(rects, 70)).toEqual({ kind: 'append' });
  });
});

describe('zoneToSplitInset', () => {
  const panel = { left: 100, top: 200, width: 400, height: 300 };
  it('returns the left half for left zone', () => {
    expect(zoneToSplitInset('left', panel)).toEqual({
      left: 100,
      top: 200,
      width: 200,
      height: 300,
    });
  });
  it('returns the right half for right zone', () => {
    expect(zoneToSplitInset('right', panel)).toEqual({
      left: 300,
      top: 200,
      width: 200,
      height: 300,
    });
  });
  it('returns the top half for top zone', () => {
    expect(zoneToSplitInset('top', panel)).toEqual({
      left: 100,
      top: 200,
      width: 400,
      height: 150,
    });
  });
  it('returns the bottom half for bottom zone', () => {
    expect(zoneToSplitInset('bottom', panel)).toEqual({
      left: 100,
      top: 350,
      width: 400,
      height: 150,
    });
  });
});
