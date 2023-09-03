import { Handler } from "mitt";

import { UserCore } from "@/domains/user";
import { BaseDomain } from "@/domains/base";
// import { Drive } from "@/domains/drive";
import { NavigatorCore } from "@/domains/navigator";
import { JSONObject, Result } from "@/types";

import { LocalCache } from "./cache";

const mediaSizes = {
  sm: 0,
  md: 768, // 中等设备宽度阈值
  lg: 992, // 大设备宽度阈值
  xl: 1200, // 特大设备宽度阈值
  "2xl": 1536, // 特大设备宽度阈值
};
function getCurrentDeviceSize(width: number) {
  if (width >= mediaSizes["2xl"]) {
    return "2xl";
  }
  if (width >= mediaSizes.xl) {
    return "xl";
  }
  if (width >= mediaSizes.lg) {
    return "lg";
  }
  if (width >= mediaSizes.md) {
    return "md";
  }
  return "sm";
}
export const MEDIA = "(prefers-color-scheme: dark)";

enum Events {
  Ready,
  Tip,
  Error,
  Login,
  Logout,
  // 一些平台相关的事件
  PopState,
  Resize,
  DeviceSizeChange,
  Blur,
  Keydown,
  EscapeKeyDown,
  ClickLink,
  Show,
  Hidden,
  // 该怎么处理？
  // DrivesChange,
}
type TheTypesOfEvents = {
  [Events.Ready]: void;
  // [EventsUserCore{ icon?: string; text: string[] };
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
  [Events.PopState]: {
    type: string;
    pathname: string;
  };
  [Events.Resize]: {
    width: number;
    height: number;
  };
  [Events.DeviceSizeChange]: DeviceSizeTypes;
  [Events.Keydown]: {
    key: string;
  };
  [Events.EscapeKeyDown]: void;
  [Events.ClickLink]: {
    href: string;
  };
  [Events.Blur]: void;
  [Events.Show]: void;
  [Events.Hidden]: void;
  // [Events.DrivesChange]: Drive[];
};
type ApplicationState = {
  ready: boolean;
  env: JSONObject;
  theme: ThemeTypes;
  deviceSize: DeviceSizeTypes;
};
type DeviceSizeTypes = keyof typeof mediaSizes;
type ThemeTypes = "dark" | "light" | "system";

export class Application extends BaseDomain<TheTypesOfEvents> {
  user: UserCore;
  router: NavigatorCore;
  cache: LocalCache;
  lifetimes: Partial<{
    beforeReady: () => Promise<Result<null>>;
    onReady: () => void;
  }> = {};

  ready = false;
  screen: {
    width: number;
    height: number;
  } = {
    width: 0,
    height: 0,
  };
  env: JSONObject = {};
  curDeviceSize: DeviceSizeTypes = "md";
  theme: ThemeTypes = "system";

  safeArea = false;
  Events = Events;

  // @todo 怎么才能更方便地拓展 Application 类，给其添加许多的额外属性还能有类型提示呢？

  get state(): ApplicationState {
    return {
      ready: this.ready,
      theme: this.theme,
      env: this.env,
      deviceSize: this.curDeviceSize,
    };
  }

  static Events = Events;

  constructor(
    options: {
      user: UserCore;
      router: NavigatorCore;
      cache: LocalCache;
    } & Application["lifetimes"]
  ) {
    super();

    const { user, router, cache, beforeReady, onReady } = options;
    this.lifetimes = {
      beforeReady,
      onReady,
    };
    this.user = user;
    this.router = router;
    this.cache = cache;
  }
  /** 启动应用 */
  async start(options: { width: number; height: number }) {
    const { width, height } = options;
    this.screen = { width, height };
    this.curDeviceSize = getCurrentDeviceSize(width);
    const { beforeReady } = this.lifetimes;
    if (beforeReady) {
      const r = await beforeReady();
      // console.log("[]Application - ready result", r);
      if (r.error) {
        return Result.Err(r.error);
      }
    }
    this.ready = true;
    this.emit(Events.Ready);
    // console.log("[]Application - before start");
    return Result.Ok(null);
  }
  setTheme(theme?: string) {
    let resolved = theme;
    if (!resolved) {
      return;
    }
    // If theme is system, resolve it before setting theme
    if (theme === "system") {
      resolved = this.getSystemTheme();
    }
  }
  applyTheme() {
    throw new Error("请在 connect.web 中实现 applyTheme 方法");
  }
  /** 手机震动 */
  vibrate() {}
  setSize(size: { width: number; height: number }) {
    this.screen = size;
  }
  setTitle(title: string): void {
    throw new Error("请实现 setTitle 方法");
  }
  setEnv(extra: JSONObject) {
    this.env = {
      ...this.env,
      ...extra,
    };
  }
  /** 复制文本到粘贴板 */
  copy(text: string) {
    throw new Error("请实现 copy 方法");
  }
  getComputedStyle(el: HTMLElement): CSSStyleDeclaration {
    throw new Error("请实现 getComputedStyle 方法");
  }
  getSystemTheme(e?: any): string {
    return "";
  }
  disablePointer() {
    throw new Error("请实现 disablePointer 方法");
  }
  enablePointer() {
    throw new Error("请实现 enablePointer 方法");
  }
  /** 平台相关的全局事件 */
  keydown({ key }: { key: string }) {
    if (key === "Escape") {
      this.escape();
    }
    this.emit(Events.Keydown, { key });
  }
  escape() {
    this.emit(Events.EscapeKeyDown);
  }
  popstate({ type, pathname }: { type: string; pathname: string }) {
    this.emit(Events.PopState, { type, pathname });
  }
  resize(size: { width: number; height: number }) {
    this.screen = size;
    const mediaStr = getCurrentDeviceSize(size.width);
    if (mediaStr !== this.curDeviceSize) {
      this.curDeviceSize = mediaStr;
      this.emit(Events.DeviceSizeChange, this.curDeviceSize);
    }
    this.emit(Events.Resize, size);
  }
  blur() {
    this.emit(Events.Blur);
  }
  /* ----------------
   * Lifetime
   * ----------------
   */
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onDeviceSizeChange(handler: Handler<TheTypesOfEvents[Events.DeviceSizeChange]>) {
    return this.on(Events.DeviceSizeChange, handler);
  }
  /** 平台相关全局事件 */
  onPopState(handler: Handler<TheTypesOfEvents[Events.PopState]>) {
    return this.on(Events.PopState, handler);
  }
  onResize(handler: Handler<TheTypesOfEvents[Events.Resize]>) {
    return this.on(Events.Resize, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onClickLink(handler: Handler<TheTypesOfEvents[Events.ClickLink]>) {
    return this.on(Events.ClickLink, handler);
  }
  onKeydown(handler: Handler<TheTypesOfEvents[Events.Keydown]>) {
    return this.on(Events.Keydown, handler);
  }
  onEscapeKeyDown(handler: Handler<TheTypesOfEvents[Events.EscapeKeyDown]>) {
    return this.on(Events.EscapeKeyDown, handler);
  }
  /**
   * ----------------
   * Event
   * ----------------
   */
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
}
