/**
 * @file 小黑块 提示
 */
import { useState } from "react";

import * as ToastPrimitive from "@/packages/ui/toast";
import { ToastCore } from "@/domains/ui/toast";
import { cn } from "@/utils";

export const Toast = (props: { store: ToastCore }) => {
  const { store } = props;

  const [state, setState] = useState(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const { texts } = state;

  return (
    <Root store={store}>
      <Portal store={store}>
        <Content store={store}>
          {texts.map((text, i) => {
            return (
              <div key={i} className="text-center">
                {text}
              </div>
            );
          })}
        </Content>
      </Portal>
    </Root>
  );
};

const Root = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return <ToastPrimitive.Root store={store}>{props.children}</ToastPrimitive.Root>;
};

const Portal = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <ToastPrimitive.Portal
      store={store}
      className={cn("data-[state=open]:fade-in-90", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
    >
      {props.children}
    </ToastPrimitive.Portal>
  );
};

const Overlay = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <ToastPrimitive.Overlay
      store={store}
      className={cn(
        "fixed inset-0 z-51 bg-black/50 backdrop-blur-sm transition-all duration-100",
        "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out",
        props.className
      )}
    />
  );
};

const Content = (props: { store: ToastCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <ToastPrimitive.Content
      store={store}
      className={cn(
        "grid gap-4 rounded-lg bg-w-bg-4 text-w-bg-0 dark:text-w-fg-0 p-6 sm:max-w-lg sm:rounded-lg",
        "animate-in sm:zoom-in-90",
        "data-[state=open]:fade-in-90",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
    >
      {props.children}
    </ToastPrimitive.Content>
  );
};

export { Root, Portal, Overlay, Content };
