import type {
  TileryTabBehavior,
  TileryTabBehaviorConfig,
  TileryTabBehaviorUpdate,
} from '../types';

export const TILERY_DEFAULT_TAB_BEHAVIOR: TileryTabBehavior = {
  closable: true,
  draggable: true,
};

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
