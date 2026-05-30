if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tiltX: number;
    readonly tiltY: number;

    constructor(
      type: string,
      init: PointerEventInit & Record<string, unknown> = {},
    ) {
      super(type, init);
      this.pointerId = (init.pointerId as number) ?? 0;
      this.pointerType = (init.pointerType as string) ?? '';
      this.isPrimary = (init.isPrimary as boolean) ?? false;
      this.width = (init.width as number) ?? 1;
      this.height = (init.height as number) ?? 1;
      this.pressure = (init.pressure as number) ?? 0;
      this.tiltX = (init.tiltX as number) ?? 0;
      this.tiltY = (init.tiltY as number) ?? 0;
    }
  }
  globalThis.PointerEvent =
    PointerEvent as unknown as typeof globalThis.PointerEvent;
}

if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = function () {};
  Element.prototype.releasePointerCapture = function () {};
}
