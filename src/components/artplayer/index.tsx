/**
 * @file 播放器
 */
import React, { useEffect, useRef, useState } from "react";

import { useInitialize } from "@/hooks/index";
import { PlayerCore } from "@/domains/player";
import { connect } from "@/domains/player/connect.artplayer";

export const Video = React.memo((props: { store: PlayerCore }) => {
  const { store } = props;

  const videoRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((v) => setState(v));
  });
  useEffect(() => {
    const $video = videoRef.current;
    if (!$video) {
      return;
    }
    connect($video, store);
  }, []);

  const { width, height, ready, poster, subtitle, prepareFullscreen } = state;

  // console.log("[COMPONENT]Video - render", width, height, poster);

  return (
    <div
      id="video"
      ref={videoRef}
      className="video transition-all"
      style={{
        width,
        height,
        overflow: "hidden",
        // backgroundColor: "red",
      }}
    ></div>
  );
});

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
