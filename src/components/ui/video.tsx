import React, { useEffect, useRef, useState } from "react";

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
    store.onSourceLoaded(() => {
      const $video = videoRef.current;
      if ($video === null) {
        return;
      }
      console.log("[COMPONENT]video - store.onSourceLoaded", $video.width, $video.height);
    });
  });
  useEffect(() => {
    const $video = videoRef.current;
    if ($video === null) {
      return;
    }
    store.setMounted();
    connect($video, store);
  }, []);

  const { width, height, ready, poster, subtitle } = state;

  // console.log("[COMPONENT]Video - render", width, height, poster);

  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        // backgroundColor: "red",
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
      }}
      onTouchMove={(event) => {
        event.stopPropagation();
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
      }}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full relative z-10"
        controls={true}
        webkit-playsinline="true"
        playsInline
        preload="none"
        height={height}
      >
        {subtitle ? (
          <track src={subtitle.src} kind="subtitles" label={subtitle.label} srcLang={subtitle.lang}></track>
        ) : null}
      </video>
    </div>
  );
}

function VideoTrack(props: { store: PlayerCore } & React.TrackHTMLAttributes<HTMLTrackElement>) {
  const { store, src, kind, label, srcLang } = props;

  const ref = useRef<HTMLTrackElement | null>(null);

  // useInitialize(() => {
  //   const $track = ref.current;
  //   if (!$track) {
  //     return;
  //   }
  // });

  return <track ref={ref} src={src} kind={kind} label={label} srcLang={srcLang}></track>;
}
