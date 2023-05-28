/**
 * @file 弹窗 组件
 */
import React, { useState } from "react";
import { X } from "lucide-react";

import { DialogCore } from "@/domains/ui/dialog";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@/packages/ui/dialog";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

import { Show } from "./when";

export function Dialog(
  props: {
    store: DialogCore;
  } & React.AllHTMLAttributes<HTMLElement>
) {
  const { store } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { title, footer } = state;

  return (
    <Root store={store}>
      <Portal store={store}>
        <Overlay store={store} />
        <Content store={store}>
          <Header>
            <Title>{title}</Title>
          </Header>
          {props.children}
          <Show when={!!footer}>
            <Footer>
              <div className="space-x-2">
                <Cancel store={store}>取消</Cancel>
                <Submit store={store}>确认</Submit>
              </div>
            </Footer>
          </Show>
        </Content>
      </Portal>
    </Root>
  );
}

const Root = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLElement>) => {
  return <div>{props.children}</div>;
};

const Portal = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLElement>) => {
  const { store } = props;

  return (
    <DialogPrimitive.Portal
      store={store}
      className="fixed inset-0 z-50 flex items-start justify-center sm:items-center"
    >
      {props.children}
    </DialogPrimitive.Portal>
  );
};

const Overlay = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  // const [state, setState] = useState(store.state);

  // useInitialize(() => {
  //   store.onStateChange((nextState) => {
  //     setState(nextState);
  //   });
  // });

  return (
    <DialogPrimitive.Overlay
      store={store}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "transition-all duration-100",
        "data-[state=open]:fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
    />
  );
};

const Content = (
  props: {
    store: DialogCore;
  } & React.AllHTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const [state, setState] = useState(store.state);

  // useInitialize(() => {
  //   store.onStateChange((nextState) => {
  //     setState(nextState);
  //   });
  // });

  return (
    <DialogPrimitive.Content
      store={store}
      // data-state={getState(state.open)}
      className={cn(
        "fixed z-50 grid w-full gap-4 rounded-b-lg bg-white p-6 sm:max-w-lg sm:rounded-lg",
        "sm:zoom-in-90",
        "dark:bg-slate-900",
        "animate-in data-[state=open]:fade-in-90",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
    >
      {props.children}
      <DialogPrimitive.Close
        store={store}
        className={cn(
          "absolute top-4 right-4 cursor-pointer rounded-sm",
          "opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none",
          "dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
          "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
        )}
      >
        <X width={15} height={15} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  );
};

const Close = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return (
    <DialogPrimitive.Close store={store} className={props.className}>
      {props.children}
    </DialogPrimitive.Close>
  );
};

const Header = (props: {} & React.AllHTMLAttributes<HTMLElement>) => {
  return (
    <DialogPrimitive.Header className={cn("flex flex-col space-y-2 text-center sm:text-left", props.className)}>
      {props.children}
    </DialogPrimitive.Header>
  );
};

const Footer = (props: {} & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { className } = props;
  // const c = children(() => props.children);
  return (
    <DialogPrimitive.Footer className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {props.children}
    </DialogPrimitive.Footer>
  );
};

const Title = (props: {} & React.AllHTMLAttributes<HTMLElement>) => {
  // const { title } = props;
  return (
    <DialogPrimitive.Title className={cn("text-lg font-semibold text-slate-900", "dark:text-slate-50")}>
      {props.children}
    </DialogPrimitive.Title>
  );
};

const Submit = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLButtonElement>) => {
  const { store } = props;

  return <Button store={store.okBtn}>{props.children}</Button>;
};

const Cancel = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLButtonElement>) => {
  const { store } = props;

  return <Button store={store.cancelBtn}>{props.children}</Button>;
};

export { Root, Portal, Header, Title, Content, Close, Overlay, Footer, Submit, Cancel };
