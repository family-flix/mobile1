/**
 * @file 控制内容显隐的组件
 */
import { useState } from "react";

import { PresenceCore } from "@/domains/ui/presence";
import { cn } from "@/utils";

import { Show } from "./show";

export const Presence = (
  props: {
    store: PresenceCore;
  } & React.AllHTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = useState(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  // store.onShow(() => {
  //   console.log(1);
  // });
  // store.onHidden(() => {
  //   console.log(2);
  // });
  // store.onDestroy(() => {
  //   console.log(3);
  // });

  const { open, mounted } = state;

  return (
    <Show when={mounted}>
      <div
        className={cn("presence", props.className)}
        role="presentation"
        data-state={open ? "open" : "closed"}
        onAnimationEnd={() => {
          store.unmount();
        }}
      >
        {props.children}
      </div>
    </Show>
  );
};
