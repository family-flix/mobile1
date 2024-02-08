/**
 * @file 不销毁的路由视图
 */
import React, { useEffect, useRef, useState } from "react";

import { RouteViewCore } from "@/domains/route_view";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

export function StackRouteView(
  props: {
    store: RouteViewCore;
    index: number;
  } & React.AllHTMLAttributes<HTMLDivElement>
) {
  const { store, index } = props;

  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      console.log("[COMPONENT]ui/stack-route-view - store.onStateChange", nextState.visible, store.title);
      setState(nextState);
    });
    store.onBeforeShow(() => {
      const $div = container.current;
      if (!$div) {
        return;
      }
      if (store.animation.show) {
        $div.classList.add("active");
      }
    });
    store.onBeforeHide(() => {
      const $div = container.current;
      if (!$div) {
        return;
      }
      if (store.animation.hide) {
        $div.classList.add(store.animation.hide);
      }
    });
    store.ready();
  });
  useEffect(() => {
    if (store.mounted) {
      return;
    }
    // store.setMounted();
    store.showed();
    return () => {
      store.setUnmounted();
      store.destroy();
    };
  }, []);

  const { mounted, visible } = state;

  if (!mounted) {
    return null;
  }

  // console.log("[COMPONENT]stack-route-view - render", store.title, visible, mounted);

  return (
    <div
      className={cn(
        props.className,
        // "animate",
        // "animate-in duration-500",
        // index !== 0 ? (store.animation.show ? ` ${store.animation.show}` : "") : "",
        // `data-[state=open]:${store.animation.show}`
        // visible ? `${store.animation.show}` : `${store.animation.hide}`
        // store.animation.hide
        //   ? `data-[state=closed]:animate-out data-[state=closed]:duration-500 data-[state=closed]:${store.animation.hide}`
        //   : ""
      )}
      style={{
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
