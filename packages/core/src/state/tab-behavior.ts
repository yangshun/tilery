import type { TileryTabBehavior, TileryTabBehaviorConfig } from '../types';

export const TILERY_DEFAULT_TAB_BEHAVIOR: TileryTabBehavior = {
  closeable: true,
  draggable: true,
};

export function tileryNormalizeTabBehavior(
  config: TileryTabBehaviorConfig | undefined,
): TileryTabBehavior {
  if (config?.locked === true) {
    return { closeable: false, draggable: false };
  }
  return {
    closeable: config?.closeable ?? TILERY_DEFAULT_TAB_BEHAVIOR.closeable,
    draggable: config?.draggable ?? TILERY_DEFAULT_TAB_BEHAVIOR.draggable,
  };
}
