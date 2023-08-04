/**
 * @file 可滚动容器，支持下拉刷新、滚动监听等
 */
import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";
import { connect } from "@/domains/ui/scroll-view/connect.web";

export const ScrollView = React.memo(
  (props: { store: ScrollViewCore; className?: string; style?: React.CSSProperties; children: React.ReactElement }) => {
    const { store, className, style = {}, children, ...restProps } = props;

    const ref = useRef<HTMLDivElement>(null);
    const [state, setState] = useState(store.state);

    useInitialize(() => {
      store.onStateChange((nextState) => {
        setState(nextState);
      });
    });

    const options = {
      pending: () => null,
      pulling: () => (
        <div className="flex items-center justify-center space-x-2">
          <ArrowDown width={18} height={18} />
          <div>下拉刷新</div>
        </div>
      ),
      releasing: () => (
        <div className="flex items-center justify-center space-x-2">
          <ArrowUp width={18} height={18} />
          <div>松手刷新</div>
        </div>
      ),
      refreshing: () => (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="animate animate-spin" width={18} height={18} />
          <div>正在刷新</div>
        </div>
      ),
    };
    //   const step = () => state().step;
    const { step } = state;
    const Component = options[step];

    return (
      <Root className={cn("overflow-hidden absolute inset-0 w-full h-full", className)} style={style} {...restProps}>
        <Indicator store={store}>
          <div className="flex items-center justify-center h-[80px]">
            <Component />
          </div>
        </Indicator>
        <Content store={store} className="absolute inset-0 max-h-screen overflow-y-auto hide-scroll">
          {children}
        </Content>
      </Root>
    );
  }
);

const Root = (props: { className?: string; style: React.CSSProperties; children: React.ReactNode }) => {
  const { className, style, children, ...restProps } = props;
  return (
    <div className={className} style={style} {...restProps}>
      {children}
    </div>
  );
};
const Indicator = (props: { store: ScrollViewCore; children: React.ReactElement }) => {
  const { store } = props;
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
    store.enablePullToRefresh();
  });
  //   const top = () => state().top - 60;
  const top = state.top - 60;

  return (
    <div
      style={{
        transform: `translateY(${top}px)`,
      }}
    >
      {props.children}
    </div>
  );
};
const Content = (props: { store: ScrollViewCore; className?: string; children: React.ReactElement }) => {
  const { store } = props;
  //   let $page: HTMLDivElement;
  const $page = useRef<HTMLDivElement>(null);

  const [state, setState] = useState(store.state);

  useEffect(() => {
    const $container = $page.current;
    if (!$container) {
      return;
    }
    connect(store, $container);
  }, []);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
    if ($page.current === null) {
      return;
    }
    const { clientWidth, clientHeight, scrollHeight } = $page.current;
    store.setRect({
      width: clientWidth,
      height: clientHeight,
      contentHeight: scrollHeight,
    });
  });

  //   const top = () => state().top;
  const { top } = state;

  return (
    <div
      ref={$page}
      className={props.className}
      style={{ transform: `translateY(${top}px)` }}
      onTouchStart={(event) => {
        // console.log('start');
        const { pageX, pageY } = event.touches[0];
        const position = { x: pageX, y: pageY };
        store.startPull(position);
      }}
      onTouchMove={(event) => {
        // console.log("move");
        const { pageX, pageY } = event.touches[0];
        const position = {
          x: pageX,
          y: pageY,
        };
        store.pulling(position);
      }}
      onTouchEnd={() => {
        store.endPulling();
      }}
      onScroll={(event) => {
        store.setRect({
          contentHeight: $page.current?.scrollHeight,
        });
        store.scroll({
          scrollTop: event.currentTarget.scrollTop,
        });
      }}
    >
      {props.children}
    </div>
  );
};

export { Root, Indicator, Content };
