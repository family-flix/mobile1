/**
 * @file 视频播放页面
 */
import { useRef, useState } from "react";
import { ArrowLeft, Gauge, Glasses, List, Loader, MoreHorizontal, Pause, Play, RotateCw } from "lucide-react";

import { cn } from "@/utils";
import { PlayerCore } from "@/domains/player";
import { Sheet } from "@/components/ui/sheet";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { DialogCore } from "@/domains/ui/dialog";
import { Video } from "@/components/ui/video";
import { MovieCore } from "@/domains/movie";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { ScrollView } from "@/components/ui/scroll-view";

const aSheet = new DialogCore();
const bSheet = new DialogCore();
const cSheet = new DialogCore();
const dSheet = new DialogCore();

export const MoviePlayingPage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const movie = useInstance(() => new MovieCore());
  const player = useInstance(() => new PlayerCore({ app }));
  const scrollView = useInstance(() => new ScrollViewCore({}));
  const [profile, setProfile] = useState(movie.profile);
  const [curSource, setCurSource] = useState(movie.curSource);

  useInitialize(() => {
    console.log("[PAGE]play - useInitialize");

    // console.log("[PAGE]play - useInitialize");
    app.onHidden(() => {
      player.pause();
      // tv.updatePlayProgress();
    });
    app.onShow(() => {
      console.log("[PAGE]play - app.onShow", player.currentTime);
      // 锁屏后 currentTime 不是锁屏前的
      player.setCurrentTime(player.currentTime);
    });
    view.onHidden(() => {
      player.pause();
      // tv.updatePlayProgress();
    });
    // view.onUnmounted(() => {
    //   player.destroy();
    // });
    // video.onMounted(() => {
    //   connect(videoRef.current!, player);
    // });

    movie.onProfileLoaded((profile) => {
      app.setTitle(movie.getTitle().join(" - "));
      // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name);
      movie.play();
      player.setCurrentTime(profile.currentTime);
    });
    movie.onStateChange((nextProfile) => {
      setProfile(nextProfile);
    });
    movie.onTip((msg) => {
      app.tip(msg);
    });
    movie.onSourceChange((mediaSource) => {
      const { width, height } = mediaSource;
      player.pause();
      player.loadSource(mediaSource);
      player.setSize({
        width,
        height,
      });
      // console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
      player.setCurrentTime(mediaSource.currentTime);
      setCurSource(mediaSource);
    });
    player.onCanPlay(() => {
      if (!view.state.visible) {
        return;
      }
      // console.log("[PAGE]play - player.onCanPlay");
      // cover.hide();
      player.play();
    });
    player.onProgress(({ currentTime, duration }) => {
      // console.log("[PAGE]TVPlaying - onProgress", currentTime);
      movie.setCurrentTime(currentTime);
      movie.updatePlayProgress({
        currentTime,
        duration,
      });
    });
    player.onPause(({ currentTime, duration }) => {
      console.log("[PAGE]play - player.onPause", currentTime, duration);
      movie.updatePlayProgressForce({
        currentTime,
        duration,
      });
    });
    player.onEnd(() => {
      console.log("[PAGE]play - player.onEnd");
    });
    player.onVolumeChange(({ volume }) => {
      console.log("[PAGE]play - player.onVolumeChange", volume);
    });
    player.onSizeChange(({ height }) => {
      console.log("[PAGE]play - player.onSizeChange");
    });
    player.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      player.setCurrentTime(movie.currentTime);
    });
    player.onSourceLoaded(() => {
      console.log("[PAGE]play - player.onSourceLoaded", player.currentTime);
      player.setCurrentTime(player.currentTime);
    });
    console.log("[PAGE]play - before player.onError");
    player.onError((error) => {
      console.log("[PAGE]play - player.onError");
      app.tip({ text: ["视频加载错误", error.message] });
      player.pause();
    });
    player.onUrlChange(async ({ url, thumbnail }) => {
      const $video = player.node()!;
      console.log("[PAGE]play - player.onUrlChange", player.currentTime);
      //   player.setCurrentTime(player.currentTime);
      if (player.canPlayType("application/vnd.apple.mpegurl")) {
        player.load(url);
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
      player.load(url);
    });
    console.log("[PAGE]tv/play - before fetch tv profile", view.params.id);
    movie.fetchProfile(view.params.id);
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
    <>
      <ScrollView store={scrollView} className="fixed dark:text-black-200">
        <div>
          <div className="operations">
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
                "z-10 absolute inset-0"
              )}
              // onClick={toggleMenuVisible}
            >
              <div
                className="inline-block p-4"
                onClick={() => {
                  router.back();
                }}
              >
                <ArrowLeft className="w-6 h-6 dark:text-black-200" />
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
                <div className="grid grid-cols-3 gap-4 mt-18"></div>
                <div className="grid grid-cols-4 gap-2 mt-12 w-full px-2">
                  <div
                    className="flex flex-col items-center"
                    onClick={() => {
                      aSheet.show();
                    }}
                  >
                    <List className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">切换源</p>
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
                      dSheet.show();
                    }}
                  >
                    <MoreHorizontal className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">更多</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="video z-20 absolute top-[20%]">
            {(() => {
              if (profile === null) {
                return null;
              }
              return (
                <div className="">
                  {/* <ToggleView store={cover}>
                      <Show when={!!profile.curEpisode.thumbnail}>
                        <LazyImage
                          className="absolute left-0 top-0 z-20"
                          src={profile.curEpisode.thumbnail ?? undefined}
                          alt={profile.name}
                        />
                      </Show>
                      <div className="center z-30 top-20">
                        <Loader className="inline-block w-8 h-8 text-white animate-spin" />
                      </div>
                    </ToggleView> */}
                  <Video store={player} />
                </div>
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
        </div>
      </ScrollView>
      {/* <div className="h-[68px] box-content safe-bottom">
        <div className="w-full h-[68px] box-content safe-bottom"></div>
        <div className="fixed left-0 bottom-0 box-content w-screen h-[68px] bg-white-900 opacity-100 dark:bg-black-900 safe-bottom">

        </div>
      </div> */}
      <Sheet store={aSheet}>
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { sources } = profile;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pt-4 pb-24 dark:text-black-200">
                {sources.map((source) => {
                  const { file_id, file_name } = source;
                  return (
                    <div
                      key={file_id}
                      onClick={() => {
                        movie.changeSource(source);
                      }}
                    >
                      <div
                        className={cn(
                          "p-4 rounded cursor-pointer",
                          curSource?.file_id === file_id ? "bg-slate-500" : ""
                        )}
                      >
                        <div className="break-all">{file_name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={bSheet}>
        <div className="dark:text-black-200">
          <p className="mt-8 text-center text-sm ">敬请期待</p>
          {/* {players.map((p) => {
          const { name, icon, scheme } = p;
          return (
            <a className="block py-2" href={`vlc://${source?.url}`}>
              {name}
              {`vlc://${source?.url}`}
            </a>
          );
        })} */}
        </div>
      </Sheet>
      <Sheet store={cSheet}>
        {(() => {
          if (profile === null || curSource === null) {
            return <div>Loading</div>;
          }
          const { typeText: curTypeText, resolutions } = curSource;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pt-4 pb-24 dark:text-black-200">
                {resolutions.map((r, i) => {
                  const { type, typeText } = r;
                  return (
                    <div key={i}>
                      <div
                        className={cn("p-4 rounded cursor-pointer", curTypeText === typeText ? "bg-slate-500" : "")}
                        onClick={() => {
                          movie.switchResolution(type);
                        }}
                      >
                        {typeText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={dSheet}>
        {(() => {
          if (profile === null) {
            return (
              <div>
                <Loader className="animate animate-spin w-6 h-6" />
              </div>
            );
          }
          const { name, overview } = profile;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pb-24 dark:text-black-200">
                <div className="px-4">
                  <div className="text-xl">{name}</div>
                  <div className="text-sm">{overview}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </Sheet>
    </>
  );
};
