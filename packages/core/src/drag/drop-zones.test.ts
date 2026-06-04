import { describe, expect, it } from 'vite-plus/test';
import {
  tileryEdgeZoneAt,
  tileryTabBarDropAt,
  tileryZoneAt,
} from './drop-zones';

const rect = { left: 0, top: 0, width: 100, height: 100 };

describe('tileryZoneAt', () => {
  it('returns null when the cursor is outside the rect', () => {
    expect(tileryZoneAt(rect, -1, 10)).toBeNull();
    expect(tileryZoneAt(rect, 101, 10)).toBeNull();
    expect(tileryZoneAt(rect, 10, -1)).toBeNull();
    expect(tileryZoneAt(rect, 10, 101)).toBeNull();
  });
  it('returns center for the middle of the rect', () => {
    expect(tileryZoneAt(rect, 50, 50)).toBe('center');
  });
  it('returns the side zones for cursor on each edge mid-line', () => {
    expect(tileryZoneAt(rect, 10, 50)).toBe('left');
    expect(tileryZoneAt(rect, 90, 50)).toBe('right');
    expect(tileryZoneAt(rect, 50, 10)).toBe('top');
    expect(tileryZoneAt(rect, 50, 90)).toBe('bottom');
  });
  it('returns top when in the left-edge zone but near the top corner', () => {
    expect(tileryZoneAt(rect, 5, 1)).toBe('top');
  });
  it('returns bottom when in the left-edge zone but near the bottom corner', () => {
    expect(tileryZoneAt(rect, 5, 99)).toBe('bottom');
  });
  it('returns top when in the right-edge zone but near the top corner', () => {
    expect(tileryZoneAt(rect, 95, 1)).toBe('top');
  });
  it('returns bottom when in the right-edge zone but near the bottom corner', () => {
    expect(tileryZoneAt(rect, 95, 99)).toBe('bottom');
  });
  it('honors a custom edgeFraction', () => {
    // With edgeFraction = 0.1, the center band is wider
    expect(tileryZoneAt(rect, 5, 50, 0.1)).toBe('left');
    expect(tileryZoneAt(rect, 30, 50, 0.1)).toBe('center');
    expect(tileryZoneAt(rect, 70, 50, 0.1)).toBe('center');
    expect(tileryZoneAt(rect, 95, 50, 0.1)).toBe('right');
  });
});

describe('tileryEdgeZoneAt', () => {
  it('returns only a narrow edge zone and no center zone', () => {
    expect(tileryEdgeZoneAt(rect, 50, 50, 16)).toBeNull();
    expect(tileryEdgeZoneAt(rect, 50, 8, 16)).toBe('top');
    expect(tileryEdgeZoneAt(rect, 50, 92, 16)).toBe('bottom');
    expect(tileryEdgeZoneAt(rect, 8, 50, 16)).toBe('left');
    expect(tileryEdgeZoneAt(rect, 92, 50, 16)).toBe('right');
  });

  it('returns null outside the rect', () => {
    expect(tileryEdgeZoneAt(rect, -1, 50)).toBeNull();
    expect(tileryEdgeZoneAt(rect, 101, 50)).toBeNull();
    expect(tileryEdgeZoneAt(rect, 50, -1)).toBeNull();
    expect(tileryEdgeZoneAt(rect, 50, 101)).toBeNull();
  });
});

describe('tileryTabBarDropAt', () => {
  it('returns append for an empty tab bar', () => {
    expect(tileryTabBarDropAt([], 50)).toEqual({ kind: 'append' });
  });
  it('returns before when cursor is in the left half of a tab', () => {
    const rects = [{ tabId: 'a', left: 0, right: 100 }];
    expect(tileryTabBarDropAt(rects, 25)).toEqual({
      kind: 'before',
      tabId: 'a',
    });
  });
  it('returns after when cursor is in the right half of a tab', () => {
    const rects = [{ tabId: 'a', left: 0, right: 100 }];
    expect(tileryTabBarDropAt(rects, 75)).toEqual({
      kind: 'after',
      tabId: 'a',
    });
  });
  it('returns append when cursor is past the last tab', () => {
    const rects = [{ tabId: 'a', left: 0, right: 100 }];
    expect(tileryTabBarDropAt(rects, 200)).toEqual({ kind: 'append' });
  });
  it('skips tabs before the cursor when computing hit', () => {
    const rects = [
      { tabId: 'a', left: 0, right: 50 },
      { tabId: 'b', left: 50, right: 100 },
    ];
    expect(tileryTabBarDropAt(rects, 60)).toEqual({
      kind: 'before',
      tabId: 'b',
    });
    expect(tileryTabBarDropAt(rects, 80)).toEqual({
      kind: 'after',
      tabId: 'b',
    });
  });
  it('continues past gaps before the cursor reaches a tab', () => {
    const rects = [
      { tabId: 'a', left: 0, right: 50 },
      { tabId: 'b', left: 80, right: 120 },
    ];
    expect(tileryTabBarDropAt(rects, 70)).toEqual({ kind: 'append' });
  });
});
