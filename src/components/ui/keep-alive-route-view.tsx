/**
 * @file 不销毁的路由视图
 */
import React, { useEffect, useState } from "react";

import { RouteViewCore } from "@/domains/route_view";
import { cn } from "@/utils";
import { useInitialize } from "@/hooks";

export function KeepAliveRouteView(
  props: {
    store: RouteViewCore;
    index: number;
  } & React.AllHTMLAttributes<HTMLDivElement>
) {
  const { store, index } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.ready();
  });
  useEffect(() => {
    if (store.mounted) {
      return;
    }
    console.log("[COMPONENT]keep-alice-route-view - useEffect");
    store.setMounted();
    store.showed();
    return () => {
      store.setUnmounted();
      store.destroy();
    };
  }, []);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const { mounted, visible } = state;

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(props.className)}
      style={{
        display: visible ? "block" : "none",
        zIndex: index,
      }}
      data-state={visible ? "open" : "closed"}
      data-title={store.title}
      data-href={store.href}
      // onAnimationEnd={() => {
      //   if (store.state.visible) {
      //     return;
      //   }
      //   store.destroy();
      // }}
    >
      {props.children}
    </div>
  );
}
