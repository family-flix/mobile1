/**
 * @file 小黑块 提示
 */
import React, { useState } from "react";

import { Portal as PortalPrimitive } from "@/packages/ui/portal";
import { Presence } from "@/components/ui/presence";
import { ToastCore } from "@/domains/ui/toast";
import { cn } from "@/utils";

const Root = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLElement>) => {
  return <div>{props.children}</div>;
};

const Portal = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <Presence store={store.present}>
      <PortalPrimitive>{props.children}</PortalPrimitive>
    </Presence>
  );
};

const Overlay = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  const [open, setOpen] = useState(store.open);

  store.onOpenChange((nextOpen) => {
    setOpen(nextOpen);
  });

  return <div data-state={open ? "open" : "closed"} className={cn(props.className)} />;
};

const Content = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;
  const [open, setOpen] = useState(store.open);

  store.onOpenChange((nextOpen) => {
    setOpen(nextOpen);
  });

  return (
    <div className="fixed z-[99] left-[50%] translate-x-[-50%] top-60 w-120 h-120 ">
      <div data-state={open ? "open" : "closed"} className={cn(props.className)}>
        {props.children}
      </div>
    </div>
  );
};

export { Root, Portal, Overlay, Content };
