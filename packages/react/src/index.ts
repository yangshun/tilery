/**
 * Public entry point for `@tileryjs/react`: the Tilery component, props,
 * events, and re-exported core types.
 */
export {
  Tilery,
  type TileryNewTabHandler,
  type TileryPanelActionsRenderContext,
  type TileryPanelVisibility,
  type TileryProps,
  type TileryResizeDimension,
  type TileryResizeEvent,
  type TileryResizeInput,
  type TileryResizePanelChange,
  type TileryResizePhase,
  type TileryResizeSource,
  type TileryTabTriggerProps,
  type TileryTabTriggerRenderContext,
  type TileryTabTriggerRenderer,
} from './tilery';

export type {
  TileryActiveTabChange,
  TileryActiveTabChangeEvent,
  TileryLifecycleSource,
  TileryPanelLifecycleChange,
  TileryPanelSplitEvent,
  TileryPanelsCloseEvent,
  TileryPanelsOpenEvent,
  TileryTabLifecycleChange,
  TileryTabMoveChange,
  TileryTabsCloseEvent,
  TileryTabsMoveEvent,
  TileryTabsOpenEvent,
} from './lifecycle';

// Re-export every public type from the core package. Using `export type *`
// (rather than a hand-maintained list) keeps the adapter's type surface in
// lockstep with core and avoids drift — e.g. previously TileryRootSplitMoveTarget
// existed in core but was missing here.
export type * from 'tilery';
