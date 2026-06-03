// `internal.ts` is the adapter-facing entry point. It re-exports the ENTIRE
// public type surface plus the implementation functions (below) and impl-only
// types (dividers, junctions, …) that end users don't need. `index.ts` is the
// curated public type surface. Using `export type *` keeps the adapter's view of
// the public types drift-free instead of hand-maintaining a subset here.
export type * from './types';

export {
  tileryCreateInitialState,
  tileryReducer,
  tileryNextId,
  type TileryReducerAction,
} from './state/reducer';

export {
  makeTileryController,
  type TileryDispatch,
  type TileryGetSizeContext,
  type TileryGetState,
  type TileryControllerOptions,
} from './state/controller';

export {
  tileryCanMoveTabBetweenPanels,
  tileryCanSwapPanels,
  tileryPanelBehaviorFromState,
} from './state/layout-behavior';

export {
  tileryClampEdgePanelSize,
  tileryEdgePanelIdBySide,
  tileryEdgePanelOrderFromState,
  tileryEdgePanelSizes,
} from './state/edges';

export {
  tileryAllPanelOrderFromState,
  tileryBuildLayoutTreeFromPanels,
  tileryFloatingPanelOrderFromState,
  tileryPanelOrderFromState,
  tilerySplitRootInLayout,
  tilerySyncLayoutPanels,
} from './state/layout-tree';

export {
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
  tileryGetFullScreenPanelId,
  tileryRectEdgePercent,
} from './state/layout-math';

export {
  tileryWarnForConstraintDiagnostics,
  type TileryConstraintDiagnosticsOptions,
  type TileryConstraintWarning,
} from './state/diagnostics';

export {
  tileryNormalizePopoutWindowBounds,
  tileryPopoutWindowFeatureString,
  tileryResizeFloatingBounds,
} from './state/floating';

export {
  tileryCommitDrag,
  tileryAdjacencySide,
  tileryClassifyByZoneAndSide,
  tileryRootSplitSizeForDrag,
  type TileryDragState,
} from './drag/drag-logic';

export {
  tileryEdgeZoneAt,
  tileryZoneAt,
  tileryTabBarDropAt,
  type TileryPanelZone,
} from './drag/drop-zones';
