/**
 * Tab behavior normalization — resolves config and updates to concrete
 * closable/draggable flags.
 */
import type {
  TileryTabBehavior,
  TileryTabBehaviorConfig,
  TileryTabBehaviorUpdate,
} from '../types';

/** Default tab behavior applied when no config is provided: both closable and draggable. */
export const TILERY_DEFAULT_TAB_BEHAVIOR: TileryTabBehavior = {
  closable: true,
  draggable: true,
};

/**
 * Converts a `TileryTabBehaviorConfig` into a fully-resolved
 * `TileryTabBehavior`, falling back to `TILERY_DEFAULT_TAB_BEHAVIOR` for
 * unspecified fields. When `config.locked` is `true`, both flags are `false`.
 */
export function tileryNormalizeTabBehavior(
  config: TileryTabBehaviorConfig | undefined,
): TileryTabBehavior {
  if (config?.locked === true) {
    return { closable: false, draggable: false };
  }
  return {
    closable: config?.closable ?? TILERY_DEFAULT_TAB_BEHAVIOR.closable,
    draggable: config?.draggable ?? TILERY_DEFAULT_TAB_BEHAVIOR.draggable,
  };
}

/**
 * Merges a partial `TileryTabBehaviorUpdate` onto the `current` behavior,
 * overriding only the fields that are explicitly set. When `update.locked`
 * is `true`, both flags are set to `false` regardless of `current`.
 */
export function tileryApplyTabBehaviorUpdate(
  current: TileryTabBehavior,
  update: TileryTabBehaviorUpdate,
): TileryTabBehavior {
  if (update.locked === true) {
    return { closable: false, draggable: false };
  }
  return {
    closable: update.closable ?? current.closable,
    draggable: update.draggable ?? current.draggable,
  };
}
