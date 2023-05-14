import React, { useState } from "react";

import { ViewCore } from "@/domains/view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

import { PageView } from "./scroll-view";

const scrollView = new ScrollViewCore();

export function KeepAliveView(props: {
  parent: ViewCore;
  store: ViewCore;
  index: number;
  style?: React.CSSProperties;
  children: React.ReactElement;
}) {
  const { parent, store, index, style } = props;

  // const [state, setState] = useState(store.state);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);

  useInitialize(() => {
    // store.onStateChange((nextState) => {
    //   setState(nextState);
    // });
    store.onHide(() => {
      setHidden(true);
    });
    setTimeout(() => {
      setVisible(true);
    }, 200);
  });

  // const { visible } = state;

  const className = cn(
    "page",
    index !== 0 ? "slide" : "",
    visible ? "mounted" : "",
    hidden ? "unmounted" : ""
  );
  return (
    <PageView
      store={scrollView}
      className={className}
      style={{
        zIndex: index,
      }}
      data-state={visible ? "open" : "closed"}
      // onAnimationEnd={() => {
      //   parent.animationEnd();
      // }}
    >
      {props.children}
    </PageView>
  );
}
