/**
 * @file 固钉
 */

import { BaseDomain } from "@/domains/base";
import { Handler } from "mitt";

enum Events {
  /** 变成固定 */
  Fixed,
  /** 取消固定 */
  UnFixed,
  /** 内容位置、宽高等信息改变 */
  SizeChange,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Fixed]: void;
  [Events.UnFixed]: void;
  [Events.SizeChange]: void;
  [Events.StateChange]: AffixState;
};
type AffixProps = {
  top: number;
};
type AffixState = {};

export class AffixCore extends BaseDomain<TheTypesOfEvents> {
  height = 0;
  /** 当前 */
  top = 0;
  /** 当距离顶部多少距离时固定 */
  targetTop = 0;
  fixed = false;

  get state() {
    return {
      height: this.height,
      fixed: this.fixed,
      top: this.targetTop,
    };
  }

  constructor(options: AffixProps) {
    super();

    const { top } = options;
    this.targetTop = top;
  }

  register(size: { top: number; height: number }) {
    const { top, height } = size;
    this.top = top;
    console.log("[COMPONENT]FixedTopForHome - register", this.targetTop, this.top);
    if (this.targetTop >= this.top) {
      // 如果目标距离大于实际距离，发生固定时，位置反而会往下移动，所以这里将目标距离等于实际距离
      this.targetTop = this.top;
    }
    this.height = height;
    this.emit(Events.SizeChange);
  }
  registerAgain() {
    const { top, height } = this.rect();
    this.register({ top, height });
  }
  rect = () => {
    return {
      top: 0,
      height: 0,
    };
  };
  // setRect(fn) {
  //   this.rect = fn;
  // }
  scroll(data: { scrollTop: number }) {
    const { scrollTop } = data;
    const fixed = (() => {
      if (this.targetTop >= this.top) {
        return true;
      }
      if (scrollTop + this.targetTop >= this.top) {
        return true;
      }
      return false;
    })();
    // console.log('[COMPONENT]FixedTopForHome - scroll', scrollTop, this.targetTop, this.top, fixed);
    if (this.fixed === fixed) {
      return;
    }
    this.fixed = fixed;
    (() => {
      if (this.fixed) {
        this.emit(Events.Fixed);
        return;
      }
      this.emit(Events.UnFixed);
    })();
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events]>) {
    return this.on(Events.StateChange, handler);
  }
}
