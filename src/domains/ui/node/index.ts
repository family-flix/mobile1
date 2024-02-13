import { BaseDomain } from "@/domains/base";
import { RefCore } from "@/domains/cur";
import { Handler } from "mitt";

enum Events {
  Click,
  ContextMenu,
  LongPress,
  StateChange,
}
type TheTypesOfEvents<T = unknown> = {
  [Events.Click]: T | null;
  [Events.LongPress]: T | null;
  [Events.StateChange]: NodeState;
};
type NodeState = {
  loading: boolean;
  disabled: boolean;
};
type NodeProps<T = unknown> = {
  onClick: (record: T | null) => void;
  onLongPress: (record: T | null) => void;
};
export class NodeCore<T = unknown> extends BaseDomain<TheTypesOfEvents<T>> {
  id = this.uid();
  cur: RefCore<T>;
  longPressTimer: null | NodeJS.Timeout = null;

  state: NodeState = {
    loading: false,
    disabled: false,
  };
  pressTime = 0;

  constructor(options: Partial<{ _name: string } & NodeProps<T>> = {}) {
    super(options);

    this.cur = new RefCore();
    const { onClick, onLongPress } = options;
    if (onClick) {
      this.onClick(() => {
        onClick(this.cur.value);
      });
    }
    if (onLongPress) {
      this.onLongPress(() => {
        onLongPress(this.cur.value);
      });
    }
  }

  clearLongPressTimer() {
    if (!this.longPressTimer) {
      return;
    }
    clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
  }
  handleMouseDown = () => {
    this.pressTime = new Date().valueOf();
    // console.log("[DOMAIN]ui/node/index - handleMouseDown");
    // this.longPressTimer = setTimeout(() => {
    //   console.log("[DOMAIN]ui/node/index - bingo", this);
    //   this.emit(Events.LongPress);
    // }, 1000);
  };
  handleMouseUp(options: { type: string; stopPropagation: () => void }) {
    const now = new Date().valueOf();
    const prev = this.pressTime;
    this.pressTime = 0;
    // console.log("[DOMAIN]ui/node/index - handleMouseUp", options.type, now - prev);
    if (options.stopPropagation) {
      options.stopPropagation();
    }
    if (now - prev >= 1200) {
      this.emit(Events.LongPress);
      return;
    }
    this.emit(Events.Click);
    // this.clearLongPressTimer();
  }
  handleMouseOut() {
    // console.log("[DOMAIN]ui/node/index - handleMouseOut");
    this.clearLongPressTimer();
  }
  handleClick() {
    // console.log("[DOMAIN]ui/node/index - handleClick");
    this.click();
  }
  handleMounted() {}

  setStyles(value: unknown) {
    console.log("please implements this function in connect.web.ts");
  }

  /** 触发一次按钮点击事件 */
  click() {
    // console.log("click", this.state.loading, this.state.disabled);
    if (this.state.loading) {
      return;
    }
    if (this.state.disabled) {
      return;
    }
    this.emit(Events.Click);
  }
  /** 禁用当前按钮 */
  disable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 恢复按钮可用 */
  enable() {
    this.state.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 当按钮处于列表中时，使用该方法保存所在列表记录 */
  bind(v: T) {
    this.cur.select(v);
    return this;
  }
  setLoading(loading: boolean) {
    if (this.state.loading === loading) {
      return;
    }
    this.state.loading = loading;
    this.emit(Events.StateChange, { ...this.state });
  }

  onClick(handler: Handler<TheTypesOfEvents<T>[Events.Click]>) {
    return this.on(Events.Click, handler);
  }
  onLongPress(handler: Handler<TheTypesOfEvents<T>[Events.LongPress]>) {
    return this.on(Events.LongPress, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

export class NodeInListCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  /** 列表中一类多个按钮 */
  btns: NodeCore<T>[] = [];
  /** 按钮点击后，该值被设置为触发点击的那个按钮 */
  cur: NodeCore<T> | null = null;

  constructor(options: Partial<{ _name: string } & NodeProps<T>> = {}) {
    super(options);

    const { onClick, onLongPress } = options;
    if (onClick) {
      this.onClick(onClick);
    }
    if (onLongPress) {
      this.onLongPress(onLongPress);
    }
  }

  /** 当按钮处于列表中时，使用该方法保存所在列表记录 */
  bind(v: T) {
    const existing = this.btns.find((btn) => {
      return btn.cur.value === v;
    });
    if (existing) {
      return existing;
    }
    const btn = new NodeCore<T>({
      onClick: (record) => {
        this.cur = btn;
        this.emit(Events.Click, record);
      },
      onLongPress: (record) => {
        this.cur = btn;
        this.emit(Events.LongPress, record);
      },
    });
    btn.bind(v);
    this.btns.push(btn);
    return btn;
  }
  /** 清空触发点击事件时保存的按钮 */
  clear() {
    this.cur = null;
  }
  setLoading(loading: boolean) {
    // console.log("set loading", loading, this.cur);
    if (this.cur === null) {
      for (let i = 0; i < this.btns.length; i += 1) {
        const btn = this.btns[i];
        btn.setLoading(loading);
      }
      return;
    }
    this.cur.setLoading(loading);
  }

  onClick(handler: Handler<TheTypesOfEvents<T>[Events.Click]>) {
    return this.on(Events.Click, handler);
  }
  onLongPress(handler: Handler<TheTypesOfEvents<T>[Events.LongPress]>) {
    return this.on(Events.LongPress, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
