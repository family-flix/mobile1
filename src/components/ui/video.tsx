import { useEffect, useRef, useState } from "react";

import { PlayerCore } from "@/domains/player";
import { connect } from "@/domains/player/connect.web";
import { useInitialize } from "@/hooks";

export function Video(props: { store: PlayerCore }) {
  const { store } = props;

  const videoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState(store.state);
  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });
  useEffect(() => {
    const $video = videoRef.current;
    if ($video === null) {
      return;
    }
    connect($video, store);
  }, []);

  const { width, height, ready } = state;

  console.log("[COMPONENT]Video - render", width, height);

  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        // backgroundColor: "red",
      }}
    >
      <video
        ref={videoRef}
        className="w-full relative z-10"
        controls={true}
        webkit-playsinline="true"
        playsInline
        preload="none"
        height={height}
        style={{ opacity: ready ? "1" : "0" }}
        // width={}
        // x5-video-player-fullscreen="true"
        // x5-video-player-type="h5"
        // x5-video-orientation="landscape"
        // style={{ objectFit: "fill" }}
      />
    </div>
  );
}
