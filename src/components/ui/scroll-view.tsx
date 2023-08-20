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
  (props: {
    store: ScrollViewCore;
    wrapClassName?: string;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactElement;
  }) => {
    const { store, className, wrapClassName, style = {}, children, ...restProps } = props;

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
    const { step, pullToRefresh, scrollable } = state;
    const Component = options[step];

    return (
      <Root
        className={cn("overflow-hidden absolute z-80 inset-0 w-full h-full", className)}
        style={style}
        {...restProps}
      >
        {pullToRefresh && (
          <Indicator store={store}>
            <div className="flex items-center justify-center h-[80px]">
              <Component />
            </div>
          </Indicator>
        )}
        <div className={cn("z-10 absolute inset-0")}>
          <BackIndicator className="z-20 absolute left-0 bottom-[120px]" store={store} />
          <Content
            store={store}
            className={cn("max-h-full overflow-y-auto hide-scroll", scrollable ? "" : "")}
            style={(() => {
              if (scrollable) {
                return {};
              }
              return {
                overflow: "hidden",
              };
            })()}
          >
            {children}
          </Content>
        </div>
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

const BackIndicator = (props: { store: ScrollViewCore } & React.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  return (
    <div
      className={cn("h-48 return-prev-indicator", props.className)}
      style={{
        width: state.pullToBack.width,
        height: state.pullToBack.height,
      }}
    />
  );
};

const Content = (props: { store: ScrollViewCore } & React.HTMLAttributes<HTMLElement>) => {
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
  const { top, pullToRefresh } = state;

  return (
    <div
      ref={$page}
      className={props.className}
      style={{ ...(props.style || {}), transform: `translateY(${top}px)` }}
      onTouchStart={(event) => {
        if (!pullToRefresh) {
          return;
        }
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

// export { Root, Indicator, Content };
