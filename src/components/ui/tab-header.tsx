import { useEffect, useState } from "react";

import { TabHeaderCore } from "@/domains/ui/tab-header";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

export function TabHeader<T extends { key: "id"; options: { id: string; text: string; [x: string]: any }[] }>(props: {
  store: TabHeaderCore<T>;
}) {
  const { store } = props;

  const [state, setState] = useState(store.state);
  const [left, setLeft] = useState<null | number>(store.left);

  useInitialize(() => {
    store.onStateChange((v) => {
      setState(v);
    });
    store.onLinePositionChange((v) => {
      console.log("[COMPONENT]ui/tab-header - store.onLinePositionChange", left);
      setLeft(v.left);
    });
  });

  const { tabs: options, current } = state;

  console.log("[COMPONENT]ui/tab-header - render", left);

  return (
    <div
      className={cn("__a tab-header w-full overflow-x-auto scroll--hidden")}
      //       style="{{style}}"
      onAnimationStart={(event) => {
        const { width, height, left } = event.currentTarget.getBoundingClientRect();
        // store.onStateChange((v) => {
        //   setState(v);
        // });
        // store.onLinePositionChange((v) => {
        //   setLeft(v.left);
        // });
        store.updateContainerClient({ width, height, left });
      }}
    >
      <div
        className="relative border-bottom border-w-bg-3"
        // scroll-with-animation="{{scrollWithAnimation}}"
        // scroll-left="{{scrollLeftInset}}"
        // scroll-x
      >
        <div className="flex pl-1">
          {options.map((tab, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "__a py-2 px-4 break-keep text-md transition-all",
                  current === index ? "active-item-class" : "",
                  current === index ? "text-w-fg-0" : "text-w-fg-1"
                )}
                // style="{{current === index ? activeItemStyle : itemStyle}}"
                onClick={() => {
                  store.select(index);
                }}
                onAnimationStart={(event) => {
                  event.stopPropagation();
                  const { width, height, left } = event.currentTarget.getBoundingClientRect();
                  store.updateTabClient(index, { width, height, left });
                }}
              >
                {tab.text}
              </div>
            );
          })}
        </div>
        <div className="absolute z-0 bottom-0 w-full h-[1px] bg-w-bg-3" />
        {left !== null ? (
          <div
            className="absolute z-10 bottom-0 w-4 bg-w-brand transition-all"
            style={{
              left,
              height: 4,
              transform: "translateX(-50%)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
