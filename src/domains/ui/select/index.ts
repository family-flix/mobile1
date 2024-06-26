// @ts-nocheck

import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PopperCore } from "@/domains/ui/popper";
import { CollectionCore } from "@/domains/ui/collection";
import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";
import { Direction } from "@/domains/ui/direction";
import { Rect } from "@/types";
// import { app } from "@/store/app";

import { SelectContentCore } from "./content";
import { SelectViewportCore } from "./viewport";
import { SelectValueCore } from "./value";
import { SelectTriggerCore } from "./trigger";
import { SelectWrapCore } from "./wrap";
import { SelectItemCore } from "./item";
import { clamp } from "./utils";
import { Application } from "@/domains/app";

const CONTENT_MARGIN = 10;
enum Events {
  StateChange,
  ValueChange,
  Focus,
  Placed,
}
type TheTypesOfEvents = {
  [Events.StateChange]: SelectState;
  [Events.ValueChange]: SelectItemCore;
  [Events.Focus]: void;
  [Events.Placed]: void;
};
type SelectState = {
  value?: unknown;
  /** 菜单是否展开 */
  open: boolean;
  /** 禁用 */
  disabled: boolean;
  /** 是否必填 */
  required: boolean;
  dir: Direction;
  styles: Partial<CSSStyleDeclaration>;
};
type SelectCoreProps = {
  app: Application;
};
export class SelectCore extends BaseDomain<TheTypesOfEvents> {
  _unique_id = "SelectCore";
  debug = true;

  app: Application;
  popper: PopperCore;
  collection: CollectionCore;
  layer: DismissableLayerCore;
  items: SelectItemCore[] = [];

  position: "popper" | "item-aligned" = "popper";
  state: SelectState = {
    value: undefined,
    open: false,
    disabled: false,
    required: false,
    dir: "ltr",
    styles: {},
  };

  /** 参考点位置 */
  triggerPos: {
    x: number;
    y: number;
  } = {
    x: 0,
    y: 0,
  };
  reference: Rect;
  /** 触发按钮 */
  trigger: SelectTriggerCore;
  wrap: SelectWrapCore;
  /** 下拉列表 */
  content: SelectContentCore | null;
  /** 下拉列表容器 */
  viewport: SelectViewportCore | null;
  /** 选中的值 */
  value: SelectValueCore | null;
  /** 选中的 item */
  selectedItem: SelectItemCore | null;

  _findFirstValidItem = false;

  constructor(props: Partial<{ name: string }> & SelectCoreProps) {
    super(props);

    const { app } = props;

    this.app = app;
    this.popper = new PopperCore();
    this.layer = new DismissableLayerCore();
    this.collection = new CollectionCore();
    this.popper.onReferenceMounted((reference) => {
      const { x, y, width, height } = reference;
      this.reference = {
        width,
        height,
        x,
        y,
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
      };
    });
    this.layer.onDismiss(() => {
      console.log(...this.log("this.layer.onDismiss"));
      this.hide();
    });
  }

