import React, { useState } from "react";
import { Loader, Loader2 } from "lucide-react";
import { Handler } from "mitt";

import { cn } from "@/utils";
import { BaseDomain } from "@/domains/base";
import { useInitialize } from "@/hooks";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: ToggleOverrideState;
};
type ToggleOverrideState = {
  visible: boolean;
};
type LoaderOverrideProps = {};
export class ToggleOverrideCore extends BaseDomain<TheTypesOfEvents> {
  visible = false;

  get state(): ToggleOverrideState {
    return {
      visible: this.visible,
    };
  }

  constructor(props: LoaderOverrideProps) {
    super(props);
  }

  toggle() {
    if (this.visible) {
      this.hide();
      return;
    }
    this.show();
  }
  show() {
    this.visible = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  hide() {
    this.visible = false;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

export function ToggleOverlay(
  props: { store: ToggleOverrideCore } & React.AllHTMLAttributes<HTMLHtmlElement>
): JSX.Element {
  const { store } = props;

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const [state, setState] = useState(store.state);

  // @ts-ignore
  return state.visible ? props.children : null;
}
