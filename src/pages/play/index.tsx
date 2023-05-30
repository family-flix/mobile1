/**
 * @file 视频播放页面
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowLeft,
  Gauge,
  Glasses,
  List,
  Loader,
  MoreHorizontal,
  Pause,
  Play,
  RotateCw,
} from "lucide-react";

import { cn } from "@/utils";
import { TVCore } from "@/domains/tv";
import { PlayerCore } from "@/domains/player";
import { Sheet } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ElementCore } from "@/domains/ui/element";
import { connect } from "@/domains/player/connect.web";
import { EpisodeResolutionTypes } from "@/domains/tv/constants";
import { Element } from "@/components/ui/element";
import { useInitialize } from "@/hooks";
import { ViewComponent } from "@/types";
import { DialogCore } from "@/domains/ui/dialog";

const tv = new TVCore();
const player = new PlayerCore();
const video = new ElementCore({});
const aSheet = new DialogCore({});
const bSheet = new DialogCore();
const cSheet = new DialogCore();
const dSheet = new DialogCore();

export const TVPlayingPage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState(tv.profile);
  const [source, setSource] = useState(tv.curSource);

  useInitialize(() => {
    (async () => {
      view.onHidden(() => {
        player.pause();
      });
      view.onShow(() => {
        // 异常情况，现在返回后，页面不销毁
        if (!view.state.visible) {
          return;
        }
        // 锁屏后 currentTime 不是锁屏前的
        player.setCurrentTime(player.currentTime);
      });
      video.onMounted(() => {
        const $video = videoRef.current;
        if (!$video) {
          return;
        }
        connect($video, player);
      });
      tv.onProfileLoaded((profile) => {
        app.setTitle(tv.getTitle().join(" - "));
        const { curEpisode } = profile;
        tv.playEpisode(curEpisode);
      });
      tv.onEpisodeChange((nextEpisode) => {
        app.setTitle(tv.getTitle().join(" - "));
        const { currentTime } = nextEpisode;
        player.setCurrentTime(currentTime);
        player.pause();
      });
      tv.onStateChange((nextProfile) => {
        setProfile(nextProfile);
      });
      tv.onSourceChange((mediaSource) => {
        // player.setCurrentTime(tv.curEpisode?.currentTime ?? 0);
        // app.setTitle(tv.getTitle().join(" - "));
        const { width, height } = mediaSource;
        const h = Math.ceil((height / width) * app.size.width);
        // player.setResolution(values.resolution);
        player.pause();
        player.loadSource(mediaSource);
        player.setSize({
          width,
          height: h,
        });
        setSource(mediaSource);
      });
      tv.onTip((msg) => {
        alert(msg.text.join("\n"));
        app.tip(msg);
      });
      // tv.onResolutionChange((values: { resolution: { type: EpisodeResolutionTypes; text: string } }) => {
      //   player.setResolution(values.resolution);
      //   player.pause();
      // });
      // player.onCanPlay(() => {
      //   player.play();
      // });
      player.onProgress(({ currentTime, duration }) => {
        // console.log("[PAGE]TVPlaying - onProgress", currentTime);
        tv.updatePlayProgress({
          currentTime,
          duration,
        });
      });
      player.onPause(({ currentTime, duration }) => {
        tv.updatePlayProgress({
          currentTime,
          duration,
        });
      });
      player.onEnd(() => {
        // console.log("[PAGE]TVPlaying - onEnd");
        tv.playNextEpisode();
      });
      player.onVolumeChange(({ volume }) => {
        console.log("[]onVolumeChange", volume);
        // settings.volume = volume;
        // cache.set("video_settings", settings);
      });
      player.onSizeChange(({ height }) => {
        // console.log("[COMPONENT]VideoPlayer - size change", height);
        // setSize((prev) => {
        //   return {
        //     ...prev,
        //     height,
        //   };
        // });
      });
      player.onResolutionChange(({ type }) => {
        // settings.resolution = type;
        // app.cache.set("video_settings", settings);
      });
      player.onSourceLoaded(() => {
        console.log("[COMPONENT]VideoPlayer - on loaded", tv.currentTime);
        player.setCurrentTime(tv.currentTime);
      });
      player.onUrlChange(async ({ url, thumbnail }) => {
        console.log("[COMPONENT]VideoPlayer - on url change", url);
        const $video = videoRef.current;
        if (!$video) {
          return;
        }
        // setPoster(thumbnail);
        if ($video.canPlayType("application/vnd.apple.mpegurl")) {
          $video.src = url;
          $video.load();
          return;
        }
        const mod = await import("hls.js");
        const Hls2 = mod.default;
        if (Hls2.isSupported() && url.includes("m3u8")) {
          // console.log("[PAGE]TVPlaying - need using hls.js");
          const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
          Hls.attachMedia($video);
          Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
            Hls.loadSource(url);
          });
          return;
        }
        $video.src = url;
        $video.load();
      });
      //
      console.log("fetch profile", view.params.id);
      tv.fetchProfile(view.params.id);
    })();
  });

  // console.log("[PAGE]TVPlayingPage - render", tvId);

  // if (error) {
  //   return (
  //     <div className="w-full h-[100vh]">
  //       <div className="center text-center">{error}</div>
  //     </div>
  //   );
  // }

  return (
    <div className="tv__video">
      {(() => {
        return (
          <>
            <div className="operations overflow-hidden relative ws-screen h-screen">
              {/* <div
                className={cn(
                  show_menus ? "hidden" : "block",
                  "absolute inset-0"
                )}
                onClick={toggleMenuVisible}
              /> */}
              <div
                className={cn(
                  // show_menus ? "block" : "hidden",
                  "absolute inset-0"
                )}
                // onClick={toggleMenuVisible}
              >
                <div
                  className="p-4"
                  onClick={() => {
                    router.back();
                  }}
                >
                  <ArrowLeft className="w-8 h-8" />
                </div>
                <div className="absolute bottom-12 w-full">
                  {/* <div className="flex items-center w-36 m-auto">
                      <p className="text-2xl ">
                        {values.target_time}
                      </p>
                      <p className="mx-2 text-2xl ">
                        /
                      </p>
                      <p className="text-2xl ">
                        {values.duration}
                      </p>
                    </div> */}
                  {/* <div
                      className="flex items-center mt-4 px-4"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <p className="mr-2 ">
                        {values.current_time}
                      </p>
                      <Slider
                        className=""
                        value={[target_progress]}
                        step={1}
                        max={100}
                        onValueChange={(v) => {
                          set_target_progress(v[0]);
                          player_ref.current.set_target_progress(v[0]);
                        }}
                        onValueCommit={() => {
                          player_ref.current.commit_target_progress();
                          hide_menus();
                        }}
                      />
                      <p className="ml-4 ">
                        {values.duration}
                      </p>
                    </div> */}
                  <div className="grid grid-cols-3 gap-4 mt-18">
                    <div
                      className="flex flex-col items-center"
                      onClick={async () => {
                        tv.playPrevEpisode();
                      }}
                    >
                      <ArrowBigLeft className="w-8 h-8" />
                      <p className="mt-2 text-sm">上一集</p>
                    </div>
                    <div className="flex flex-col items-center"></div>
                    <div
                      className="flex flex-col items-center"
                      onClick={() => {
                        tv.playNextEpisode();
                      }}
                    >
                      <ArrowBigRight className="w-8 h-8 " />
                      <p className="mt-2 text-sm ">下一集</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-12 w-full px-2">
                    <div
                      className="flex flex-col items-center"
                      onClick={() => {
                        aSheet.show();
                      }}
                    >
                      <List className="w-6 h-6 " />
                      <p className="mt-2 text-sm ">选集</p>
                    </div>
                    <div
                      className="flex flex-col items-center"
                      onClick={() => {
                        bSheet.show();
                      }}
                    >
                      <Gauge className="w-6 h-6 " />
                      <p className="mt-2 text-sm ">倍速</p>
                    </div>
                    <div
                      className="flex flex-col items-center"
                      onClick={() => {
                        cSheet.show();
                      }}
                    >
                      <Glasses className="w-6 h-6 " />
                      <p className="mt-2 text-sm ">分辨率</p>
                    </div>
                    <div
                      className="flex flex-col items-center focus:outline-none focus:ring-0"
                      onClick={() => {
                        cSheet.show();
                      }}
                    >
                      <MoreHorizontal className="w-6 h-6 " />
                      <p className="mt-2 text-sm ">更多</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="video absolute z-20 w-full top-32">
              {(() => {
                if (profile === null || profile.curEpisode === null) {
                  return null;
                }
                return (
                  <Element store={video}>
                    <video
                      ref={videoRef}
                      className="w-full"
                      controls={true}
                      webkit-playsinline="true"
                      playsInline
                      preload="none"
                      // x5-video-player-fullscreen="true"
                      // x5-video-player-type="h5"
                      // x5-video-orientation="landscape"
                      // style={{ objectFit: "fill" }}
                    />
                  </Element>
                );
              })()}
              {/* <div className={cn("absolute inset-0")}>
                  <div
                    className={cn(
                      show_menus ? "hidden" : "block",
                      "absolute inset-0"
                    )}
                    onClick={toggle_menu_visible}
                  />
                  <div
                    className={cn(
                      show_menus ? "block" : "hidden",
                      "absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"
                    )}
                    onClick={toggle_menu_visible}
                  >
                    {values.playing ? (
                      <div className="p4">
                        <Pause
                          className="w-16 h-16 "
                          onClick={async () => {
                            await player_ref.current.pause();
                            set_values(player_ref.current.values);
                            toggle_menu_visible();
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="absolute p-2 z-10 inset-0 rounded-full bg-black opacity-50" />
                        <Play
                          className="relative z-20 left-1 w-16 h-16 "
                          onClick={async () => {
                            await player_ref.current.play();
                            set_values(player_ref.current.values);
                            set_show_menus(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div> */}
            </div>
          </>
        );
      })()}
      <Sheet store={aSheet}>
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { seasons, curEpisodes } = profile;
          const episodes_elm = (
            <div className="">
              {curEpisodes.map((episode) => {
                const { id, name, overview, episode: episode_number } = episode;
                return (
                  <div
                    key={id}
                    onClick={() => {
                      tv.playEpisode(episode);
                    }}
                  >
                    <div
                      className={cn("p-4 rounded cursor-pointer", profile.curEpisode.id === id ? "bg-slate-500" : "")}
                    >
                      <div>{name || episode_number}</div>
                      <div className="text-sm">{overview}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
          if (seasons.length === 1) {
            return <div className="overflow-y-auto mt-8 pb-12 h-full">{episodes_elm}</div>;
          }
          return (
            <Tabs defaultValue="episode" className="overflow-y-auto pb-12 h-full">
              <TabsList>
                <TabsTrigger value="episode">集数</TabsTrigger>
                <TabsTrigger value="season">季</TabsTrigger>
              </TabsList>
              <TabsContent value="episode">{episodes_elm}</TabsContent>
              <TabsContent value="season">
                <div className="">
                  {seasons.map((season) => {
                    const { id, name } = season;
                    return (
                      <div
                        key={id}
                        className={cn("p-4 rounded cursor-pointer", profile.curSeason.id === id ? "bg-slate-500" : "")}
                        onClick={() => {
                          tv.fetchEpisodesOfSeason(season);
                        }}
                      >
                        <div>{name}</div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          );
        })()}
      </Sheet>
      <Sheet store={bSheet}>
        <p className="mt-8 text-center text-sm ">敬请期待</p>
      </Sheet>
      <Sheet store={cSheet}>
        {(() => {
          if (profile === null || source === null) {
            return <div>Loading</div>;
          }
          const { typeText: curTypeText, resolutions } = source;
          return (
            <div className="overflow-y-auto mt-8 pb-12 h-full">
              {resolutions.map((r) => {
                const { type, typeText } = r;
                return (
                  <div key={typeText} className="px-4">
                    <div
                      className={cn("p-4 rounded cursor-pointer", curTypeText === typeText ? "bg-slate-500" : "")}
                      onClick={() => {
                        tv.switchResolution(type);
                      }}
                    >
                      {typeText}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {/* <p className="mt-8 text-center text-sm ">敬请期待</p> */}
      </Sheet>
      <Sheet store={dSheet}>
        <p className="mt-8 text-center text-sm ">敬请期待</p>
      </Sheet>
    </div>
  );
};
