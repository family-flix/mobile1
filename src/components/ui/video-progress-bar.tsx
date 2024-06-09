import React, { useEffect, useRef, useState } from "react";

import { useInstance } from "@/hooks/index";
import { Portal } from "@/packages/ui/portal";
import { Presence } from "@/components/ui/presence";
import { Handler, base } from "@/domains/base";
import { PlayerCore } from "@/domains/player/index";
import { PresenceCore } from "@/domains/ui/index";
import { seconds_to_hour } from "@/utils/index";

const cursorWidth = 6;

function VideoProgressBarComponent(props: { store: PlayerCore }) {
  const { store } = props;

  const isDragRef = {
    current: false,
  };
  const cursorRef = {
    current: null as null | HTMLDivElement,
  };
  const barRef = {
    current: null as null | HTMLDivElement,
  };
  const movingRef = {
    current: false,
  };
  const rectRef = {
    current: { width: 0, left: 0 },
  };
  const targetTimeRef = {
    current: null as null | HTMLDivElement,
  };
  const tmpCurRef = {
    current: 0,
  };
  const touchStartTimeRef = {
    current: 0,
  };
  const timerRef = {
    current: null as null | NodeJS.Timer,
  };
  const hasShowRef = {
    current: false,
  };
  const startXRef = {
    current: 0,
  };
  const curRef = {
    current: 0,
  };
  const leftRef = {
    current: -6,
  };
  const $time = new PresenceCore();
  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: {
      currentTime: string;
      duration: string;
    };
  };
  const emitter = base<TheTypesOfEvents>();

  return {
    $time,
    leftRef,
    barRef,
    cursorRef,
    targetTimeRef,
    handleTouchStart(event: {
      clientX?: number;
      touches?: Record<number, { clientX: number }>;
      stopPropagation: () => void;
    }) {
      event.stopPropagation();
      console.log("[COMPONENT]onTouchStart");
      const finger = (() => {
        if (event.touches) {
          return event.touches[0];
        }
        return {
          clientX: event.clientX || 0,
        };
      })();
      isDragRef.current = true;
      movingRef.current = true;
      store.startAdjustCurrentTime();
      store.pause();
      const startX = finger.clientX;
      const rect = rectRef.current;
      const cur = startX - rect.left;
      const posX = finger.clientX - rect.left;
      // const percent = posX / rect.width;
      startXRef.current = startX;
      curRef.current = cur;
      touchStartTimeRef.current = new Date().valueOf();
      timerRef.current = setTimeout(function () {
        if (timerRef.current !== null) {
          isDragRef.current = true;
          movingRef.current = true;
          if (!hasShowRef.current) {
            hasShowRef.current = true;
            $time.show();
          }
          curRef.current = posX;
        }
      }, 200);
      const $bar = barRef.current;
      const $cursor = cursorRef.current;
      if ($bar) {
        $bar.style.width = posX + "px";
      }
      if ($cursor) {
        leftRef.current = posX - cursorWidth;
        $cursor.style.left = posX - cursorWidth + "px";
      }
    },
    handleTouchMove(event: {
      clientX?: number;
      touches?: Record<number, { clientX: number }>;
      stopPropagation: () => void;
    }) {
      event.stopPropagation();
      if (isDragRef.current === false) {
        return;
      }
      const finger = (() => {
        if (event.touches) {
          return event.touches[0];
        }
        return {
          clientX: event.clientX || 0,
        };
      })();
      const distance = finger.clientX - startXRef.current + curRef.current;
      const rect = rectRef.current;
      // isDragRef.current = true;
      if (distance < 0) {
        return;
      }
      if (distance > rect.width) {
        return;
      }
      const posX = finger.clientX - rect.left;
      const percent = posX / rect.width;
      tmpCurRef.current = distance;
      const $bar = barRef.current;
      const $cursor = cursorRef.current;
      if ($bar) {
        $bar.style.width = posX + "px";
      }
      if ($cursor) {
        leftRef.current = posX - cursorWidth;
        $cursor.style.left = posX - cursorWidth + "px";
      }
      const text = seconds_to_hour(percent * store._duration);
      const $target = targetTimeRef.current;
      console.log("----- $target", $target);
      if ($target) {
        $target.innerText = `${text}/${seconds_to_hour(store._duration)}`;
      }
    },
    handleTouchEnd(event: { stopPropagation: () => void }) {
      event.stopPropagation();
      isDragRef.current = false;
      movingRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current as any as number);
        timerRef.current = null;
      }
      const now = new Date().valueOf();
      if (now - touchStartTimeRef.current <= 200) {
        const percent = curRef.current / rectRef.current.width;
        // console.log("the reason is click", curRef.current);
        const targetTime = percent * store._duration;
        store.adjustCurrentTime(targetTime);
        return;
      }
      if (hasShowRef.current) {
        $time.hide();
        hasShowRef.current = false;
      }
      curRef.current = tmpCurRef.current;
      const percent = curRef.current / rectRef.current.width;
      const targetTime = percent * store._duration;
      // console.log("before store.adjustCurrentTime", targetTime, percent, store._duration);
      store.adjustCurrentTime(targetTime);
    },
    handleAnimationEnd(event: { currentTarget: HTMLDivElement }) {
      const { currentTarget: target } = event;
      const client = target.getBoundingClientRect();
      rectRef.current = {
        width: client.width,
        left: client.left,
      };
      const percent = (store.currentTime / store._duration) * client.width;
      const $bar = barRef.current;
      const $cursor = cursorRef.current;
      if ($bar) {
        $bar.style.width = percent + "px";
      }
      if ($cursor) {
        $cursor.style.left = percent - cursorWidth + "px";
      }
    },
    ready() {
      const unlisten1 = store.onProgress((v) => {
        const rect = rectRef.current;
        if (rect && rect.width) {
          const percent = Math.floor((store.currentTime / store._duration) * rect.width);
          const $bar = barRef.current;
          const $cursor = cursorRef.current;
          if ($bar) {
            $bar.style.width = percent + "px";
          }
          if ($cursor) {
            $cursor.style.left = percent - cursorWidth + "px";
          }
        }
        emitter.emit(Events.Change, {
          currentTime: seconds_to_hour(v.currentTime),
          duration: seconds_to_hour(v.duration),
        });
      });
      function update() {
        const rect = rectRef.current;
        if (!rect) {
          return;
        }
        const percent = (store.currentTime / store._duration) * rect.width;
        const $bar = barRef.current;
        const $cursor = cursorRef.current;
        if ($bar) {
          $bar.style.width = percent + "px";
        }
        if ($cursor) {
          $cursor.style.left = percent - cursorWidth + "px";
        }
        emitter.emit(Events.Change, {
          currentTime: seconds_to_hour(store.currentTime),
          duration: seconds_to_hour(store._duration),
        });
      }
      const unlisten2 = store.onCanPlay(() => {
        update();
      });
      update();
      return () => {
        unlisten1();
        unlisten2();
      };
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return emitter.on(Events.Change, handler);
    },
  };
}

