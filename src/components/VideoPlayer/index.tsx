/**
 * @file 视频播放器
 */

import {
  forwardRef,
  SyntheticEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
// import Hls2 from "hls.js";

import { Player } from "@/domains/player";
import { system } from "@/store/system";

type VideoSettings = {
  volume: number;
  auto_play_next_episode: boolean;
};
let mounted = false;

interface IProps {
  className?: string;
  videoClassName?: string;
  /** 用来控制视频播放的核心类 */
  core: Player;
  /** 视频播放地址 */
  url: string;
  /** 视频宽度 */
  width: number;
  /** 视频高度 */
  height: number;
  poster?: string;
  current_time?: number;
  /** 播放过程中的回调，每 30s 调用一次 */
  on_progress?: (data: {
    current_time: number;
    duration: number;
    progress: number;
  }) => void;
  /** 播放结束时的回调 */
  on_end?: () => void;
}
const _VideoPlayer: React.ForwardRefRenderFunction<unknown, IProps> = (
  props,
  ref
) => {
  const {
    className,
    videoClassName,
    url,
    core,
    width,
    height,
    poster,
    current_time = 0,
    on_progress: onProgress,
    on_end: onEnd,
  } = props;
  // console.log("[]() url ", url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const duration_ref = useRef(0);
  const settings_ref = useRef<Partial<{ volume: number }>>({});
  const [canControls, setCanControls] = useState(true);

  const h = (height / width) * system.screen.width;
  console.log(
    "[COMPONENT]VideoPlayer - render",
    width,
    height,
    system.screen.width,
    h
  );

  const cur_time_ref = useRef(current_time);
  useEffect(() => {
    cur_time_ref.current = current_time;
  }, [current_time]);

  useEffect(() => {
    if (!url) {
      return;
    }
    const $video = videoRef.current;
    if ($video === null) {
      return;
    }
    (async () => {
      const mod = await import(/* webpackChunkName: "hls" */ "hls.js");
      const Hls2 = mod.default;
      $video.currentTime = cur_time_ref.current;
      if (Hls2.isSupported() && url.includes("m3u8")) {
        console.log("[PAGE]playing - using hls.js");
        const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
        Hls.detachMedia();
        Hls.attachMedia($video);
        Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
          Hls.loadSource(url);
        });
      } else {
        $video.src = url;
        $video.load();
      }
      $video.oncanplay = async () => {
        // setCanControls(true);
      };
    })();
  }, [url]);

  useImperativeHandle(ref, () => {
    return {
      play: () => {
        if (videoRef.current === null) {
          return;
        }
        videoRef.current.play();
      },
    };
  });

  return (
    <div className={className}>
      {/* <img className="w-full" src={poster} /> */}
      <video
        className={videoClassName}
        ref={videoRef}
        controls={canControls}
        webkit-playsinline="true"
        playsInline
        preload="auto"
        width="100%"
        height={h}
        poster={poster}
        onCanPlay={(event: SyntheticEvent<HTMLVideoElement>) => {
          const { duration } = event.currentTarget as HTMLVideoElement;
          // console.log("[]on canPlay", duration);
          // videoRef.current?.play();
          duration_ref.current = duration;
        }}
        onTimeUpdate={(event: SyntheticEvent<HTMLVideoElement>) => {
          const { currentTime } = event.currentTarget as HTMLVideoElement;
          if (duration_ref.current === 0) {
            return;
          }
          const progress = currentTime / duration_ref.current;
          // console.log("[COMPONENT]VideoPlayer - on time update", progress);
          if (onProgress) {
            onProgress({
              current_time: currentTime,
              duration: duration_ref.current,
              progress,
            });
          }
        }}
        onEnded={() => {
          if (onEnd) {
            onEnd();
          }
        }}
        onVolumeChange={() => {
          const $video = videoRef.current;
          if ($video === null) {
            return;
          }
          const cur_volume = $video.volume;
          settings_ref.current.volume = cur_volume;
          localStorage.setItem(
            "video_settings",
            JSON.stringify(settings_ref.current)
          );
        }}
      >
        您的浏览器不支持Video标签。
        {/* <track kind="subtitles" src="/subtitle.vtt" srcLang="zh-cn"></track> */}
      </video>
    </div>
  );
};

export const VideoPlayer = forwardRef(_VideoPlayer);
