/**
 * @file 会销毁页面的视图（如果希望不销毁可以使用 keep-alive-route-view/stack-route-view
 */
import { useEffect, useState } from "react";

import { RouteViewCore } from "@/domains/route_view";
import { useInitialize } from "@/hooks";

export function RouteView(props: { store: RouteViewCore } & React.AllHTMLAttributes<HTMLDivElement>) {
  const { store } = props;
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.ready();
  });
  useEffect(() => {
    if (store.mounted) {
      return;
    }
    console.log("[COMPONENT]route-view - useEffect");
    store.setMounted();
    store.showed();
    return () => {
      store.setUnmounted();
    };
  }, []);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  //   const visible = () => state().visible;
  //   const mounted = () => state().mounted;

  //   console.log("RouteView", store.name, visible(), mounted());

  if (!state.visible) {
    return null;
  }

  return (
    <div
      className={props.className}
      data-state={state.visible ? "open" : "closed"}
      // onAnimationEnd={() => {
      //   store.presence.animationEnd();
      // }}
    >
      {props.children}
    </div>
  );
}