export const PlayerProgressBar = React.memo((props: { store: PlayerCore }) => {
  const { store } = props;

  const $com = useInstance(() => VideoProgressBarComponent({ store }));
  const cursorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const targetTimeRef = useRef<HTMLDivElement>(null);
  const [times, setTimes] = useState({
    currentTime: seconds_to_hour(store._currentTime),
    duration: seconds_to_hour(store._duration),
  });

  useEffect(() => {
    $com.barRef.current = barRef.current;
    $com.cursorRef.current = cursorRef.current;
    $com.targetTimeRef.current = targetTimeRef.current;
    $com.onChange((v) => setTimes(v));
    const unlisten = $com.ready();
    return unlisten;
  }, []);

  return (
    <>
      <div
        className="flex items-center user-select-none"
        onTouchStart={$com.handleTouchStart}
        onTouchMove={$com.handleTouchMove}
        onTouchEnd={$com.handleTouchEnd}
        onMouseDown={$com.handleTouchStart}
        onMouseMove={$com.handleTouchMove}
        onMouseUp={$com.handleTouchEnd}
      >
        <div className="w-[72px] text-sm">{times.currentTime}</div>
        <div
          className="__a relative mx-4 w-full bg-gray-300 cursor-pointer rounded-md"
          onAnimationEnd={$com.handleAnimationEnd}
        >
          <div
            className="progress__mask absolute top-1/2 left-0 w-full h-[4px] bg-w-fg-3 rounded-sm"
            style={{ transform: "translateY(-50%)" }}
          ></div>
          <div
            ref={barRef}
            className="progress__bar absolute top-1/2 left-0 bg-green-500"
            style={{ width: 0, height: 4, transform: "translateY(-50%)" }}
          ></div>
          <div
            ref={cursorRef}
            className="progress__cursor absolute top-1/2"
            style={{
              left: $com.leftRef.current,
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#fff",
              transform: "translate(0px, -50%)",
            }}
          ></div>
        </div>
        <div className="text-sm">{times.duration}</div>
      </div>
      <Portal>
        <Presence store={$com.$time}>
          <div
            className="z-10 fixed toast p-4 top-[32%] left-1/2 w-[240px] rounded-md"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div
              className="z-0 absolute top-0 left-0 w-full h-full rounded-md"
              style={{ backgroundColor: "#000", opacity: 0.8 }}
            ></div>
            <div className="z-10 relative">
              <div
                ref={targetTimeRef}
                className="__a w-full h-[36px] text-md text-w-bg-0 text-center dark:text-w-fg-0"
                style={{ fontSize: 24 }}
                onAnimationEnd={(event) => {
                  $com.targetTimeRef.current = event.currentTarget;
                }}
              ></div>
            </div>
          </div>
        </Presence>
      </Portal>
    </>
  );
});
