import { BaseDomain } from "@/domains/base";
import { Handler } from "mitt";

enum Events {
  /** 加载到页面中 */
  Mounted,
  /** 从页面卸载 */
  Unmounted,
}
type TheTypesOfEvents = {
  [Events.Mounted]: void;
  [Events.Unmounted]: void;
};
type ElementProps = {
  onMounted?: () => void;
  onUnmounted?: () => void;
};
export class ElementCore extends BaseDomain<TheTypesOfEvents> {
  constructor(options: ElementProps) {
    super();

    const { onMounted, onUnmounted } = options;
    if (onMounted) {
      this.onMounted(onMounted);
    }
    if (onUnmounted) {
      this.onUnmounted(onUnmounted);
    }
  }

  mount() {
    this.emit(Events.Mounted);
  }
  unmount() {
    this.emit(Events.Unmounted);
  }

  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onUnmounted(handler: Handler<TheTypesOfEvents[Events.Unmounted]>) {
    return this.on(Events.Unmounted, handler);
  }
}
