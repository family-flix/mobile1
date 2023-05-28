/**
 * @file 会销毁页面的视图（如果希望不销毁可以使用 keep-alive-route-view
 */
import { useState } from "react";

import { RouteViewCore } from "@/domains/route_view";

export function RouteView(
  props: { store: RouteViewCore } & { children: React.ReactElement }
) {
  const { store } = props;
  const [state, setState] = useState(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  //   const visible = () => state().visible;
  //   const mounted = () => state().mounted;

  //   console.log("RouteView", store.name, visible(), mounted());

  if (!state.mounted) {
    return null;
  }

  return (
    <div
      className="w-full h-full"
      // class={cn(
      //   "animate-in sm:zoom-in-90",
      //   "data-[state=open]:data-[state=open]:slide-in-from-bottom-full",
      //   "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-full"
      // )}
      data-state={state.visible ? "open" : "closed"}
      // onAnimationEnd={() => {
      //   store.presence.animationEnd();
      // }}
    >
      {props.children}
    </div>
  );
}
