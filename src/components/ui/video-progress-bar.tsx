import { PlayerCore } from "@/domains/player";
import { useInitialize } from "@/hooks";
import { seconds_to_hour } from "@/utils";
import React, { useEffect, useRef, useState } from "react";

export const PlayerProgressBar = React.memo((props: { store: PlayerCore }) => {
  const { store } = props;

  const isDragRef = useRef(false);
  const rectRef = useRef({ width: 0, left: 0 });
  const [progress, setProgress] = useState(store._progress);
  const [times, setTimes] = useState({
    currentTime: seconds_to_hour(store._currentTime),
    duration: seconds_to_hour(store._duration),
  });

  useInitialize(() => {
    store.onCurrentTimeChange((v) => {
      setProgress(v.currentTime);
    });
    store.onProgress((v) => {
      setProgress(v.progress);
      setTimes({
        currentTime: seconds_to_hour(v.currentTime),
        duration: seconds_to_hour(v.duration),
      });
    });
  });
  useEffect(() => {
    const handlerTouchMove = (event: TouchEvent) => {
      event.stopPropagation();
      if (isDragRef.current === false) {
        return;
      }
      const { clientX } = event.touches[0];
      console.log("[COMPONENT]handlerTouchMove", clientX);
      updateProgressBar({ clientX });
    };
    const handlerTouchEnd = (event: TouchEvent) => {
      event.stopPropagation();
      console.log("[COMPONENT]handlerTouchEnd");
      isDragRef.current = false;
    };
    //     document.addEventListener("touchmove", handlerTouchMove);
    //     document.addEventListener("touchend", handlerTouchEnd);
    //     return () => {
    //       document.removeEventListener("touchmove", handlerTouchMove);
    //       document.removeEventListener("touchend", handlerTouchEnd);
    //     };
  }, []);

  const updateProgressBar = (touch: { clientX: number }) => {
    //     const rect = progressContainer.getBoundingClientRect();
    const rect = rectRef.current;
    const progress = (touch.clientX - rect.left) / rect.width;
    const clampedProgress = Math.min(1, Math.max(0, progress));
    store.adjustProgressManually(clampedProgress);
    setProgress(clampedProgress * 100);
  };

  return (
    <div className="flex items-center user-select-none">
      <div className="text-sm">{times.currentTime}</div>
      <div
        className="__a mx-4 w-full bg-gray-300 cursor-pointer rounded-md overflow-hidden"
        onAnimationEnd={(event) => {
          const { currentTarget: target } = event;
          const client = target.getBoundingClientRect();
          rectRef.current = {
            width: client.width,
            left: client.left,
          };
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          console.log("[COMPONENT]onTouchStart");
          const { touches } = event;
          isDragRef.current = true;
          store.startAdjustCurrentTime();
          store.pause();
          updateProgressBar({ clientX: touches[0].clientX });
        }}
        onTouchMove={(event) => {
          event.stopPropagation();
          if (isDragRef.current === false) {
            return;
          }
          const { clientX } = event.touches[0];
          console.log("[COMPONENT]onTouchMove", clientX);
          updateProgressBar({ clientX });
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          console.log("[COMPONENT]onTouchEnd");
          isDragRef.current = false;
          store.adjustCurrentTime(store.virtualProgress * store._duration);
        }}
      >
        <div className="h-[4px] bg-green-500" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="text-sm">{times.duration}</div>
    </div>
  );
});
