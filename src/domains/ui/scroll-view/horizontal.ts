import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  Scroll,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Scroll]: {
    x: number;
  };
  [Events.StateChange]: HorizontalScrollViewState;
};
type HorizontalScrollViewProps = {
  x?: number;
};
type HorizontalScrollViewState = HorizontalScrollViewProps & {};

export class HorizontalScrollViewCore extends BaseDomain<TheTypesOfEvents> {
  x = 0;

  get state(): HorizontalScrollViewState {
    return {
      x: this.x,
    };
  }

  constructor(options: HorizontalScrollViewProps = {}) {
    super();

    const { x = 0 } = options;
  }

  scrollTo(pos: { left: number }) {
    this.x = pos.left;
    this.emit(Events.Scroll, { x: pos.left });
  }

  onScroll(handler: Handler<TheTypesOfEvents[Events.Scroll]>) {
    return this.on(Events.Scroll, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
