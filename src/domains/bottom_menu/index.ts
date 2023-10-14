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
  view: RouteViewCore;
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
  view: RouteViewCore;
  badge: boolean = false;
  active: boolean = false;
  clickForScrollToTop = false;

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

    const { app, icon, text, view } = props;
    this.app = app;
    this.defaultIcon = icon;
    this.defaultText = text;
    this.icon = icon;
    this.text = text;
    this.view = view;
  }

  select() {
    if (this.active) {
      return;
    }
    this.active = true;
    if (this.pendingState) {
      const { icon, text, clickForScrollToTop } = this.pendingState;
      this.icon = icon;
      this.text = text;
      this.clickForScrollToTop = clickForScrollToTop;
    }
    this.emit(Events.StateChange, { ...this.state });
  }
  pendingState: (BottomMenuState & { clickForScrollToTop: boolean }) | null = null;
  reset() {
    if (!this.active) {
      return;
    }
    this.pendingState = {
      icon: this.icon,
      text: this.text,
      active: this.active,
      badge: this.badge,
      clickForScrollToTop: this.clickForScrollToTop,
    };
    this.icon = this.defaultIcon;
    this.text = this.defaultText;
    this.active = false;
    this.clickForScrollToTop = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  recover = debounce(200, () => {
    if (this.clickForScrollToTop === false) {
      return;
    }
    this.clickForScrollToTop = false;
    this.icon = this.defaultIcon;
    this.text = this.defaultText;
    this.emit(Events.StateChange, { ...this.state });
  });
  setCanTop = debounce(200, (values: { icon: unknown; text: string }) => {
    if (this.clickForScrollToTop) {
      return;
    }
    const { icon, text } = values;
    this.clickForScrollToTop = true;
    this.icon = icon;
    this.text = text;
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
    if (this.active) {
      if (this.clickForScrollToTop) {
        this.emit(Events.ScrollToTop);
        return;
      }
      this.emit(Events.Refresh);
      return;
    }
    this.app.showView(this.view);
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