  setTriggerPointerDownPos(pos: { x: number; y: number }) {
    this.triggerPos = pos;
  }
  setTrigger(trigger: SelectTriggerCore) {
    this.trigger = trigger;
  }
  setWrap(wrap: SelectWrapCore) {
    this.wrap = wrap;
  }
  setContent(content: SelectContentCore) {
    this.content = content;
  }
  setViewport(viewport: SelectViewportCore) {
    this.viewport = viewport;
  }
  setValue(value: SelectValueCore) {
    this.value = value;
  }
  setSelectedItem(item: SelectItemCore) {
    this.selectedItem = item;
  }
  async show() {
    // console.log(...this.log("show", this.state));
    if (this.state.disabled) {
      return;
    }
    if (this.state.open) {
      return;
    }
    this.state.open = true;
    this.emit(Events.StateChange, { ...this.state });
    this.popper.place();
    // this.position();
  }
  hide = () => {
    // console.log(...this.log("hide", this));
    if (this.state.open === false) {
      return;
    }
    this.state.open = false;
    this.emit(Events.StateChange, { ...this.state });
  };
  addNativeOption() {}
  removeNativeOption() {}
  appendItem(item: SelectItemCore) {
    if (this.items.includes(item)) {
      return;
    }
    item.onLeave(() => {
      this.focus();
    });
    item.onDestroy(() => {
      this.items = this.items.filter((i) => i !== item);
    });
    const findFirstValidItem = !this._findFirstValidItem && !this.state.disabled;
    if (findFirstValidItem) {
      this._findFirstValidItem = true;
    }
    const isSelected = this.state.value === item.state.value;
    if (findFirstValidItem || isSelected) {
      this.setSelectedItem(item);
    }
    this.items.push(item);
  }
  /** 选择 item */
  select(item: SelectItemCore) {
    if (item.state.selected) {
      this.hide();
      return;
    }
    this.state.value = item.value;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.ValueChange, item);
    // item.select/unselect 必须放在 select.emit 后面
    for (let i = 0; i < this.items.length; i += 1) {
      const it = this.items[i];
      if (it.state.selected) {
        it.unselect();
      }
    }
    item.select();
    this.hide();
  }
  focus() {
    this.emit(Events.Focus);
  }
  setPosition() {
    const { dir } = this.state;
    const app = this.app;
    const wrapStyles = {
      // width: 0,
      height: 0,
      minWidth: 0,
      minHeight: 0,
      maxWidth: 0,
      maxHeight: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      margin: [0, 0, 0, 0],
    };
    console.log(
      ...this.log(
        "position",
        this.trigger?.$node(),
        this.value?.$node(),
        this.wrap?.$node(),
        this.content?.$node(),
        this.viewport?.$node(),
        this.selectedItem?.$node(),
        this.selectedItem?.text?.$node()
      )
    );
    const itemRect = this.selectedItem.getRect();
    const contentRect = this.content.getRect();
    const valueRect = this.value.getRect();
    const triggerRect = this.trigger.getRect();
    // -----------------------------------------------------------------------------------------
    //  Horizontal positioning
    // -----------------------------------------------------------------------------------------
    if (dir !== "rtl") {
      const itemTextOffset = itemRect.left - contentRect.left;
      const left = valueRect.left - itemTextOffset;
      const leftDelta = this.reference.left - left;
      const minContentWidth = this.reference.width + leftDelta;
      const contentWidth = Math.max(minContentWidth, contentRect.width);
      const rightEdge = app.screen.width - CONTENT_MARGIN;
      const clampedLeft = clamp(left, [CONTENT_MARGIN, rightEdge - contentWidth]);
      wrapStyles.minWidth = minContentWidth;
      wrapStyles.left = clampedLeft;
    } else {
      const itemTextOffset = contentRect.right - itemRect.right;
      const right = window.innerWidth - valueRect.right - itemTextOffset;
      const rightDelta = window.innerWidth - this.reference.right - right;
      const minContentWidth = this.reference.width + rightDelta;
      const contentWidth = Math.max(minContentWidth, contentRect.width);
      const leftEdge = window.innerWidth - CONTENT_MARGIN;
      const clampedRight = clamp(right, [CONTENT_MARGIN, leftEdge - contentWidth]);
      wrapStyles.minWidth = minContentWidth;
      wrapStyles.right = clampedRight;
    }
    // -----------------------------------------------------------------------------------------
    // Vertical positioning
    // -----------------------------------------------------------------------------------------
    // const items = getItems();
    const availableHeight = app.screen.height - CONTENT_MARGIN * 2;
    const itemsHeight = this.viewport.scrollHeight;
    const contentStyles = this.content.getStyles();
    const contentBorderTopWidth = parseInt(contentStyles.borderTopWidth, 10);
    const contentPaddingTop = parseInt(contentStyles.paddingTop, 10);
    const contentBorderBottomWidth = parseInt(contentStyles.borderBottomWidth, 10);
    const contentPaddingBottom = parseInt(contentStyles.paddingBottom, 10);
    const fullContentHeight = contentBorderTopWidth + contentPaddingTop + itemsHeight + contentPaddingBottom + contentBorderBottomWidth; // prettier-ignore
    const minContentHeight = Math.min(this.selectedItem.offsetHeight * 5, fullContentHeight);
    const viewportStyles = this.viewport.getStyles();
    const viewportPaddingTop = parseInt(viewportStyles.paddingTop, 10);
    const viewportPaddingBottom = parseInt(viewportStyles.paddingBottom, 10);
    const topEdgeToTriggerMiddle = triggerRect.top + triggerRect.height / 2 - CONTENT_MARGIN;
    const triggerMiddleToBottomEdge = availableHeight - topEdgeToTriggerMiddle;
    const selectedItemHalfHeight = this.selectedItem.offsetHeight / 2;
    const itemOffsetMiddle = this.selectedItem.offsetTop + selectedItemHalfHeight;
    const contentTopToItemMiddle = contentBorderTopWidth + contentPaddingTop + itemOffsetMiddle;
    const itemMiddleToContentBottom = fullContentHeight - contentTopToItemMiddle;
    const willAlignWithoutTopOverflow = contentTopToItemMiddle <= topEdgeToTriggerMiddle;
    if (willAlignWithoutTopOverflow) {
      const isLastItem = this.selectedItem === this.items[this.items.length - 1];
      wrapStyles.bottom = 0;
      const viewportOffsetBottom = this.content.clientHeight - this.viewport.offsetTop - this.viewport.offsetHeight;
      const clampedTriggerMiddleToBottomEdge = Math.max(
        triggerMiddleToBottomEdge,
        selectedItemHalfHeight +
          // viewport might have padding bottom, include it to avoid a scrollable viewport
          (isLastItem ? viewportPaddingBottom : 0) +
          viewportOffsetBottom +
          contentBorderBottomWidth
      );
      const height = contentTopToItemMiddle + clampedTriggerMiddleToBottomEdge;
      wrapStyles.height = height;
    } else {
      const isFirstItem = this.selectedItem === this.items[0];
      wrapStyles.top = 0;
      const clampedTopEdgeToTriggerMiddle = Math.max(
        topEdgeToTriggerMiddle,
        contentBorderTopWidth +
          this.viewport.offsetTop +
          // viewport might have padding top, include it to avoid a scrollable viewport
          (isFirstItem ? viewportPaddingTop : 0) +
          selectedItemHalfHeight
      );
      const height = clampedTopEdgeToTriggerMiddle + itemMiddleToContentBottom;
      wrapStyles.height = height;
      // this.viewport.scrollTop =
      //   contentTopToItemMiddle -
      //   topEdgeToTriggerMiddle +
      //   this.viewport.offsetTop;
    }
    wrapStyles.margin = [CONTENT_MARGIN, 0, 0, 0];
    wrapStyles.minHeight = minContentHeight;
    wrapStyles.minHeight = minContentHeight;
    wrapStyles.maxHeight = availableHeight;
    // -----------------------------------------------------------------------------------------
    // onPlaced?.();
    // we don't want the initial scroll position adjustment to trigger "expand on scroll"
    // so we explicitly turn it on only after they've registered.
    // requestAnimationFrame(() => (shouldExpandOnScrollRef.current = true));
    const styles = Object.keys(wrapStyles)
      .map((k) => {
        const v = wrapStyles[k];
        if (typeof v === "number") {
          return {
            [k]: `${v}px`,
          };
        }
        if (Array.isArray(v)) {
          return {
            [k]: v.map((vv) => `${vv}px`).join(" "),
          };
        }
        return {
          [k]: v,
        };
      })
      .reduce((nextStyles, cur) => {
        return {
          ...nextStyles,
          ...cur,
        };
      }, {} as CSSStyleDeclaration);
    this.state.styles = styles;
    console.log(...this.log("position", styles));
    this.emit(Events.Placed);
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
  onValueChange(handler: Handler<TheTypesOfEvents[Events.ValueChange]>) {
    this.on(Events.ValueChange, handler);
  }
  onChange(handler: Handler<TheTypesOfEvents[Events.ValueChange]>) {
    this.on(Events.ValueChange, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents[Events.Focus]>) {
    this.on(Events.Focus, handler);
  }
}
