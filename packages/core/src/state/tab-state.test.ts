import { describe, expect, it } from 'vite-plus/test';
import {
  tileryNextActiveTabAfterRemoval,
  tileryReducerTabActionToState,
} from './tab-state';

describe('tab state helpers', () => {
  it('normalizes reducer tab actions to explicit tab state behavior', () => {
    expect(
      tileryReducerTabActionToState({ id: 'tab', data: { title: 'Tab' } }, 'p'),
    ).toEqual({
      id: 'tab',
      panelId: 'p',
      data: { title: 'Tab' },
      closable: true,
      draggable: true,
    });
    expect(
      tileryReducerTabActionToState(
        {
          id: 'locked-tab',
          data: null,
          closable: false,
          draggable: false,
        },
        'p',
      ),
    ).toEqual({
      id: 'locked-tab',
      panelId: 'p',
      data: null,
      closable: false,
      draggable: false,
    });
  });

  it('keeps the current active tab when removing an inactive tab', () => {
    expect(
      tileryNextActiveTabAfterRemoval(['a', 'b', 'c'], 'b', ['a', 'c'], 'a'),
    ).toBe('a');
  });

  it('selects the next tab when removing the active tab', () => {
    expect(
      tileryNextActiveTabAfterRemoval(['a', 'b', 'c'], 'b', ['a', 'c'], 'b'),
    ).toBe('c');
    expect(tileryNextActiveTabAfterRemoval(['a', 'b'], 'b', ['a'], 'b')).toBe(
      'a',
    );
  });

  it('clears the active tab when no tabs remain', () => {
    expect(tileryNextActiveTabAfterRemoval(['a'], 'a', [], 'a')).toBeNull();
  });
});
