/**
 * @file 可滚动容器，支持下拉刷新、滚动监听等
 */
import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronLeft, Loader2 } from "lucide-react";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";
import { connect } from "@/domains/ui/scroll-view/connect.web";

export const ScrollView = React.memo(
  (
    props: {
      store: ScrollViewCore;
      wrapClassName?: string;
      contentClassName?: string;
    } & React.HTMLAttributes<HTMLDivElement>
  ) => {
    const { store, className, contentClassName, wrapClassName, style = {}, children, ...restProps } = props;

    // const ref = useRef<HTMLDivElement>(null);
    const [state, setState] = useState(store.state);

    useInitialize(() => {
      store.onStateChange((nextState) => {
        setState(nextState);
      });
    });

    const options = {
      pending: () => null,
      pulling: () => (
        <div className="p-4 rounded-full bg-w-bg-0">
          <ArrowDown width={18} height={18} />
        </div>
      ),
      releasing: () => (
        <div className="p-4 rounded-full bg-w-bg-0">
          <Loader2 width={18} height={18} />
        </div>
      ),
      refreshing: () => (
        <div className="p-4 rounded-full bg-w-bg-0">
          <Loader2 className="animate animate-spin" width={18} height={18} />
        </div>
      ),
    };
    const { step, pullToRefresh, scrollable } = state;
    const Component = options[step];

    return (
      <Root
        className={cn("scroll-view overflow-hidden relative w-full h-full", className)}
        style={style}
        {...restProps}
      >
        <Indicator className="scroll-view__indicator w-full flex justify-center" store={store}>
          <Component />
        </Indicator>
        <Content
          store={store}
          className={cn(
            "scroll-view__content relative z-20 h-full overflow-y-auto scroll scroll--hidden",
            contentClassName
          )}
        >
          {children}
        </Content>
        {/* <div className="z-50 absolute left-0 bottom-[180px] flex items-center h-[200px]">
          <BackIndicator store={store}>
            <ChevronLeft className="w-6 h-6 text-w-bg-0 dark:text-w-fg-1" />
          </BackIndicator>
        </div> */}
      </Root>
    );
  }
);

const Root = React.memo((props: { className?: string; style: React.CSSProperties; children: React.ReactNode }) => {
  const { className, style, children, ...restProps } = props;
  return (
    <div className={className} style={style} {...restProps}>
      {children}
    </div>
  );
});

const Indicator = React.memo((props: { store: ScrollViewCore } & React.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
    store.enablePullToRefresh();
  });
  const top = state.top;
  // const opacity = top / 80;
  const opacity = 1;

  return (
    <div
      className={cn("scroll-view__loading", props.className)}
      style={{
        display: "flex",
        alignItems: "flex-end",
        // paddingBottom: top > 0 ? 10 : 0,
        height: top,
        opacity,
      }}
    >
      {props.children}
    </div>
  );
});

const BackIndicator = React.memo((props: { store: ScrollViewCore } & React.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  return (
    <div
      className={cn("scroll-view__back flex items-center justify-center h-48 text-w-fg-1", props.className)}
      style={{
        width: state.pullToBack.width,
        height: state.pullToBack.height,
      }}
    >
      {(() => {
        if (!state.pullToBack.canBack) {
          return null;
        }
        return props.children;
      })()}
    </div>
  );
});

const Content = React.memo((props: { store: ScrollViewCore } & React.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  //   let $page: HTMLDivElement;
  const $page = useRef<HTMLDivElement>(null);

  const [state, setState] = useState(store.state);
  // const [scrollable, setScrollable] = useState(store.scrollable);
  const [styles, setStyles] = useState<React.CSSProperties>({});

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
    store.onDisableScroll(() => {
      // setScrollable(false);
      setStyles({
        overflow: "hidden",
      });
    });
    store.onEnableScroll(() => {
      // setScrollable(true);
      setStyles({
        overflow: "auto",
      });
    });
    if ($page.current === null) {
      return;
    }
    const { clientWidth, clientHeight, scrollHeight } = $page.current;
    // console.log("[COMPONENT]ui/scroll-view - initialize", $page, $page.current.clientHeight);
    store.setRect({
      width: clientWidth,
      height: clientHeight,
      contentHeight: scrollHeight,
    });
  });

  const { top, pullToRefresh } = state;

  return (
    <div
      ref={$page}
      className={props.className}
      // style={(() => {
      //   const styles: React.CSSProperties = {
      //     ...(props.style || {}),
      //     overflow: "auto",
      //   };
      //   if (!scrollable) {
      //     styles.overflow = "hidden";
      //   }
      //   return styles;
      // })()}
      style={styles}
      onTouchStart={(event) => {
        const { pageX, pageY } = event.touches[0];
        const position = { x: pageX, y: pageY };
        if (pageX < 30) {
          setStyles({
            overflow: "hidden",
          });
        }
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
      onTouchEnd={(event) => {
        store.endPulling();
        setStyles({
          overflow: "auto",
        });
      }}
      onScroll={(event) => {
        const { scrollHeight, clientHeight } = event.currentTarget;
        let needUpdateRect = false;
        const nextRect: Partial<{
          height: number;
          contentHeight: number;
        }> = {};
        if (clientHeight !== store.rect.height) {
          nextRect.height = clientHeight;
          needUpdateRect = true;
        }
        if (scrollHeight !== store.rect.contentHeight) {
          nextRect.contentHeight = scrollHeight;
          needUpdateRect = true;
        }
        if (needUpdateRect) {
          store.setRect(nextRect);
        }
        store.handleScroll({
          scrollTop: event.currentTarget.scrollTop,
        });
      }}
      // onAnimationEnd={(event) => {
      //   const $page = event.currentTarget;
      //   connect(store, $page);
      //   const { clientWidth, clientHeight, scrollHeight } = $page;
      //   store.setRect({
      //     width: clientWidth,
      //     height: clientHeight,
      //     contentHeight: scrollHeight,
      //   });
      // }}
    >
      {props.children}
    </div>
  );
});

// export { Root, Indicator, Content };
