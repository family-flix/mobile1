/**
 * @file ???
 */
import React, { useState } from "react";

import { RouteViewCore } from "@/domains/route_view";
import { cn } from "@/utils";

export function KeepAliveRouteView(
  props: {
    store: RouteViewCore;
    index: number;
  } & { className?: string; children: React.ReactElement }
) {
  const { store, index } = props;

  const [state, setState] = useState(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const { mounted, visible } = state;

  // const className = cn(mounted() ? "block" : "hidden", props.class);

  return (
    <div
      className={cn(
        "absolute left-0 top-0 w-full h-full",
        {
          // block: mounted,
          // hidden: !mounted,
          // block: visible,
          // hidden: !visible,
        },
        props.className
      )}
      style={{
        display: visible ? 'block' : 'none',
        zIndex: index,
      }}
      data-state={visible ? "open" : "closed"}
    >
      {props.children}
    </div>
  );
}
