import { debounce } from "lodash/fp";

import { RouteViewCore } from "@/domains/route_view";
import { BaseDomain, Handler } from "@/domains/base";
import { Application } from "@/domains/app";

enum Events {
  StateChange,
  Refresh,
  ScrollToTop,
}
type TheTypesOfEvents = {
  [Events.StateChange]: BottomMenuState;
  [Events.Refresh]: void;
  [Events.ScrollToTop]: void;
};
type BottomMenuProps = {
  app: Application;
  icon: unknown;
  text: string;
  pathname: string;
};
type BottomMenuState = {
  icon: unknown;
  text: string;
  active: boolean;
  badge: boolean;
};

export class BottomMenuCore extends BaseDomain<TheTypesOfEvents> {
  app: Application;
  defaultIcon: unknown;
  defaultText: string;
  icon: unknown;
  text: string;
  pathname: string;
  badge: boolean = false;
  active: boolean = false;
  clickForScrollToTop = false;
  clickForRefresh = true;

  get state(): BottomMenuState {
    return {
      icon: this.icon,
      text: this.text,
      active: this.active,
      badge: this.badge,
    };
  }
  constructor(props: Partial<{ _name: string }> & BottomMenuProps) {
    super(props);

    const { app, icon, text, pathname } = props;
    this.app = app;
    this.defaultIcon = icon;
    this.defaultText = text;
    this.icon = icon;
    this.text = text;
    this.pathname = pathname;
  }

  select() {
    if (this.active) {
      return;
    }
    this.active = true;
    if (this.pendingState) {
      const { icon, text, clickForScrollToTop, clickForRefresh } = this.pendingState;
      this.icon = icon;
      this.text = text;
      this.clickForScrollToTop = clickForScrollToTop;
      this.clickForRefresh = clickForRefresh;
    }
    this.emit(Events.StateChange, { ...this.state });
  }
  pendingState: (BottomMenuState & { clickForScrollToTop: boolean; clickForRefresh: boolean }) | null = null;
  /** 切换到其他按钮时，暂存该按钮状态 */
  hide() {
    if (!this.active) {
      return;
    }
    this.pendingState = {
      icon: this.icon,
      text: this.text,
      active: this.active,
      badge: this.badge,
      clickForScrollToTop: this.clickForScrollToTop,
      clickForRefresh: this.clickForRefresh,
    };
    this.icon = this.defaultIcon;
    this.text = this.defaultText;
    this.active = false;
    this.clickForScrollToTop = false;
    this.clickForRefresh = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 貌似有点问题 */
  disable = () => {
    // console.log("[DOMAIN]BottomMenu - disable");
    this.clickForScrollToTop = false;
    this.clickForRefresh = false;
    this.icon = this.defaultIcon;
    this.text = this.defaultText;
    this.emit(Events.StateChange, { ...this.state });
  };
  setCanRefresh = () => {
    if (this.clickForRefresh) {
      return;
    }
    this.clickForRefresh = true;
    this.update();
  };
  setCanTop = (values: { icon: unknown; text: string }) => {
    if (this.clickForScrollToTop) {
      return;
    }
    const { icon, text } = values;
    this.icon = icon;
    this.text = text;
    this.clickForScrollToTop = true;
    this.update();
  };
  update = debounce(200, () => {
    if (!this.active) {
      return;
    }
    this.emit(Events.StateChange, { ...this.state });
  });
  setIcon(icon: unknown) {
    this.icon = icon;
    this.emit(Events.StateChange, { ...this.state });
  }
  setText(text: string) {
    this.text = text;
    this.emit(Events.StateChange, { ...this.state });
  }
  handleClick() {
    console.log("[DOMAIN]BottomMenu - handleClick", this.active, this.clickForScrollToTop, this.clickForRefresh);
    if (this.active) {
      if (this.clickForScrollToTop) {
        this.emit(Events.ScrollToTop);
        return;
      }
      if (this.clickForRefresh) {
        this.emit(Events.Refresh);
        return;
      }
      return;
    }
    // this.app.showView(this.view);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onScrollToTop(handler: Handler<TheTypesOfEvents[Events.ScrollToTop]>) {
    return this.on(Events.ScrollToTop, handler);
  }
  onRefresh(handler: Handler<TheTypesOfEvents[Events.Refresh]>) {
    return this.on(Events.Refresh, handler);
  }
}
