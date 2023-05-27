import React, { useState } from "react";

import { ViewCore } from "@/domains/route_view";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

export function View(props: {
  store: ViewCore;
  animation?: boolean;
  children: React.ReactElement;
}) {
  const { store, animation = false } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { visible } = state;

  console.log("view compoennt", visible);

  if (!visible) {
    return null;
  }
  const className = animation
    ? cn(
        "animate-in",
        "data-[state=open]:data-[state=open]:slide-in-from-right-full"
        // "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full"
      )
    : "";
  return (
    <div
      className={className}
      data-state={visible ? "open" : "closed"}
      // onAnimationEnd={() => {
      //   store.presence.animationEnd();
      // }}
    >
      {props.children}
    </div>
  );
}
