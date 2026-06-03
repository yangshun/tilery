/**
 * DOM id helpers for Tilery panel elements.
 *
 * Provides a stable, URI-safe mapping between panel IDs and their
 * corresponding HTML element IDs.
 */

/**
 * Returns the `id` attribute value for the root DOM element of the given
 * panel, used to locate the element without traversing the React tree.
 */
export function tileryPanelDomId(panelId: string): string {
  return `tilery-panel-${encodeURIComponent(panelId)}`;
}
