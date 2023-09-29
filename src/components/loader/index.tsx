import React, { useState } from "react";
import { Loader } from "lucide-react";
import { Handler } from "mitt";

import { cn } from "@/utils";
import { BaseDomain } from "@/domains/base";
import { useInitialize } from "@/hooks";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: LoaderOverrideState;
};
type LoaderOverrideState = {
  loading: boolean;
};
type LoaderOverrideProps = {};
export class LoaderOverrideCore extends BaseDomain<TheTypesOfEvents> {
  loading = false;
  get state(): LoaderOverrideState {
    return {
      loading: this.loading,
    };
  }

  constructor(props: LoaderOverrideProps) {
    super(props);
  }

  load() {
    this.loading = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  unload() {
    this.loading = false;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

export function LoaderContainer(props: { store: LoaderOverrideCore } & React.AllHTMLAttributes<HTMLHtmlElement>) {
  const { store } = props;

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const [state, setState] = useState(store.state);

  return (
    <div className={cn("relative", props.className)}>
      {state.loading ? <Loader className="absolute inset-0 w-full h-full animate animate-spin" /> : props.children}
    </div>
  );
}
