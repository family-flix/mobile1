import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
  Scroll,
  LinePositionChange,
  Mounted,
  Change,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: TabHeaderState<T>;
  [Events.Scroll]: { left: number };
  [Events.LinePositionChange]: { left: number };
  [Events.Mounted]: void;
  [Events.Change]: { index: number };
};
type TabHeaderState<T> = {
  tabs: T[];
  current: number;
  left: number | null;
  curId: string | null;
};
type TabHeaderProps<T extends { id: string; text: string }> = {
  key?: string;
  options: T[];
  targetLeftWhenSelected?: number;
  onChange?: (value: { index: number }) => void;
  onMounted?: () => void;
};

export class TabHeaderCore<T extends { id: string; text: string }> extends BaseDomain<TheTypesOfEvents<T>> {
  key = "id";
  options: T[] = [];
  count = 0;
  extra: Record<
    string,
    {
      width: number;
      height: number;
      left: number;
    }
  > = {};
  current: number = 0;
  left: number | null = null;
  /** 父容器宽高等信息 */
  container = {
    width: 0,
    left: 0,
    scrollLeft: 0,
  };
  /** 当 checkbox 选中时，希望它距离父容器 left 距离。如小于 1，则视为百分比，如 0.5 即中间位置 */
  targetLeftWhenSelected: null | number = null;

  get selectedTabId() {
    const matched = this.options[this.current];
    if (!matched) {
      if (this.options.length) {
        return this.options[0].id;
      }
      return null;
    }
    return matched.id ?? null;
  }
  get selectedTab() {
    return this.options[this.current];
  }
  get state(): TabHeaderState<T> {
    return {
      tabs: this.options,
      curId: this.selectedTabId,
      current: this.current,
      left: this.targetLeftWhenSelected,
    };
  }

  /**
   * @param {{targetLeftWhenSelected: number}} props
   */
  constructor(props: Partial<{ _name: string }> & TabHeaderProps<T>) {
    super(props);

    const { key = "id", options, targetLeftWhenSelected = 0, onChange, onMounted } = props;
    this.key = key;
    this.targetLeftWhenSelected = targetLeftWhenSelected;
    this.setOptions(options);
    if (onChange) {
      this.onChange(onChange);
    }
    if (onMounted) {
      this.onMounted(onMounted);
    }
  }
  setOptions(options: T[]) {
    if (options.length === 0) {
      return;
    }
    this.options = options;
    for (let i = 0; i < options.length; i += 1) {
      const { id } = options[i];
      this.extra[id] = {
        left: 0,
        width: 0,
        height: 0,
      };
    }
  }
  select(index: number) {
    this.current = index;
    const matchedTab = this.options[index];
    if (!matchedTab) {
      return;
    }
    const left = this.calcLineLeft(this.current);
    console.log("[DOMAIN]tab-header - select", index, left);
    if (left !== null) {
      this.left = left;
      this.changeLinePosition(left);
      this.emit(Events.Change, { index });
    }
    this.emit(Events.StateChange, { ...this.state });
  }
  selectById(id: string) {
    const matchedIndex = this.options.findIndex((t) => t.id === id);
    if (matchedIndex === -1) {
      return;
    }
    this.current = matchedIndex;
    if (!this.selectedTab) {
      return;
    }
    this.calcScrollLeft(this.selectedTab);
  }
  calcLineLeft(index: number) {
    const matchedTab = this.options[index];
    if (!matchedTab) {
      return null;
    }
    const client = this.extra[matchedTab.id];
    return client.left - this.container.left + client.width / 2;
  }
  updateTabClient(index: number, info: { width: number; height: number; left: number }) {
    console.log("[DOMAIN]tab-header - updateTabClient", index, info);
    const matchedTab = this.options[index];
    if (!matchedTab) {
      return;
    }
    this.count += 1;
    this.extra[matchedTab.id] = info;
    console.log("[DOMAIN]tab-header - update", this.count, this.options.length);
    if (this.count !== this.options.length) {
      return;
    }
    const left = (() => {
      if (this.left !== null) {
        return this.left;
      }
      return this.calcLineLeft(this.current);
    })();
    console.log("[DOMAIN]tab-header - left is", left);
    if (left !== null) {
      this.left = left;
      this.changeLinePosition(left);
    }
    this.emit(Events.Mounted);
  }
  changeLinePosition(left: number) {
    this.emit(Events.LinePositionChange, { left });
  }
  updateTabClientById(id: string, info: { width: number; height: number; left: number }) {
    const matchedTabIndex = this.options.findIndex((t) => t.id === id);
    if (matchedTabIndex === -1) {
      return;
    }
    const matchedTab = this.options[matchedTabIndex];
    this.extra[matchedTab.id] = info;
  }
  updateContainerClient(info: { width: number; height: number; left: number }) {
    // console.log('[]setContainer', info);
    this.container = {
      ...this.container,
      ...info,
    };
    // this.emit(Events.Mounted);
  }
  calcScrollLeft(curTab: TabHeaderCore<T>["selectedTab"]) {
    const { width, left } = this.container;
    console.log("[]calcScrollLeft", this.container, curTab);
    const client = this.extra[curTab.id];
    const theTabMiddle = client.left + client.width / 2;
    const realTargetPosition = (() => {
      if (this.targetLeftWhenSelected === null) {
        return 0;
      }
      if (this.targetLeftWhenSelected <= 1) {
        return this.targetLeftWhenSelected * width;
      }
      return this.targetLeftWhenSelected;
    })();
    if (theTabMiddle <= realTargetPosition) {
      this.container.scrollLeft = 0;
      this.emit(Events.Scroll, {
        left: 0,
      });
      return;
    }
    const theLeftNeedScroll = theTabMiddle - left - realTargetPosition;
    this.container.scrollLeft = theLeftNeedScroll;
    // @todo 需要移动的距离太小了，就忽略
    // @todo 当移动的 tab 偏右侧，已经没有可以移动的空间了，也忽略
    console.log("[]calcScrollLeft - need move", theLeftNeedScroll);
    this.emit(Events.Scroll, {
      left: theLeftNeedScroll,
    });
  }

  onScroll(handler: Handler<TheTypesOfEvents<T>[Events.Scroll]>) {
    return this.on(Events.Scroll, handler);
  }
  onLinePositionChange(handler: Handler<TheTypesOfEvents<T>[Events.LinePositionChange]>) {
    return this.on(Events.LinePositionChange, handler);
  }
  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents<T>[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
