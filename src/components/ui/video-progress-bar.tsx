import React, { useEffect, useRef, useState } from "react";

import { PlayerCore } from "@/domains/player";
import { useInstance } from "@/hooks";
import { Portal } from "@/packages/ui/portal";
import { Presence } from "@/components/ui/presence";
import { PresenceCore } from "@/domains/ui";
import { seconds_to_hour } from "@/utils/index";

const cursorWidth = 6;

export const PlayerProgressBar = React.memo((props: { store: PlayerCore }) => {
  const { store } = props;

  const isDragRef = useRef(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const targetTimeRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef({ width: 0, left: 0 });
  const movingRef = useRef(false);
  const tmpCurRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timer | null>(null);
  const hasShowRef = useRef(false);
  const startXRef = useRef(0);
  const curRef = useRef(0);
  const leftRef = useRef(-6);
  const [times, setTimes] = useState({
    currentTime: seconds_to_hour(store._currentTime),
    duration: seconds_to_hour(store._duration),
  });
  const $time = useInstance(() => new PresenceCore());

  useEffect(() => {
    // console.log("[COMPONENT]VideoProgressBar - useInitialize");
    const unlisten1 = store.onProgress((v) => {
      const rect = rectRef.current;
      if (rect && rect.width) {
        const percent = Math.floor((store.currentTime / store._duration) * rect.width);
        const $bar = barRef.current;
        const $cursor = cursorRef.current;
        // console.log("width is change", percent);
        if ($bar) {
          $bar.style.width = percent + "px";
        }
        if ($cursor) {
          $cursor.style.left = percent - cursorWidth + "px";
        }
      }
      setTimes({
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
      setTimes({
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
  }, []);

  return (
    <>
      <div
        className="flex items-center user-select-none"
        onTouchStart={(event) => {
          event.stopPropagation();
          console.log("[COMPONENT]onTouchStart");
          const { touches } = event;
          const finger = touches[0];
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
              console.log("long press");
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
          // updateProgressBar({ clientX: touches[0].clientX });
        }}
        onTouchMove={(event) => {
          event.stopPropagation();
          if (isDragRef.current === false) {
            return;
          }
          const finger = event.touches[0];
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
          if ($target) {
            $target.innerText = `${text}/${seconds_to_hour(store._duration)}`;
          }
          // const { clientX } = event.touches[0];
          // console.log("[COMPONENT]onTouchMove", clientX);
          // updateProgressBar({ clientX });
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          isDragRef.current = false;
          movingRef.current = false;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
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
        }}
        // onAnimationEnd={(event) => {
        //   const $dom = event.currentTarget;
        //   $dom.addEventListener("touchstart", (e) => {
        //     e.stopPropagation();
        //   });
        //   $dom.addEventListener("touchmove", (e) => {
        //     e.stopPropagation();
        //   });
        // }}
      >
        <div className="w-[72px] text-sm">{times.currentTime}</div>
        <div
          className="__a relative mx-4 w-full bg-gray-300 cursor-pointer rounded-md"
          onAnimationEnd={(event) => {
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
          }}
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
              left: leftRef.current,
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
        <Presence store={$time}>
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
                className="w-full h-[36px] text-md text-w-bg-0 text-center dark:text-w-fg-0"
                style={{ fontSize: 24 }}
              ></div>
            </div>
          </div>
        </Presence>
      </Portal>
    </>
  );
});
