import { useState } from "react";

import { TabHeaderCore } from "@/domains/ui/tab-header";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

export const TabHeader = (props: { store: TabHeaderCore<any> }) => {
  const { store } = props;

  const [state, setState] = useState(store.state);
  const [left, setLeft] = useState<null | number>(store.left);

  const { tabs: options, current } = state;

  useInitialize(() => {});

  return (
    <div
      className={cn("__a tab-header w-full overflow-x-auto scroll--hidden")}
      //       style="{{style}}"
      onAnimationStart={(event) => {
        const { width, height, left } = event.currentTarget.getBoundingClientRect();
        store.onStateChange((v) => {
          setState(v);
        });
        store.onLinePositionChange((v) => {
          setLeft(v.left);
        });
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
                  "__a py-2 px-4 text-md text-w-fg-1 break-keep",
                  current === index ? "active-item-class" : ""
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
        {left !== null ? (
          <div
            className="absolute bottom-0 w-4 bg-w-brand transition-all"
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
};
